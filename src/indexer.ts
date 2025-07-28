import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, relative } from "path";
import { glob } from "glob";
import { ComponentIndex, IndexConfig, SearchResult } from "./types";

export class ComponentIndexer {
  private components: Map<string, ComponentIndex> = new Map();
  private config: IndexConfig;

  constructor(config: IndexConfig) {
    this.config = config;
    this.loadIndex();
  }

  async scanProject(): Promise<void> {
    console.log("开始扫描项目...");

    // 扫描组件
    for (const pattern of this.config.componentPaths) {
      await this.scanDirectory(pattern, "component");
    }

    // 扫描hooks
    for (const pattern of this.config.hookPaths) {
      await this.scanDirectory(pattern, "hook");
    }

    // 扫描工具函数
    for (const pattern of this.config.utilityPaths) {
      await this.scanDirectory(pattern, "utility");
    }

    // 扫描类型定义
    for (const pattern of this.config.typePaths) {
      await this.scanDirectory(pattern, "type");
    }

    this.saveIndex();
    console.log(`索引完成，共找到 ${this.components.size} 个项目`);
  }

  private async scanDirectory(
    pattern: string,
    type: ComponentIndex["type"]
  ): Promise<void> {
    const files = await glob(pattern, {
      cwd: this.config.rootPath,
      ignore: this.config.excludePatterns,
    });

    for (const file of files) {
      const fullPath = join(this.config.rootPath, file);
      await this.analyzeFile(fullPath, type);
    }
  }

  private async analyzeFile(
    filePath: string,
    type: ComponentIndex["type"]
  ): Promise<void> {
    try {
      const content = readFileSync(filePath, "utf-8");
      const fileName =
        filePath
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "";

      // 简单的组件分析逻辑
      const component: ComponentIndex = {
        id: `${type}_${fileName}_${Date.now()}`,
        name: fileName,
        path: relative(this.config.rootPath, filePath),
        type,
        description: this.extractDescription(content),
        props: this.extractProps(content),
        dependencies: this.extractDependencies(content),
        exportType: this.detectExportType(content),
        framework: this.detectFramework(content),
        complexity: this.assessComplexity(content),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: this.extractTags(content),
        usage: [],
      };

      this.components.set(component.id, component);
    } catch (error) {
      console.error(`分析文件失败: ${filePath}`, error);
    }
  }

  private extractDescription(content: string): string {
    // 提取JSDoc注释或组件描述
    const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (jsdocMatch) {
      return jsdocMatch[1].replace(/\*/g, "").trim();
    }

    // 提取单行注释
    const commentMatch = content.match(/\/\/\s*(.+)/);
    return commentMatch ? commentMatch[1].trim() : "";
  }

  private extractProps(content: string): Record<string, any> {
    const props: Record<string, any> = {};

    // 简单的props提取逻辑
    const propMatches = content.match(/interface\s+\w+Props\s*{([^}]+)}/g);
    if (propMatches) {
      propMatches.forEach((match) => {
        const propLines = match.match(/(\w+)\s*:\s*([^;\n]+)/g);
        propLines?.forEach((line) => {
          const [name, type] = line.split(":").map((s) => s.trim());
          if (name && type) {
            props[name] = type;
          }
        });
      });
    }

    return props;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    // 提取import语句
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    importMatches?.forEach((match) => {
      const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
      if (moduleMatch) {
        dependencies.push(moduleMatch[1]);
      }
    });

    return dependencies;
  }

  private detectExportType(content: string): ComponentIndex["exportType"] {
    const hasDefaultExport = content.includes("export default");
    const hasNamedExports =
      content.includes("export {") ||
      content.includes("export const") ||
      content.includes("export function");

    if (hasDefaultExport && hasNamedExports) return "both";
    if (hasDefaultExport) return "default";
    return "named";
  }

  private detectFramework(content: string): ComponentIndex["framework"] {
    if (
      content.includes("useState") ||
      content.includes("useEffect") ||
      content.includes("React")
    ) {
      return "react";
    }
    if (
      content.includes("ref(") ||
      content.includes("computed(") ||
      content.includes("Vue")
    ) {
      return "vue";
    }
    if (content.includes("$:") || content.includes("Svelte")) {
      return "svelte";
    }
    return "vanilla";
  }

  private assessComplexity(content: string): ComponentIndex["complexity"] {
    const lines = content.split("\n").length;
    const hasState = content.includes("useState") || content.includes("state");
    const hasEffects =
      content.includes("useEffect") || content.includes("watch");
    const hasProps = content.includes("props") || content.includes("interface");

    if (lines > 100 || (hasState && hasEffects && hasProps)) return "complex";
    if (lines > 50 || hasState || hasEffects) return "medium";
    return "simple";
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // 提取@标签
    const tagMatches = content.match(/@(\w+)/g);
    tagMatches?.forEach((tag) => {
      tags.push(tag.substring(1));
    });

    return tags;
  }

  searchComponents(
    query: string,
    type?: ComponentIndex["type"]
  ): SearchResult[] {
    const results: SearchResult[] = [];

    for (const component of this.components.values()) {
      if (type && component.type !== type) continue;

      const score = this.calculateScore(component, query);
      if (score > 0) {
        results.push({
          component,
          score,
          reason: this.generateReason(component, query),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private calculateScore(component: ComponentIndex, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();

    // 名称匹配
    if (component.name.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // 描述匹配
    if (component.description?.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // 标签匹配
    if (component.tags?.some((tag) => tag.toLowerCase().includes(queryLower))) {
      score += 3;
    }

    // 类型匹配
    if (component.type.toLowerCase().includes(queryLower)) {
      score += 2;
    }

    return score;
  }

  private generateReason(component: ComponentIndex, query: string): string {
    const reasons: string[] = [];

    if (component.name.toLowerCase().includes(query.toLowerCase())) {
      reasons.push("名称匹配");
    }

    if (component.description?.toLowerCase().includes(query.toLowerCase())) {
      reasons.push("描述匹配");
    }

    return reasons.join(", ");
  }

  getComponent(id: string): ComponentIndex | undefined {
    return this.components.get(id);
  }

  getAllComponents(): ComponentIndex[] {
    return Array.from(this.components.values());
  }

  private loadIndex(): void {
    if (existsSync(this.config.indexFile)) {
      try {
        const data = readFileSync(this.config.indexFile, "utf-8");
        const components = JSON.parse(data);
        this.components = new Map(
          components.map((c: ComponentIndex) => [c.id, c])
        );
      } catch (error) {
        console.error("加载索引失败:", error);
      }
    }
  }

  private saveIndex(): void {
    try {
      const data = JSON.stringify(
        Array.from(this.components.values()),
        null,
        2
      );
      writeFileSync(this.config.indexFile, data, "utf-8");
    } catch (error) {
      console.error("保存索引失败:", error);
    }
  }
}
