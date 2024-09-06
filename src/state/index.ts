import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      value: (x, y) => x.concat(y),
      default: () => [],
    })
  })