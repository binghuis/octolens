import { readFile, readdir, stat } from "fs/promises";
import { join, relative } from "path";
import type {
  ProjectNode,
  NodeMetadata,
  ProjectMetadata,
  ScanConfig,
  ScanResult,
} from "../types/index.js";

export class ProjectScanner {
  private config: ScanConfig;

  constructor(config: ScanConfig) {
    this.config = config;
  }

  /**
   * 扫描项目
   */
  async scan(): Promise<ScanResult> {
    const startTime = Date.now();
    console.log("Starting project scan...");

    try {
      // 1. 扫描项目元数据
      const projectMetadata = await this.scanProjectMetadata();

      // 2. 扫描目录结构
      const projectStructure = await this.scanDirectoryStructure();

      // 3. 统计文件数量
      const { fileCount, directoryCount } = this.countNodes(projectStructure);

      const scanTime = Date.now() - startTime;
      console.log(`Scan completed in ${scanTime}ms`);
      console.log(`Found ${fileCount} files and ${directoryCount} directories`);

      return {
        projectMetadata,
        projectStructure,
        fileCount,
        directoryCount,
        scanTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Scan failed:", error);
      throw error;
    }
  }

  /**
   * 扫描项目元数据
   */
  private async scanProjectMetadata(): Promise<ProjectMetadata> {
    const packageJsonPath = join(this.config.rootPath, "package.json");

    try {
      const content = await readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);

      return {
        name: packageJson.name || "unknown",
        version: packageJson.version,
        description: packageJson.description,
        framework: this.detectFramework(packageJson),
        packageManager: this.detectPackageManager(),
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        configFiles: await this.findConfigFiles(),
      };
    } catch (error) {
      console.warn("Failed to read package.json:", error);
      return {
        name: "unknown",
        framework: "unknown",
        packageManager: "unknown",
        dependencies: {},
        devDependencies: {},
        configFiles: [],
      };
    }
  }

