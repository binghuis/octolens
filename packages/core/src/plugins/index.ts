import type { FileAnalysisResult, ProjectMetadata } from "../types";

// 插件接口定义
export interface Plugin {
  name: string;
  version: string;
  description: string;
  priority: number;

  // 插件生命周期
  onRegister?(): void;
  onUnregister?(): void;

  // 核心功能
  canHandle?(path: string): boolean;
  analyzeFile?(
    path: string,
    content: string
  ): Promise<Partial<FileAnalysisResult>>;
  analyzeProject?(rootPath: string): Promise<Partial<ProjectMetadata>>;
}

// 插件管理器
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  // 注册插件
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已存在`);
    }

    this.plugins.set(plugin.name, plugin);
    plugin.onRegister?.();
  }

  // 注销插件
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.onUnregister?.();
      this.plugins.delete(name);
    }
  }

  // 获取插件
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  // 获取所有插件
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // 获取可处理指定路径的插件
  getPluginsForPath(path: string): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((plugin) => plugin.canHandle?.(path) ?? false)
      .sort((a, b) => b.priority - a.priority);
  }

  // 分析文件
  async analyzeFile(
    path: string,
    content: string
  ): Promise<FileAnalysisResult[]> {
    const plugins = this.getPluginsForPath(path);
    const results: FileAnalysisResult[] = [];

    for (const plugin of plugins) {
      try {
        const result = await plugin.analyzeFile?.(path, content);
        if (result) {
          results.push(result as FileAnalysisResult);
        }
      } catch (error) {
        console.error(`插件 ${plugin.name} 分析文件失败:`, error);
      }
    }

    return results;
  }

  // 分析项目
  async analyzeProject(rootPath: string): Promise<ProjectMetadata[]> {
    const plugins = this.getAllPlugins();
    const results: ProjectMetadata[] = [];

    for (const plugin of plugins) {
      try {
        const result = await plugin.analyzeProject?.(rootPath);
        if (result) {
          results.push(result as ProjectMetadata);
        }
      } catch (error) {
        console.error(`插件 ${plugin.name} 分析项目失败:`, error);
      }
    }

    return results;
  }
}

// 导出单例实例
export const pluginManager = new PluginManager();
