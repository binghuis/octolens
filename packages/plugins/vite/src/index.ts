import { BaseScannerPlugin } from "@octolens/core";
import type { ScanConfig, ScanResult, ProjectMetadata } from "@octolens/core";

export class ViteScannerPlugin extends BaseScannerPlugin {
  name = "vite-scanner";
  version = "1.1.0";

  validate(config: ScanConfig): boolean {
    return Boolean(config.rootPath && config.maxDepth > 0);
  }

  async scan(config: ScanConfig): Promise<Partial<ScanResult>> {
    const { readFile } = await import("fs/promises");
    const { access } = await import("fs/promises");
    const path = await import("path");

    const viteConfigFiles = [
      "vite.config.ts",
      "vite.config.js",
      "vite.config.mjs",
      "vite.config.cjs",
    ];

    let configFileFound = "";
    let viteConfigContent = "";
    let viteConfigMeta: Record<string, any> = {};

    // 1. 检查并解析 Vite 配置文件
    for (const configFile of viteConfigFiles) {
      const configPath = path.join(config.rootPath, configFile);
      try {
        await access(configPath);
        configFileFound = configFile;
        viteConfigContent = await readFile(configPath, "utf-8");
        viteConfigMeta = this.parseViteConfig(viteConfigContent);
        break;
      } catch {
        continue;
      }
    }

    // 2. 识别常见目录结构
    const viteDirs = ["src", "public", "assets", "components", "views", "dist"];
    const foundDirs: string[] = [];
    for (const dir of viteDirs) {
      const dirPath = path.join(config.rootPath, dir);
      try {
        await access(dirPath);
        foundDirs.push(dir);
      } catch {}
    }

    // 3. 读取 package.json，提取依赖和 Vite 版本
    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    let viteVersion = "unknown";
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
      viteVersion =
        dependencies["vite"] || devDependencies["vite"] || "unknown";
    } catch {}

    // 4. 组装 projectMetadata
    const meta: Record<string, any> = {};
    if (Object.keys(viteConfigMeta).length > 0)
      meta.viteConfig = viteConfigMeta;
    if (foundDirs.length > 0) meta.directories = foundDirs;

    const projectMetadata: ProjectMetadata = {
      name: "vite-project",
      version: viteVersion,
      description,
      framework: "vite",
      packageManager,
      dependencies,
      devDependencies,
      configFiles: configFileFound ? [configFileFound] : [],
      buildTool: "unknown",
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };

    return {
      projectMetadata,
    };
  }

  /**
   * 解析 Vite 配置文件内容（简单正则/字符串分析，非 AST）
   */
  private parseViteConfig(content: string): Record<string, any> {
    const meta: Record<string, any> = {};
    // 插件链
    const pluginsMatch = content.match(/plugins\s*:\s*\[([\s\S]*?)\]/);
    if (pluginsMatch) {
      meta.plugins = pluginsMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // alias
    const aliasMatch = content.match(/alias\s*:\s*\[([\s\S]*?)\]/);
    if (aliasMatch) {
      meta.alias = aliasMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // define
    const defineMatch = content.match(/define\s*:\s*\{([\s\S]*?)\}/);
    if (defineMatch) {
      meta.define = defineMatch[1]
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // envPrefix
    const envMatch = content.match(/envPrefix\s*:\s*([\w"']+)/);
    if (envMatch) {
      meta.envPrefix = envMatch[1];
    }
    // base
    const baseMatch = content.match(/base\s*:\s*([\w"'\/\.\-]+)/);
    if (baseMatch) {
      meta.base = baseMatch[1];
    }
    // root
    const rootMatch = content.match(/root\s*:\s*([\w"'\/\.\-]+)/);
    if (rootMatch) {
      meta.root = rootMatch[1];
    }
    return meta;
  }
}

// 导出默认实例
export default new ViteScannerPlugin();
