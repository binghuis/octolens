import type {
  ScannerPlugin,
  AIProvider,
  ScanConfig,
  AIConfig,
  ProjectNode,
  NodeMetadata,
} from "../types/index.js";

// 抽象基类：扫描器插件
export abstract class BaseScannerPlugin implements ScannerPlugin {
  abstract name: string;
  abstract version: string;

  validate(config: ScanConfig): boolean {
    return Boolean(config.rootPath && config.maxDepth > 0);
  }

  abstract scan(config: ScanConfig): Promise<Partial<any>>;
}

// 抽象基类：AI 提供商
export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  abstract version: string;

  validate(config: AIConfig): boolean {
    return Boolean(config.model && config.baseUrl);
  }

  abstract analyze(structure: ProjectNode): Promise<ProjectNode>;
  abstract filter(nodes: ProjectNode[]): Promise<ProjectNode[]>;
  abstract annotate(node: ProjectNode): Promise<NodeMetadata>;

  // 日志方法
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected error(message: string, error?: any): void {
    console.error(`[${this.name}] ${message}`, error);
  }
}
