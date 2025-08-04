// 导出类型定义
export interface ScanConfig {
  rootPath: string;
  maxDepth: number;
  enableAI: boolean;
  ignorePatterns: string[];
  aiConfig?: AIConfig;
  enableWatch?: boolean;
}

export interface AIConfig {
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface ScanResult {
  projectMetadata: ProjectMetadata;
  fileCount: number;
  directoryCount: number;
  files: FileAnalysisResult[];
}

export interface ProjectMetadata {
  name: string;
  framework?: string;
  description?: string;
  version?: string;
}

export interface FileAnalysisResult {
  path: string;
  type: string;
  size: number;
  lastModified: Date;
  content?: string;
  analysis?: any;
}

// 导出 Logger
export { Logger, logger } from "./utils/logger";

// 导出 OctoLens 类
export { OctoLens } from "./core/octolens";
