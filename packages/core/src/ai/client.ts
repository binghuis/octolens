import { ChatDeepSeek } from "@langchain/deepseek";
import { ProjectMetadataSchema } from "../types/project-metadata";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

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

export const structuredModel = model.withStructuredOutput(
  ProjectMetadataSchema
);

const prompt = ChatPromptTemplate.fromMessages([
  new SystemMessage(
    `分析以下项目文件，提取对 AI 编程最有价值的信息。

Package.json: {packageJson}
README: {readme}`
  ),
  new HumanMessage("{input}"),
]);

const chain = prompt.pipe(structuredModel);

const result = await chain.invoke({ input: "Hello, how are you?" });

console.log(result);
