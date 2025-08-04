// 核心类型定义
export * from "./types";

// 配置管理
export * from "./config";

// 工具函数
export { Logger, logger } from "./utils/logger";
export { PerformanceTracker } from "./utils/performance-tracker";
export {
  getProjectMetadata,
  analyzeProjectStructure,
  analyzeProjectWithAI,
  getIgnoredFiles,
} from "./utils/project-reader";
export {
  collectAndSortFiles,
  buildDynamicBatches,
  readFileWithStrategy,
  processContentOptimized,
} from "./utils/file-processor";
export {
  DEFAULT_ANALYSIS_OPTIONS,
  AnalysisOptions,
  FILE_PRIORITY_WEIGHTS,
} from "./utils/default-options";

// AI 功能
export { chatModel, reasoningModel } from "./ai/client";
export { fileAnalysisChain } from "./ai/genFileAnalysisResult";

// 插件系统
export { Plugin, PluginManager, pluginManager } from "./plugins";

// MCP 协议
export {
  MCPServer,
  MCPClient,
  OctoLensMCPServer,
  OctoLensMCPClient,
} from "./mcp";

// 提示词
export { getFileAnalysisPrompt } from "./prompts/file-analysis";
export { getProjectMetadataPrompt } from "./prompts/project-analysis";

// 核心扫描器
export { OctoLensScanner } from "./scanner";
