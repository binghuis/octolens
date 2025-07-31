import type { Runnable } from "@langchain/core/runnables";
import { chatModel } from "./client";
import { FileAnalysisResultSchema } from "../types/file-analysis-result";
import { getFileAnalysisPrompt } from "../prompts/file-analysis";

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
