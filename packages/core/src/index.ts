// 导出核心功能
export { OctoLens } from "./octolens.js";
export { ProjectScanner } from "./core/scanner.js";
export { ProjectWatcher } from "./core/watcher.js";
export { LocalAIProvider } from "./ai/local-ai-provider.js";
export { MCPServer } from "./mcp/server.js";
export { BaseScannerPlugin, BaseAIProvider } from "./plugins/base.js";

// 导出类型
export type {
  ProjectNode,
  NodeMetadata,
  ProjectMetadata,
  ScanConfig,
  ScanResult,
  AIConfig,
  FileChangeEvent,
  WatcherConfig,
  MCPToolArgs,
  PluginConfig,
  ScannerPlugin,
  AIProvider,
} from "./types/index.js";
