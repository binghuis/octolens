import { BaseScannerPlugin } from "@octolens/core";
import type { ScanConfig, ScanResult, ProjectMetadata } from "@octolens/core";

export class NextJSScannerPlugin extends BaseScannerPlugin {
  name = "nextjs-scanner";
  version = "1.1.0";

  validate(config: ScanConfig): boolean {
    return Boolean(config.rootPath && config.maxDepth > 0);
  }

  async scan(config: ScanConfig): Promise<Partial<ScanResult>> {
    const { readFile } = await import("fs/promises");
    const { access } = await import("fs/promises");
    const path = await import("path");

    const nextConfigFiles = [
      "next.config.js",
      "next.config.ts",
      "next.config.mjs",
    ];

    let configFileFound = "";
    let nextConfigContent = "";
    let nextConfigMeta: Record<string, any> = {};

    // 1. 检查并解析 next.config 文件
    for (const configFile of nextConfigFiles) {
      const configPath = path.join(config.rootPath, configFile);
      try {
        await access(configPath);
        configFileFound = configFile;
        nextConfigContent = await readFile(configPath, "utf-8");
        nextConfigMeta = this.parseNextConfig(nextConfigContent);
        break;
      } catch {
        continue;
      }
    }

    // 2. 识别 Next.js 相关目录和特性
    const nextDirs = [
      "pages",
      "app",
      "components",
      "public",
      ".next",
      "middleware",
      "api",
      "layouts",
      "server",
    ];
    const foundDirs: string[] = [];
    for (const dir of nextDirs) {
      const dirPath = path.join(config.rootPath, dir);
      try {
        await access(dirPath);
        foundDirs.push(dir);
      } catch {}
    }

    // 3. 识别 API 路由、middleware、layout、server actions
    const apiRoutes: string[] = [];
    const middlewareFiles: string[] = [];
    const layoutFiles: string[] = [];
    const serverActionFiles: string[] = [];
    async function scanDir(dirPath: string, type: string) {
      try {
        const fs = await import("fs/promises");
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            await scanDir(fullPath, type);
          } else {
            if (type === "api" && /\\.(js|ts|mjs|tsx|jsx)$/.test(entry.name)) {
              apiRoutes.push(fullPath);
            }
            if (type === "middleware" && entry.name.startsWith("middleware")) {
              middlewareFiles.push(fullPath);
            }
            if (type === "layout" && entry.name.startsWith("layout")) {
              layoutFiles.push(fullPath);
            }
            if (type === "server" && entry.name.includes("server")) {
              serverActionFiles.push(fullPath);
            }
          }
        }
      } catch {}
    }
    await scanDir(path.join(config.rootPath, "pages", "api"), "api");
    await scanDir(path.join(config.rootPath, "app", "api"), "api");
    await scanDir(path.join(config.rootPath, "middleware"), "middleware");
    await scanDir(path.join(config.rootPath, "layouts"), "layout");
    await scanDir(path.join(config.rootPath, "server"), "server");

    // 4. 读取 package.json，提取依赖和 Next.js 版本
    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    let nextVersion = "unknown";
    let packageManager = "unknown";
    let description = "";
    try {
      const pkgPath = path.join(config.rootPath, "package.json");
      await access(pkgPath);
      const pkgContent = await readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);
      dependencies = pkg.dependencies || {};
      devDependencies = pkg.devDependencies || {};
      description = pkg.description || "";
      packageManager = pkg.packageManager || "unknown";
      nextVersion =
        dependencies["next"] || devDependencies["next"] || "unknown";
    } catch {}

    // 5. 检测构建工具
    let buildTool: "webpack" | "turbopack" | "unknown" = "unknown";
    if (nextConfigContent) {
      buildTool = this.detectBuildTool(nextConfigContent, config.rootPath);
    } else {
      buildTool = await this.detectBuildToolFromPackageJson(config.rootPath);
    }

    // 6. 组装 projectMetadata
    const meta: Record<string, any> = {};
    if (Object.keys(nextConfigMeta).length > 0)
      meta.nextConfig = nextConfigMeta;
    if (foundDirs.length > 0) meta.directories = foundDirs;
    if (apiRoutes.length > 0) meta.apiRoutes = apiRoutes;
    if (middlewareFiles.length > 0) meta.middlewareFiles = middlewareFiles;
    if (layoutFiles.length > 0) meta.layoutFiles = layoutFiles;
    if (serverActionFiles.length > 0)
      meta.serverActionFiles = serverActionFiles;

    const projectMetadata: ProjectMetadata = {
      name: "nextjs-project",
      version: nextVersion,
      description,
      framework: "nextjs",
      packageManager,
      dependencies,
      devDependencies,
      configFiles: configFileFound ? [configFileFound] : [],
      buildTool,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };

    return {
      projectMetadata,
    };
  }

  /**
   * 解析 next.config 文件内容（简单正则/字符串分析，非 AST）
   */
  private parseNextConfig(content: string): Record<string, any> {
    const meta: Record<string, any> = {};
    // experimental
    const expMatch = content.match(/experimental\s*:\s*\{([\s\S]*?)\}/);
    if (expMatch) {
      meta.experimental = expMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // rewrites
    const rewritesMatch = content.match(/rewrites\s*:\s*\[([\s\S]*?)\]/);
    if (rewritesMatch) {
      meta.rewrites = rewritesMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // redirects
    const redirectsMatch = content.match(/redirects\s*:\s*\[([\s\S]*?)\]/);
    if (redirectsMatch) {
      meta.redirects = redirectsMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // headers
    const headersMatch = content.match(/headers\s*:\s*\[([\s\S]*?)\]/);
    if (headersMatch) {
      meta.headers = headersMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // output
    const outputMatch = content.match(/output\s*:\s*([\w"'\/\.\-]+)/);
    if (outputMatch) {
      meta.output = outputMatch[1];
    }
    // images
    const imagesMatch = content.match(/images\s*:\s*\{([\s\S]*?)\}/);
    if (imagesMatch) {
      meta.images = imagesMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return meta;
  }

  /**
   * 检测构建工具版本
   */
  private detectBuildTool(
    configContent: string,
    rootPath: string
  ): "webpack" | "turbopack" | "unknown" {
    // 检查 Turbopack 相关配置
    const turbopackIndicators = [
      "experimental.turbo",
      "experimental.turbopack",
      "turbo:",
      "turbopack:",
      "experimental: { turbo:",
      "experimental: { turbopack:",
    ];

    for (const indicator of turbopackIndicators) {
      if (configContent.includes(indicator)) {
        console.log("Detected Turbopack configuration");
        return "turbopack";
      }
    }

    // 检查 Webpack 相关配置
    const webpackIndicators = [
      "webpack(",
      "webpack:",
      "experimental.webpack",
      "webpackConfig",
    ];

    for (const indicator of webpackIndicators) {
      if (configContent.includes(indicator)) {
        console.log("Detected Webpack configuration");
        return "webpack";
      }
    }

    // 检查是否有明确的 Turbopack 启用标志
    if (
      configContent.includes("turbopack: true") ||
      configContent.includes("turbo: true")
    ) {
      console.log("Detected explicit Turbopack enable");
      return "turbopack";
    }

    // 默认返回 webpack（Next.js 的默认构建工具）
    console.log("Using default Webpack build tool");
    return "webpack";
  }

  /**
   * 从 package.json 检测构建工具
   */
  private async detectBuildToolFromPackageJson(
    rootPath: string
  ): Promise<"webpack" | "turbopack" | "unknown"> {
    try {
      const { readFile } = await import("fs/promises");
      const { access } = await import("fs/promises");
      const path = await import("path");

      const packageJsonPath = path.join(rootPath, "package.json");
      await access(packageJsonPath);

      const content = await readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);

      // 检查 Next.js 版本
      const nextVersion =
        packageJson.dependencies?.next || packageJson.devDependencies?.next;

      if (nextVersion) {
        // Next.js 13+ 支持 Turbopack
        const majorVersion = parseInt(
          nextVersion.replace(/[^0-9]/g, "").substring(0, 2)
        );

        if (majorVersion >= 13) {
          // 检查是否有 Turbopack 相关的脚本或配置
          const scripts = packageJson.scripts || {};
          const hasTurbopackScript = Object.values(scripts).some(
            (script: unknown) =>
              typeof script === "string" &&
              (script.includes("--turbo") || script.includes("turbopack"))
          );

          if (hasTurbopackScript) {
            console.log("Detected Turbopack from package.json scripts");
            return "turbopack";
          }
        }
      }

      // 检查是否有 Turbopack 相关的依赖
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const hasTurbopackDependency = Object.keys(allDependencies).some(
        (dep) => dep.includes("turbopack") || dep.includes("turbo")
      );

      if (hasTurbopackDependency) {
        console.log("Detected Turbopack from dependencies");
        return "turbopack";
      }

      // 默认返回 webpack
      return "webpack";
    } catch {
      return "unknown";
    }
  }
}

// 导出默认实例
export default new NextJSScannerPlugin();
