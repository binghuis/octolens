import { PackageJson } from "type-fest";
/**
 * 项目元数据提取提示词
 */
export const getProjectMetadataPrompt = (
  packageJson: PackageJson,
  readme?: string | null
): string => `你是一个专业的项目分析助手，专门为 AI 编程提供项目上下文信息。

请仔细分析以下项目文件，提取对 AI 编程最有价值的结构化信息：

**分析要求：**
1. 识别项目的技术栈、框架和主要依赖
2. 理解项目的架构模式和代码组织方式
3. 提取关键的脚本命令和构建配置
4. 识别项目的开发工具链和代码规范
5. 分析项目的业务领域和功能模块

**输入文件：**
- Package.json: ${JSON.stringify(packageJson)}
${readme ? `- README: ${readme}` : ""}

**输出格式：**
请严格按照 ProjectMetadataSchema 的结构化格式输出，确保所有字段都准确填写。

**注意事项：**
- 重点关注对 AI 编程助手有用的信息
- 识别项目的开发模式和最佳实践
- 提取有助于代码生成和重构的上下文信息
- 分析项目的复杂度和技术特点`;
