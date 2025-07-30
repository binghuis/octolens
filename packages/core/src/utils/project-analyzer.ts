import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  ProjectMetadata,
  ProjectMetadataSchema,
} from "../types/project-metadata";

/**
 * 项目分析器 - 从package.json中提取关键信息
 */
export class ProjectAnalyzer {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * 分析项目并生成元信息
   */
  async analyze(): Promise<ProjectMetadata> {
    const packageJson = this.readPackageJson();
    const configFiles = this.detectConfigFiles();
    const structure = this.analyzeStructure();
    const dependencies = this.analyzeDependencies(packageJson);
    const codingStyle = this.detectCodingStyle(configFiles);
    const techStack = this.analyzeTechStack(packageJson, configFiles);

    return {
      project: {
        name: packageJson.name || "unknown",
        type: this.detectProjectType(packageJson, configFiles),
        framework: this.detectFramework(packageJson, configFiles),
        language: this.detectLanguage(configFiles),
        packageManager: this.detectPackageManager(),
      },
      techStack,
      structure,
      dependencies,
      codingStyle,
      configuration: {
        build: {
          entry: this.detectEntryPoint(packageJson),
          output: this.detectOutputDir(packageJson),
          target: this.detectBuildTarget(configFiles),
        },
        scripts: this.parseScripts(packageJson.scripts || {}),
        environments: this.detectEnvironments(),
      },
      aiContext: {
        patterns: this.detectCodePatterns(),
        utilities: this.detectUtilities(),
        types: this.detectTypes(),
      },
    };
  }

  /**
   * 读取package.json文件
   */
  private readPackageJson(): any {
    const packagePath = join(this.rootPath, "package.json");
    if (!existsSync(packagePath)) {
      throw new Error("package.json not found");
    }
    return JSON.parse(readFileSync(packagePath, "utf-8"));
  }

  /**
   * 检测配置文件
   */
  private detectConfigFiles(): string[] {
    const configFiles = [];
    const configPatterns = [
      "tsconfig.json",
      "vite.config.ts",
      "vite.config.js",
      "webpack.config.js",
      "webpack.config.ts",
      "rollup.config.js",
      "rollup.config.ts",
      "eslint.config.js",
      ".eslintrc.js",
      ".eslintrc.json",
      "prettier.config.js",
      ".prettierrc",
      "jest.config.js",
      "vitest.config.ts",
      "tailwind.config.js",
      "next.config.js",
      "nuxt.config.ts",
      "astro.config.mjs",
    ];

    for (const pattern of configPatterns) {
      if (existsSync(join(this.rootPath, pattern))) {
        configFiles.push(pattern);
      }
    }

    return configFiles;
  }

  /**
   * 分析项目结构
   */
  private analyzeStructure() {
    return {
      conventions: {
        srcDir: this.detectSrcDir(),
        testDir: this.detectTestDir(),
        distDir: this.detectDistDir(),
        configDir: "config",
        docsDir: "docs",
      },
      naming: {
        components: "PascalCase",
        pages: "kebab-case",
        utils: "camelCase",
        tests: "camelCase.test",
      },
      patterns: this.detectArchitecturePatterns(),
    };
  }

