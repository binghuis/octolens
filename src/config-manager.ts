import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { IndexConfig } from "./types.js";

export class ConfigManager {
  private configPath: string;
  private defaultConfig: IndexConfig;

  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), "structor.config.json");
    this.defaultConfig = this.getDefaultConfig();
  }

  private getDefaultConfig(): IndexConfig {
    return {
      rootPath: process.cwd(),
      includePatterns: ["**/*.{ts,tsx,js,jsx}"],
      excludePatterns: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.git/**",
        "**/build/**",
        "**/.next/**",
        "**/coverage/**",
      ],
      componentPaths: [
        "src/components/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "src/ui/**/*.{ts,tsx}",
        "ui/**/*.{ts,tsx}",
      ],
      hookPaths: [
        "src/hooks/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "src/lib/hooks/**/*.{ts,tsx}",
      ],
      utilityPaths: [
        "src/utils/**/*.{ts,tsx}",
        "utils/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
      ],
      typePaths: [
        "src/types/**/*.{ts,tsx}",
        "types/**/*.{ts,tsx}",
        "src/@types/**/*.{ts,tsx}",
      ],
      autoWatch: true,
      indexFile: join(process.cwd(), ".structor-index.json"),
    };
  }

  loadConfig(): IndexConfig {
    // 1. 尝试从环境变量加载配置路径
    const envConfigPath = process.env.STRUCTOR_CONFIG_PATH;
    if (envConfigPath && existsSync(envConfigPath)) {
      this.configPath = envConfigPath;
    }

    // 2. 尝试从项目根目录加载配置
    if (existsSync(this.configPath)) {
      try {
        const configData = readFileSync(this.configPath, "utf-8");
        const userConfig = JSON.parse(configData);
        return { ...this.defaultConfig, ...userConfig };
      } catch (error) {
        console.warn(`加载配置文件失败: ${error}`);
      }
    }

    // 3. 尝试从常见的配置文件位置加载
    const commonPaths = [
      join(process.cwd(), "structor.config.json"),
      join(process.cwd(), ".structor.json"),
      join(process.cwd(), "config", "structor.json"),
      join(process.cwd(), ".cursor", "structor.json"),
    ];

    for (const path of commonPaths) {
      if (existsSync(path)) {
        try {
          const configData = readFileSync(path, "utf-8");
          const userConfig = JSON.parse(configData);
          this.configPath = path;
          return { ...this.defaultConfig, ...userConfig };
        } catch (error) {
          console.warn(`加载配置文件失败 ${path}: ${error}`);
        }
      }
    }

    // 4. 使用默认配置
    console.log("使用默认配置，可以创建 structor.config.json 来自定义配置");
    return this.defaultConfig;
  }

  saveConfig(config: Partial<IndexConfig>): void {
    try {
      const currentConfig = this.loadConfig();
      const newConfig = { ...currentConfig, ...config };

      writeFileSync(
        this.configPath,
        JSON.stringify(newConfig, null, 2),
        "utf-8"
      );
      console.log(`配置已保存到: ${this.configPath}`);
    } catch (error) {
      throw new Error(`保存配置失败: ${error}`);
    }
  }

  updateConfig(updates: Partial<IndexConfig>): IndexConfig {
    const currentConfig = this.loadConfig();
    const newConfig = { ...currentConfig, ...updates };

    // 验证配置
    this.validateConfig(newConfig);

    // 保存配置
    this.saveConfig(newConfig);

    return newConfig;
  }

  private validateConfig(config: IndexConfig): void {
    if (!config.rootPath) {
      throw new Error("rootPath 不能为空");
    }

    if (
      !Array.isArray(config.componentPaths) ||
      config.componentPaths.length === 0
    ) {
      throw new Error("componentPaths 必须是非空数组");
    }

    if (!Array.isArray(config.hookPaths)) {
      throw new Error("hookPaths 必须是数组");
    }

    if (!Array.isArray(config.utilityPaths)) {
      throw new Error("utilityPaths 必须是数组");
    }
  }

  getConfigPath(): string {
    return this.configPath;
  }

  createDefaultConfig(): void {
    if (!existsSync(this.configPath)) {
      this.saveConfig(this.defaultConfig);
      console.log(`已创建默认配置文件: ${this.configPath}`);
    } else {
      console.log(`配置文件已存在: ${this.configPath}`);
    }
  }

  showConfig(): void {
    const config = this.loadConfig();
    console.log("当前配置:");
    console.log(JSON.stringify(config, null, 2));
  }
}
