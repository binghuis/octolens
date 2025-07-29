import type { ProjectNode, ScanResult } from "../types/index.js";

export class MCPServer {
  private scanResult?: ScanResult;
  private tools = new Map<string, Function>();

  constructor() {
    console.log("MCP Server initialized");
    this.setupTools();
  }

  /**
   * 启动服务器
   */
  async start() {
    console.log("MCP Server started");
  }

  /**
   * 设置扫描结果
   */
  setScanResult(result: ScanResult) {
    this.scanResult = result;
  }

  /**
   * 设置工具函数
   */
  private setupTools() {
    // 注册工具函数
    this.registerTool(
      "getProjectStructure",
      this.getProjectStructure.bind(this)
    );
    this.registerTool("getComponents", this.getComponents.bind(this));
    this.registerTool("getPages", this.getPages.bind(this));
    this.registerTool("getAssets", this.getAssets.bind(this));
    this.registerTool("getSimilarFiles", this.getSimilarFiles.bind(this));
    this.registerTool("getDependencies", this.getDependencies.bind(this));
    this.registerTool("getCodeStyle", this.getCodeStyle.bind(this));
    this.registerTool("searchFiles", this.searchFiles.bind(this));
    this.registerTool("getFileContent", this.getFileContent.bind(this));
    this.registerTool(
      "analyzeCodePatterns",
      this.analyzeCodePatterns.bind(this)
    );
  }

  /**
   * 注册工具函数
   */
  private registerTool(name: string, handler: Function) {
    this.tools.set(name, handler);
  }

  /**
   * 获取项目结构概览
   */
  private getProjectStructure() {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const { projectMetadata, projectStructure, fileCount, directoryCount } =
      this.scanResult;

    return {
      project: {
        name: projectMetadata.name,
        version: projectMetadata.version,
        framework: projectMetadata.framework,
        packageManager: projectMetadata.packageManager,
      },
      structure: {
        fileCount,
        directoryCount,
        root: this.simplifyNode(projectStructure),
      },
    };
  }

  /**
   * 获取组件列表
   */
  private getComponents() {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const components = this.findNodesByCategory(
      this.scanResult.projectStructure,
      "component"
    );

    return {
      components: components.map((comp) => ({
        name: comp.name,
        path: comp.path,
        metadata: comp.metadata,
      })),
    };
  }

  /**
   * 获取页面列表
   */
  private getPages() {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const pages = this.findNodesByCategory(
      this.scanResult.projectStructure,
      "page"
    );

    return {
      pages: pages.map((page) => ({
        name: page.name,
        path: page.path,
        metadata: page.metadata,
      })),
    };
  }

  /**
   * 获取可复用资产列表
   */
  private getAssets() {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const assets = this.findNodesByImportance(
      this.scanResult.projectStructure,
      "high"
    );

    return {
      assets: assets.map((asset) => ({
        name: asset.name,
        path: asset.path,
        metadata: asset.metadata,
      })),
    };
  }

  /**
   * 查找相似功能的文件
   */
  private getSimilarFiles(args: any) {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const { query } = args;
    const allFiles = this.getAllFiles(this.scanResult.projectStructure);
    const similarFiles = allFiles.filter((file) =>
      file.name.toLowerCase().includes(query.toLowerCase())
    );

    return {
      similarFiles: similarFiles.map((file) => ({
        name: file.name,
        path: file.path,
        metadata: file.metadata,
      })),
    };
  }

  /**
   * 获取依赖信息
   */
  private getDependencies() {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const { projectMetadata } = this.scanResult;

    return {
      dependencies: projectMetadata.dependencies || {},
      devDependencies: projectMetadata.devDependencies || {},
    };
  }

  /**
   * 获取代码风格特征
   */
  private getCodeStyle() {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const allFiles = this.getAllFiles(this.scanResult.projectStructure);
    const primaryLanguage = this.detectPrimaryLanguage(allFiles);
    const componentPattern = this.detectComponentPattern(allFiles);

    return {
      primaryLanguage,
      componentPattern,
      fileCount: allFiles.length,
    };
  }

  /**
   * 搜索文件
   */
  private searchFiles(args: any) {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const { pattern } = args;
    const allFiles = this.getAllFiles(this.scanResult.projectStructure);
    const matchedFiles = allFiles.filter(
      (file) => file.name.includes(pattern) || file.path.includes(pattern)
    );

    return {
      files: matchedFiles.map((file) => ({
        name: file.name,
        path: file.path,
        metadata: file.metadata,
      })),
    };
  }

  /**
   * 获取文件内容
   */
  private async getFileContent(args: any) {
    const { path } = args;
    try {
      const { readFile } = await import("fs/promises");
      const content = await readFile(path, "utf-8");
      return { content };
    } catch (error) {
      return { error: `Failed to read file: ${error}` };
    }
  }

