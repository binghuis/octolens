import type {
  ScannerPlugin,
  EditorPlugin,
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

// 抽象基类：编辑器插件
export abstract class BaseEditorPlugin implements EditorPlugin {
  abstract name: string;
  abstract version: string;

  validate(config: ScanConfig): boolean {
    return Boolean(config.rootPath);
  }

  abstract integrate(config: ScanConfig): Promise<void>;
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

// 插件注册器
export class PluginRegistry {
  private static instance: PluginRegistry;
  private scannerPlugins = new Map<string, ScannerPlugin>();
  private editorPlugins = new Map<string, EditorPlugin>();
  private aiProviders = new Map<string, AIProvider>();

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  // 注册扫描器插件
  registerScannerPlugin(plugin: ScannerPlugin): void {
    this.scannerPlugins.set(plugin.name, plugin);
    console.log(`Registered scanner plugin: ${plugin.name} v${plugin.version}`);
  }

  // 注册编辑器插件
  registerEditorPlugin(plugin: EditorPlugin): void {
    this.editorPlugins.set(plugin.name, plugin);
    console.log(`Registered editor plugin: ${plugin.name} v${plugin.version}`);
  }

  // 注册 AI 提供商
  registerAIProvider(provider: AIProvider): void {
    this.aiProviders.set(provider.name, provider);
    console.log(
      `Registered AI provider: ${provider.name} v${provider.version}`
    );
  }

  // 获取扫描器插件
  getScannerPlugin(name: string): ScannerPlugin | undefined {
    return this.scannerPlugins.get(name);
  }

  // 获取编辑器插件
  getEditorPlugin(name: string): EditorPlugin | undefined {
    return this.editorPlugins.get(name);
  }

  // 获取 AI 提供商
  getAIProvider(name: string): AIProvider | undefined {
    return this.aiProviders.get(name);
  }

  // 获取所有扫描器插件
  getScannerPlugins(): ScannerPlugin[] {
    return Array.from(this.scannerPlugins.values());
  }

  // 获取所有编辑器插件
  getEditorPlugins(): EditorPlugin[] {
    return Array.from(this.editorPlugins.values());
  }

  // 获取所有 AI 提供商
  getAIProviders(): AIProvider[] {
    return Array.from(this.aiProviders.values());
  }

  // 获取所有插件
  getPlugins(): Array<ScannerPlugin | EditorPlugin | AIProvider> {
    return [
      ...this.getScannerPlugins(),
      ...this.getEditorPlugins(),
      ...this.getAIProviders(),
    ];
  }

  // 卸载插件
  unregisterPlugin(name: string): boolean {
    const scannerRemoved = this.scannerPlugins.delete(name);
    const editorRemoved = this.editorPlugins.delete(name);
    const aiRemoved = this.aiProviders.delete(name);

    if (scannerRemoved || editorRemoved || aiRemoved) {
      console.log(`Unregistered plugin: ${name}`);
      return true;
    }
    return false;
  }

  // 清空所有插件
  clear(): void {
    this.scannerPlugins.clear();
    this.editorPlugins.clear();
    this.aiProviders.clear();
    console.log("All plugins cleared");
  }
}