  /**
   * 扫描目录结构
   */
  private async scanDirectoryStructure(): Promise<ProjectNode> {
    const rootNode: ProjectNode = {
      id: "root",
      name: "root",
      path: this.config.rootPath,
      type: "directory",
      children: [],
    };

    await this.scanDirectory(rootNode, 0);
    return rootNode;
  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(
    parentNode: ProjectNode,
    depth: number
  ): Promise<void> {
    if (depth >= this.config.maxDepth) {
      return;
    }

    try {
      const entries = await readdir(parentNode.path, { withFileTypes: true });

      // 并发处理所有 entry
      const tasks = entries.map(async (entry) => {
        const fullPath = join(parentNode.path, entry.name);
        const relativePath = relative(this.config.rootPath, fullPath);

        // 检查是否应该忽略
        if (this.shouldIgnore(relativePath)) {
          return;
        }

        const node: ProjectNode = {
          id: relativePath || "root",
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? "directory" : "file",
        };

        if (entry.isFile()) {
          // 分析文件
          const fileStats = await stat(fullPath);
          node.size = fileStats.size;
          node.metadata = await this.analyzeFile(node);
        } else if (entry.isDirectory()) {
          // 递归扫描子目录
          node.children = [];
          await this.scanDirectory(node, depth + 1);
        }

        parentNode.children = parentNode.children || [];
        parentNode.children.push(node);
      });

      await Promise.all(tasks);
    } catch (error) {
      console.warn(`Failed to scan directory ${parentNode.path}:`, error);
    }
  }

  /**
   * 分析文件
   */
  private async analyzeFile(node: ProjectNode): Promise<NodeMetadata> {
    const metadata: NodeMetadata = {
      category: this.categorizeFile(node.name),
      importance: this.assessImportance(node.name),
      tags: this.generateTags(node.name),
      framework: this.detectFrameworkFromFile(node.name),
    };

    return metadata;
  }

  /**
   * 检测框架
   */
  private detectFramework(packageJson: any): string {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (dependencies.next) return "nextjs";
    if (dependencies.vue) return "vue";
    if (dependencies.angular) return "angular";
    if (dependencies.react) return "react";
    if (dependencies.vite) return "vite";
    if (dependencies.webpack) return "webpack";

    return "unknown";
  }

  /**
   * 检测包管理器
   */
  private detectPackageManager(): string {
    try {
      // 检查是否存在 yarn.lock
      if (require("fs").existsSync(join(this.config.rootPath, "yarn.lock"))) {
        return "yarn";
      }
      // 检查是否存在 pnpm-lock.yaml
      if (
        require("fs").existsSync(join(this.config.rootPath, "pnpm-lock.yaml"))
      ) {
        return "pnpm";
      }
      // 默认使用 npm
      return "npm";
    } catch {
      return "npm";
    }
  }

  /**
   * 查找配置文件
   */
  private async findConfigFiles(): Promise<string[]> {
    const configFiles = [
      "tsconfig.json",
      "vite.config.ts",
      "vite.config.js",
      "next.config.js",
      "webpack.config.js",
      "tailwind.config.js",
      "eslint.config.js",
      ".eslintrc.js",
      "prettier.config.js",
      ".prettierrc",
    ];

    const foundFiles: string[] = [];

    for (const file of configFiles) {
      try {
        await readFile(join(this.config.rootPath, file), "utf-8");
        foundFiles.push(file);
      } catch {
        // 文件不存在
      }
    }

    return foundFiles;
  }

  /**
   * 检查是否应该忽略文件/目录
   */
  private shouldIgnore(relativePath: string): boolean {
    const ignorePatterns = this.config.ignorePatterns || [];

    return ignorePatterns.some((pattern) => {
      if (pattern.includes("*")) {
        // 简单的通配符匹配
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  /**
   * 分类文件
   */
  private categorizeFile(filename: string): NodeMetadata["category"] {
    const ext = filename.split(".").pop()?.toLowerCase();
    const name = filename.toLowerCase();

    if (name.includes("component") || name.includes("comp")) return "component";
    if (name.includes("page") || name.includes("route")) return "page";
    if (name.includes("api") || name.includes("service")) return "api";
    if (name.includes("hook") || name.includes("use")) return "hook";
    if (name.includes("type") || name.includes("interface")) return "type";
    if (ext === "css" || ext === "scss" || ext === "sass" || ext === "less")
      return "style";
    if (name.includes("config") || name.includes("conf")) return "config";
    if (name.includes("test") || name.includes("spec")) return "test";
    if (name.includes("readme") || name.includes("doc")) return "documentation";
    if (ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx")
      return "utility";

    return "other";
  }

  /**
   * 评估重要性
   */
  private assessImportance(filename: string): "high" | "medium" | "low" {
    const name = filename.toLowerCase();

    if (name.includes("index") || name.includes("main") || name.includes("app"))
      return "high";
    if (name.includes("config") || name.includes("package")) return "high";
    if (name.includes("component") || name.includes("page")) return "medium";
    if (name.includes("test") || name.includes("spec")) return "low";

    return "medium";
  }

  /**
   * 生成标签
   */
  private generateTags(filename: string): string[] {
    const tags: string[] = [];
    const name = filename.toLowerCase();
    const ext = filename.split(".").pop()?.toLowerCase();

    if (ext) tags.push(ext);
    if (name.includes("component")) tags.push("component");
    if (name.includes("page")) tags.push("page");
    if (name.includes("api")) tags.push("api");
    if (name.includes("hook")) tags.push("hook");
    if (name.includes("type")) tags.push("type");
    if (name.includes("test")) tags.push("test");
    if (name.includes("config")) tags.push("config");

    return tags;
  }

  /**
   * 从文件名检测框架
   */
  private detectFrameworkFromFile(filename: string): string {
    const name = filename.toLowerCase();

    if (name.includes("next")) return "nextjs";
    if (name.includes("vite")) return "vite";
    if (name.includes("vue")) return "vue";
    if (name.includes("angular")) return "angular";
    if (name.includes("react")) return "react";
    if (name.includes("webpack")) return "webpack";

    return "unknown";
  }

  /**
   * 统计节点数量
   */
  private countNodes(node: ProjectNode): {
    fileCount: number;
    directoryCount: number;
  } {
    let fileCount = 0;
    let directoryCount = 0;

    if (node.type === "file") {
      fileCount++;
    } else if (node.type === "directory") {
      directoryCount++;
      if (node.children) {
        for (const child of node.children) {
          const counts = this.countNodes(child);
          fileCount += counts.fileCount;
          directoryCount += counts.directoryCount;
        }
      }
    }

    return { fileCount, directoryCount };
  }
}
