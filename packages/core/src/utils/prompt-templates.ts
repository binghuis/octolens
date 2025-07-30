import { readProjectFiles } from "./project-reader.js";

/**
 * AI编程提示词模板
 */
export class PromptTemplates {
  /**
   * 项目分析提示词
   */
  static getProjectAnalysisPrompt(rootPath: string = process.cwd()) {
    const { packageJson, readme } = readProjectFiles(rootPath);

    return `
分析以下项目文件，提取对 AI 编程最有价值的信息：

Package.json: ${JSON.stringify(packageJson, null, 2)}
README: ${readme}

重点关注：
1. 项目描述
2. 项目依赖
3. 项目脚本

请直接输出结构化的JSON数据。
`;
  }

  /**
   * 代码生成提示词
   */
  static getCodeGenerationPrompt(requirements: string, context?: string) {
    return `
基于以下需求生成代码：

需求：${requirements}
${context ? `上下文：${context}` : ""}

要求：
1. 遵循项目现有的代码风格和约定
2. 使用项目中的技术栈和依赖
3. 保持代码简洁和可维护性
4. 添加必要的注释和类型定义
5. 考虑错误处理和边界情况

请直接输出代码，不需要解释。
`;
  }

  /**
   * 代码重构提示词
   */
  static getRefactorPrompt(code: string, target: string) {
    return `
重构以下代码，目标：${target}

代码：
\`\`\`
${code}
\`\`\`

要求：
1. 保持原有功能不变
2. 提高代码质量和可读性
3. 遵循最佳实践
4. 优化性能和可维护性

请直接输出重构后的代码。
`;
  }

  /**
   * 问题诊断提示词
   */
  static getDebugPrompt(error: string, code?: string) {
    return `
诊断以下问题：

错误信息：${error}
${code ? `相关代码：\`\`\`\n${code}\n\`\`\`` : ""}

请提供：
1. 问题原因分析
2. 解决方案
3. 预防措施
`;
  }

  /**
   * 测试生成提示词
   */
  static getTestGenerationPrompt(code: string, testType: string = "unit") {
    return `
为以下代码生成${testType}测试：

\`\`\`
${code}
\`\`\`

要求：
1. 覆盖主要功能和边界情况
2. 使用项目中的测试框架
3. 测试用例清晰易懂
4. 包含正向和异常测试

请直接输出测试代码。
`;
  }

  /**
   * 文档生成提示词
   */
  static getDocumentationPrompt(code: string, docType: string = "API") {
    return `
为以下代码生成${docType}文档：

\`\`\`
${code}
\`\`\`

要求：
1. 清晰说明功能和用途
2. 详细描述参数和返回值
3. 提供使用示例
4. 说明注意事项和限制

请直接输出文档。
`;
  }
}
