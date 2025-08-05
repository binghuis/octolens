// Core types
export * from "./analysis";
export * from "./project";

import type { ProjectMetadata } from "./project";
import type { FileAnalysisResult } from "./analysis";

// Scanner types
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

// Plugin types
export interface Plugin {
  name: string;
  version: string;
  description: string;
  priority: number;
  onRegister?(): void;
  onUnregister?(): void;
  canHandle?(path: string): boolean;
  analyzeFile?(
    path: string,
    content: string
  ): Promise<Partial<FileAnalysisResult>>;
  analyzeProject?(rootPath: string): Promise<Partial<ProjectMetadata>>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already exists`);
    }
    this.plugins.set(plugin.name, plugin);
    plugin.onRegister?.();
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.onUnregister?.();
      this.plugins.delete(name);
    }
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginsForPath(path: string): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((plugin) => plugin.canHandle?.(path) ?? false)
      .sort((a, b) => b.priority - a.priority);
  }

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
        console.error(`Plugin ${plugin.name} file analysis failed:`, error);
      }
    }

    return results;
  }

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
        console.error(`Plugin ${plugin.name} project analysis failed:`, error);
      }
    }

    return results;
  }
}

export const pluginManager = new PluginManager();
