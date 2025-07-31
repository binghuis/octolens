import { ChatDeepSeek } from "@langchain/deepseek";

enum DeepSeekModel {
  // 聊天模型
  DeepSeekChat = "deepseek-chat",
  // 推理模型
  DeepSeekReasoner = "deepseek-reasoner",
}

const API_KEY = process.env.DEEPSEEK_API_KEY;

export const chatModel = new ChatDeepSeek({
  model: DeepSeekModel.DeepSeekChat,
  temperature: 0,
  apiKey: API_KEY,
  streaming: false,
});

export const reasoningModel = new ChatDeepSeek({
  model: DeepSeekModel.DeepSeekReasoner,
  temperature: 0.5,
  apiKey: API_KEY,
  streaming: true,
});