  /**
   * 分析依赖关系
   */
  private analyzeDependencies(packageJson: any) {
    const core: any[] = [];
    const dev: any[] = [];

    // 分析生产依赖
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        core.push({
          name,
          version: version as string,
          purpose: this.getDependencyPurpose(name),
        });
      }
    }

    // 分析开发依赖
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(
        packageJson.devDependencies
      )) {
        dev.push({
          name,
          version: version as string,
          purpose: this.getDevDependencyPurpose(name),
        });
      }
    }

    return { core, dev };
  }

  /**
   * 检测代码风格
   */
  private detectCodingStyle(configFiles: string[]) {
    const hasPrettier = configFiles.some((f) => f.includes("prettier"));
    const hasEslint = configFiles.some((f) => f.includes("eslint"));
    const hasTypeScript = configFiles.some((f) => f.includes("tsconfig"));

    return {
      style: {
        indentation: "spaces" as const,
        quoteStyle: "double" as const,
        semicolons: true,
        trailingComma: true,
      },
      naming: {
        variables: "camelCase",
        functions: "camelCase",
        classes: "PascalCase",
        constants: "UPPER_SNAKE_CASE",
      },
      organization: {
        imports: "grouped",
        exports: "named",
        comments: "JSDoc",
      },
    };
  }

  /**
   * 分析技术栈
   */
  private analyzeTechStack(packageJson: any, configFiles: string[]) {
    const frontend: any = {};
    const backend: any = {};
    const tools: any = {};

    // 检测前端技术
    if (this.hasDependency(packageJson, "react")) {
      frontend.framework = "React";
    } else if (this.hasDependency(packageJson, "vue")) {
      frontend.framework = "Vue";
    } else if (this.hasDependency(packageJson, "svelte")) {
      frontend.framework = "Svelte";
    }

    if (this.hasDependency(packageJson, "vite")) {
      frontend.bundler = "Vite";
    } else if (this.hasDependency(packageJson, "webpack")) {
      frontend.bundler = "Webpack";
    }

    if (this.hasDependency(packageJson, "tailwindcss")) {
      frontend.cssFramework = "Tailwind CSS";
    }

    // 检测后端技术
    if (this.hasDependency(packageJson, "express")) {
      backend.framework = "Express";
    } else if (this.hasDependency(packageJson, "fastify")) {
      backend.framework = "Fastify";
    } else if (this.hasDependency(packageJson, "koa")) {
      backend.framework = "Koa";
    }

    // 检测开发工具
    if (configFiles.some((f) => f.includes("eslint"))) {
      tools.linter = "ESLint";
    }
    if (configFiles.some((f) => f.includes("prettier"))) {
      tools.formatter = "Prettier";
    }
    if (this.hasDependency(packageJson, "jest")) {
      tools.testRunner = "Jest";
    } else if (this.hasDependency(packageJson, "vitest")) {
      tools.testRunner = "Vitest";
    }

    return {
      frontend: Object.keys(frontend).length > 0 ? frontend : undefined,
      backend: Object.keys(backend).length > 0 ? backend : undefined,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
    };
  }

  /**
   * 检测项目类型
   */
  private detectProjectType(
    packageJson: any,
    configFiles: string[]
  ): ProjectMetadata["project"]["type"] {
    if (this.hasDependency(packageJson, "next")) return "application";
    if (this.hasDependency(packageJson, "nuxt")) return "application";
    if (this.hasDependency(packageJson, "astro")) return "application";
    if (
      this.hasDependency(packageJson, "express") ||
      this.hasDependency(packageJson, "fastify")
    )
      return "api";
    if (packageJson.bin) return "cli";
    if (configFiles.some((f) => f.includes("tsconfig"))) return "library";
    return "tool";
  }

  /**
   * 检测框架
   */
  private detectFramework(
    packageJson: any,
    configFiles: string[]
  ): string | undefined {
    if (this.hasDependency(packageJson, "react")) return "React";
    if (this.hasDependency(packageJson, "vue")) return "Vue";
    if (this.hasDependency(packageJson, "express")) return "Express";
    if (this.hasDependency(packageJson, "fastify")) return "Fastify";
    return undefined;
  }

  /**
   * 检测编程语言
   */
  private detectLanguage(configFiles: string[]): string {
    if (configFiles.some((f) => f.includes("tsconfig"))) return "TypeScript";
    return "JavaScript";
  }

  /**
   * 检测包管理器
   */
  private detectPackageManager(): string | undefined {
    if (existsSync(join(this.rootPath, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(this.rootPath, "yarn.lock"))) return "yarn";
    if (existsSync(join(this.rootPath, "package-lock.json"))) return "npm";
    return undefined;
  }

  /**
   * 检测源代码目录
   */
  private detectSrcDir(): string {
    const possibleDirs = ["src", "source", "app", "lib"];
    for (const dir of possibleDirs) {
      if (existsSync(join(this.rootPath, dir))) {
        return dir;
      }
    }
    return "src";
  }

  /**
   * 检测测试目录
   */
  private detectTestDir(): string {
    const possibleDirs = ["tests", "test", "__tests__", "spec"];
    for (const dir of possibleDirs) {
      if (existsSync(join(this.rootPath, dir))) {
        return dir;
      }
    }
    return "tests";
  }

  /**
   * 检测构建输出目录
   */
  private detectDistDir(): string {
    const possibleDirs = ["dist", "build", "out", "public"];
    for (const dir of possibleDirs) {
      if (existsSync(join(this.rootPath, dir))) {
        return dir;
      }
    }
    return "dist";
  }

  /**
   * 检测入口点
   */
  private detectEntryPoint(packageJson: any): string {
    return packageJson.main || "src/index.ts";
  }

  /**
   * 检测输出目录
   */
  private detectOutputDir(packageJson: any): string {
    return this.detectDistDir();
  }

  /**
   * 检测构建目标
   */
  private detectBuildTarget(configFiles: string[]): string | undefined {
    if (configFiles.some((f) => f.includes("vite"))) return "esnext";
    return undefined;
  }

  /**
   * 检测环境配置
   */
  private detectEnvironments(): string[] {
    return ["development", "production", "test"];
  }

  /**
   * 解析脚本
   */
  private parseScripts(scripts: Record<string, string>) {
    return Object.entries(scripts).map(([name, command]) => ({
      name,
      command,
      description: this.getScriptDescription(name),
    }));
  }

  /**
   * 检测架构模式
   */
  private detectArchitecturePatterns(): string[] {
    return ["MVC", "Component-based"];
  }

  /**
   * 检测代码模式
   */
  private detectCodePatterns() {
    return [
      {
        name: "Component Pattern",
        description: "React组件模式",
        example: "const Component = ({ prop }) => <div>{prop}</div>",
      },
    ];
  }

  /**
   * 检测工具函数
   */
  private detectUtilities() {
    return [
      {
        name: "formatDate",
        purpose: "格式化日期",
        signature: "formatDate(date: Date): string",
      },
    ];
  }

  /**
   * 检测类型定义
   */
  private detectTypes() {
    return [
      {
        name: "ApiResponse",
        description: "API响应类型",
        definition: "interface ApiResponse<T> { data: T; status: number; }",
      },
    ];
  }

  /**
   * 检查是否有特定依赖
   */
  private hasDependency(packageJson: any, depName: string): boolean {
    return (
      (packageJson.dependencies && packageJson.dependencies[depName]) ||
      (packageJson.devDependencies && packageJson.devDependencies[depName])
    );
  }

  /**
   * 获取依赖用途
   */
  private getDependencyPurpose(name: string): string {
    const purposes: Record<string, string> = {
      react: "前端UI框架",
      vue: "前端框架",
      express: "后端Web框架",
      fastify: "高性能后端框架",
      zod: "运行时类型验证",
      axios: "HTTP客户端",
    };
    return purposes[name] || "运行时依赖";
  }

  /**
   * 获取开发依赖用途
   */
  private getDevDependencyPurpose(name: string): string {
    const purposes: Record<string, string> = {
      typescript: "类型检查和编译",
      eslint: "代码检查",
      prettier: "代码格式化",
      jest: "单元测试",
      vitest: "单元测试",
      "@types/node": "Node.js类型定义",
    };
    return purposes[name] || "开发工具";
  }

  /**
   * 获取脚本描述
   */
  private getScriptDescription(name: string): string {
    const descriptions: Record<string, string> = {
      build: "构建项目",
      dev: "启动开发服务器",
      test: "运行测试",
      lint: "代码检查",
      format: "代码格式化",
      clean: "清理构建文件",
      start: "启动生产服务器",
    };
    return descriptions[name] || "自定义脚本";
  }
}
