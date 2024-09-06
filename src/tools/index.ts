import { ToolNode } from "@langchain/langgraph/prebuilt";
import { GraphState } from "../state";
import { createOrGetVectorStore } from "../utils/vectorStore";
import { createRetrieverTool } from "langchain/tools/retriever";


export const initTools = async ({
    pdfPaths,
}:
    {
        pdfPaths: string[];
    }
) => {

    const vectorStore = await createOrGetVectorStore('chroma', pdfPaths);
    const retriever = vectorStore.asRetriever();

    const tool = createRetrieverTool(
        retriever,
        {
            name: process.env.RETREIVER_TOOL_NAME || 'retriever',
            description: process.env.RETREIVER_TOOL_DESCRIPTION || '',
        },
    );
    const tools = [tool];

    const toolNode = new ToolNode<typeof GraphState.State>(tools);


    return {
        tools,
        toolNode,
    }
}



