import type { Runnable } from "@langchain/core/runnables";
import { chatModel } from "./client";
import { ProjectMetadataSchema } from "../types/project-metadata";
import { getProjectMetadata } from "../utils/project-reader";
import { getProjectMetadataPrompt } from "../prompts/project-analysis";

export const structuredModel: Runnable = chatModel.withStructuredOutput(
  ProjectMetadataSchema
);

const { packageJson, readme } = getProjectMetadata();

const prompt = getProjectMetadataPrompt(packageJson, readme);

const result = await structuredModel.invoke(prompt);

console.log(result);