  /**
   * 分析代码模式
   */
  private analyzeCodePatterns() {
    if (!this.scanResult) {
      return { error: "No project structure available" };
    }

    const allFiles = this.getAllFiles(this.scanResult.projectStructure);
    const componentStructure = this.analyzeComponentStructure(allFiles);
    const fileNaming = this.analyzeFileNaming(allFiles);
    const directoryStructure = this.analyzeDirectoryStructure(
      this.scanResult.projectStructure
    );

    return {
      componentStructure,
      fileNaming,
      directoryStructure,
    };
  }

  /**
   * 简化节点结构
   */
  private simplifyNode(node: ProjectNode): any {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      metadata: node.metadata,
      children: node.children?.map((child) => this.simplifyNode(child)),
    };
  }

  /**
   * 按类别查找节点
   */
  private findNodesByCategory(
    node: ProjectNode,
    category: string
  ): ProjectNode[] {
    const results: ProjectNode[] = [];

    if (node.metadata?.category === category) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByCategory(child, category));
      }
    }

    return results;
  }

  /**
   * 按重要性查找节点
   */
  private findNodesByImportance(
    node: ProjectNode,
    importance: string
  ): ProjectNode[] {
    const results: ProjectNode[] = [];

    if (node.metadata?.importance === importance) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByImportance(child, importance));
      }
    }

    return results;
  }

  /**
   * 获取所有文件
   */
  private getAllFiles(node: ProjectNode): ProjectNode[] {
    const results: ProjectNode[] = [];

    if (node.type === "file") {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.getAllFiles(child));
      }
    }

    return results;
  }

  /**
   * 检测主要编程语言
   */
  private detectPrimaryLanguage(files: ProjectNode[]): string {
    const extensions = files.map((file) => {
      const parts = file.name.split(".");
      return parts.length > 1 ? parts[parts.length - 1] : "";
    });

    const extensionCount = extensions.reduce((acc, ext) => {
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedExtensions = Object.entries(extensionCount).sort(
      (a, b) => b[1] - a[1]
    );

    return sortedExtensions[0]?.[0] || "unknown";
  }

  /**
   * 检测组件模式
   */
  private detectComponentPattern(files: ProjectNode[]): string {
    const componentFiles = files.filter(
      (file) =>
        file.name.includes("component") ||
        file.name.includes("Component") ||
        file.metadata?.category === "component"
    );

    if (componentFiles.length > 0) {
      return "component-based";
    }

    return "unknown";
  }

  /**
   * 分析组件结构
   */
  private analyzeComponentStructure(files: ProjectNode[]) {
    const componentFiles = files.filter(
      (file) => file.metadata?.category === "component"
    );

    return {
      count: componentFiles.length,
      patterns: this.analyzeNamingPatterns(componentFiles),
    };
  }

  /**
   * 分析文件命名
   */
  private analyzeFileNaming(files: ProjectNode[]) {
    const namingPatterns = files.map((file) => {
      const name = file.name;
      if (name.includes("-")) return "kebab-case";
      if (name.includes("_")) return "snake_case";
      if (/[a-z][A-Z]/.test(name)) return "camelCase";
      if (/^[A-Z]/.test(name)) return "PascalCase";
      return "unknown";
    });

    return namingPatterns.reduce((acc, pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 分析目录结构
   */
  private analyzeDirectoryStructure(node: ProjectNode) {
    const directories = this.getAllDirectories(node);
    const maxDepth = this.getMaxDepth(node);
    const commonPatterns = this.findCommonPatterns(directories);

    return {
      maxDepth,
      directoryCount: directories.length,
      commonPatterns,
    };
  }

  /**
   * 获取所有目录
   */
  private getAllDirectories(node: ProjectNode): ProjectNode[] {
    const results: ProjectNode[] = [];

    if (node.type === "directory") {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.getAllDirectories(child));
      }
    }

    return results;
  }

  /**
   * 获取最大深度
   */
  private getMaxDepth(node: ProjectNode, depth = 0): number {
    if (!node.children || node.children.length === 0) {
      return depth;
    }

    const childDepths = node.children.map((child) =>
      this.getMaxDepth(child, depth + 1)
    );

    return Math.max(...childDepths);
  }

  /**
   * 按扩展名分组
   */
  private groupByExtension(files: ProjectNode[]) {
    return files.reduce((acc, file) => {
      const ext = file.name.split(".").pop() || "no-extension";
      if (!acc[ext]) acc[ext] = [];
      acc[ext].push(file);
      return acc;
    }, {} as Record<string, ProjectNode[]>);
  }

  /**
   * 分析命名模式
   */
  private analyzeNamingPatterns(files: ProjectNode[]) {
    const patterns = files.map((file) => {
      const name = file.name;
      if (name.includes("-")) return "kebab-case";
      if (name.includes("_")) return "snake_case";
      if (/[a-z][A-Z]/.test(name)) return "camelCase";
      if (/^[A-Z]/.test(name)) return "PascalCase";
      return "unknown";
    });

    return patterns.reduce((acc, pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 查找常见模式
   */
  private findCommonPatterns(directories: ProjectNode[]) {
    const patterns = directories.map((dir) => dir.name);
    const patternCount = patterns.reduce((acc, pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(patternCount)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }
}
