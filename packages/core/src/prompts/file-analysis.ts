import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const getFileAnalysisPrompt = ChatPromptTemplate.fromMessages([
  new HumanMessage(`请分析以下代码文件，判断其类型（页面、组件、Hook、工具函数等）并提取关键信息：

文件路径: {filePath}
文件内容:
{fileContent}

请返回JSON格式的分析结果，包含：文件类型、功能描述、业务场景、依赖关系等关键信息。
  `),
]);
