import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage } from '@langchain/core/messages';
import { GraphState } from './state';
import { initTools } from './tools';
import { initNodesAndEdges } from './nodes';
import { randomUUID } from 'crypto';

const app = express();
app.use(bodyParser.json());

let workflow;
let compiledApp: any;

async function initializeWorkflow() {
  const pdfPaths = ['docs/Client_Onboarding_Packet.pdf'];

  try {
    const { toolNode, tools } = await initTools({ pdfPaths });
    const { nodes, contitionalEdges } = await initNodesAndEdges({ tools });

    workflow = new StateGraph(GraphState)
      .addNode("agent", nodes.agent)
      .addNode("retrieve", toolNode)
      .addNode("gradeDocuments", nodes.gradeDocuments)
      .addNode("rewrite", nodes.rewrite)
      .addNode("generate", nodes.generate);

    workflow.addEdge(START, "agent");
    workflow.addConditionalEdges("agent", contitionalEdges.shouldRetrieve);
    workflow.addEdge("retrieve", "gradeDocuments");
    workflow.addConditionalEdges("gradeDocuments", contitionalEdges.checkRelevance, {
      yes: "generate",
      no: "rewrite",
    });
    workflow.addEdge("generate", END);
    workflow.addEdge("rewrite", "agent");

    const memory = new MemorySaver()

    compiledApp = workflow.compile({
      checkpointer: memory,
    })

  } catch (error) {
    console.error('Error initializing workflow:', error);
  }
}

// Initialize the workflow when the server starts
initializeWorkflow();

app.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  const { useStream } = req.query;

  let threadId = req.body.threadId;
  let annotation = ''

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!threadId) {
    threadId = randomUUID();
    annotation = 'Thread ID not provided. Generated new thread ID.'
  }

  try {

    const config = {
      configurable: {
        thread_id: threadId,
      },
    }

    const input = {
      messages: [new HumanMessage(message)],
    }

    if (useStream) {

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      let finalState: any;
      for await (const output of await compiledApp.stream(input, config)) {
        for (const [key, value] of Object.entries(output)) {
          const lastMsg = output[key].messages[output[key].messages.length - 1];
          console.log(`Output from node: '${key}'`);
          const eventData = {
            type: lastMsg._getType(),
            content: lastMsg.content,
            tool_calls: lastMsg.tool_calls,
          }
          console.dir(eventData, { depth: null });
          res.write(`data: ${JSON.stringify(eventData)}\n\n`);

          // Guardamos el estado final para la sesión
          finalState = value;
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else {
      const finalState = await compiledApp.invoke(
        input,
        config,
      );

      const lastMessage = finalState.messages[finalState.messages.length - 1];

      res.json({
        response: lastMessage.content,
        threadId,
        annotation
      });
    }




  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'An error occurred while processing your message' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});