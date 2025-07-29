// 基础接口定义
export interface ProjectNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  metadata?: NodeMetadata;
  children?: ProjectNode[];
}

export interface NodeMetadata {
  description?: string;
  category?:
    | "component"
    | "page"
    | "api"
    | "utility"
    | "hook"
    | "type"
    | "style"
    | "config"
    | "documentation"
    | "test"
    | "other";
  tags?: string[];
  importance?: "high" | "medium" | "low";
  framework?: string;
}

export interface ProjectMetadata {
  name: string;
  version?: string;
  description?: string;
  framework?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  configFiles?: string[];
  buildTool?: "webpack" | "turbopack" | "unknown";
  /**
   * 插件扩展元信息，建议所有自定义字段统一放在 meta 下
   */
  meta?: Record<string, any>;
}

export interface ScanConfig {
  rootPath: string;
  ignorePatterns: string[];
  includePatterns?: string[];
  maxDepth: number;
  enableAI: boolean;
  aiConfig?: {
    model?: string;
    baseUrl?: string;
  };
}

export interface ScanResult {
  projectMetadata: ProjectMetadata;
  projectStructure: ProjectNode;
  fileCount: number;
  directoryCount: number;
  scanTime: number;
  timestamp: Date;
}

export interface AIConfig {
  model: string;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
}

export interface FileChangeEvent {
  type: "add" | "change" | "unlink" | "addDir" | "unlinkDir";
  path: string;
  relativePath: string;
  timestamp: Date;
}

export interface WatcherConfig extends ScanConfig {
  watchPatterns?: string[];
  debounceMs?: number;
}

export interface MCPToolArgs {
  query?: string;
  pattern?: string;
  path?: string;
  category?: string;
  importance?: string;
}

export interface PluginConfig {
  name: string;
  version: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

// 插件系统接口
export interface ScannerPlugin {
  name: string;
  version: string;
  validate(config: ScanConfig): boolean;
  scan(config: ScanConfig): Promise<Partial<ScanResult>>;
}

export interface AIProvider {
  name: string;
  version: string;
  validate(config: AIConfig): boolean;
  analyze(structure: ProjectNode): Promise<ProjectNode>;
  filter(nodes: ProjectNode[]): Promise<ProjectNode[]>;
  annotate(node: ProjectNode): Promise<NodeMetadata>;
}
