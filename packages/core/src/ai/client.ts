import { ChatDeepSeek } from "@langchain/deepseek";
import {
  ProjectMetadataSchema,
  type ProjectMetadata,
} from "../types/project-metadata";
import { getProjectMetadataPrompt } from "../prompts/project-analysis.js";
import { getProjectMetadata } from "../utils/project-reader.js";
import type { Runnable } from "@langchain/core/runnables";

enum DeepSeekModel {
  // 聊天模型
  DeepSeekChat = "deepseek-chat",
  // 推理模型
  DeepSeekReasoner = "deepseek-reasoner",
}

const API_KEY = process.env.DEEPSEEK_API_KEY;

const model = new ChatDeepSeek({
  model: DeepSeekModel.DeepSeekChat,
  temperature: 0,
  apiKey: API_KEY,
  streaming: false,
});

export const structuredModel: Runnable = model.withStructuredOutput(
  ProjectMetadataSchema
);

const { packageJson, readme } = getProjectMetadata();

const prompt = getProjectMetadataPrompt(packageJson, readme);

const result = await structuredModel.invoke(prompt);

console.log(result);
