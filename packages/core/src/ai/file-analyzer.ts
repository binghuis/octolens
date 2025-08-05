import type { Runnable } from "@langchain/core/runnables";
import { chatModel } from "./llm-client";
import { FileAnalysisResultSchema } from "../types/analysis";
import { getFileAnalysisPrompt } from "../prompts/files";

export const structuredModel: Runnable = chatModel.withStructuredOutput(
  FileAnalysisResultSchema
);

const fileAnalysischain = getFileAnalysisPrompt.pipe(structuredModel);

export const fileAnalysisChain = async (
  filePath: string,
  fileContent: string
) => {
  const result = await fileAnalysischain.invoke({
    filePath,
    fileContent,
  });
  return result;
};
