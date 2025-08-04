// 先导入类型定义
import type { ProjectMetadata } from "./project-metadata";
import type { FileAnalysisResult } from "./file-analysis-result";

// 核心类型定义
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
  baseUrl?: string;
}

export interface ScanResult {
  projectMetadata: ProjectMetadata;
  fileCount: number;
  directoryCount: number;
  files: FileAnalysisResult[];
  scanTime: Date;
  duration: number;
}

// 重新导出其他类型文件
export * from "./project-metadata";
export * from "./file-analysis-result";
