import type { ScanConfig, ScanResult, AIConfig } from "./types/index.js";
import { ProjectScanner } from "./core/scanner.js";
import { MCPServer } from "./mcp/server.js";
import { ProjectWatcher } from "./core/watcher.js";
import { LocalAIProvider } from "./ai/local-ai-provider.js";
import { PluginRegistry } from "./plugins/base.js";

export class OctoLens {
  private config: ScanConfig;
  private scanner: ProjectScanner;
  private mcpServer: MCPServer;
  private watcher: ProjectWatcher;
  private aiProvider: LocalAIProvider;
  private scanResult?: ScanResult;

  constructor(config: ScanConfig) {
    this.config = config;
    this.scanner = new ProjectScanner(config);
    this.mcpServer = new MCPServer();
    this.watcher = new ProjectWatcher(config);
    this.aiProvider = new LocalAIProvider(config.aiConfig as AIConfig);
  }

  /**
   * 启动 OctoLens 服务
   */
  async start() {
    try {
      console.log("Starting OctoLens...");

      // 1. 扫描项目结构
      console.log("Scanning project structure...");
      this.scanResult = await this.scanner.scan();

      // 2. AI 分析项目结构
      if (this.aiProvider) {
        console.log("Analyzing with AI...");
        this.scanResult.projectStructure = await this.aiProvider.analyze(
          this.scanResult.projectStructure
        );
      }

      // 3. 设置扫描结果到 MCP 服务器
      this.mcpServer.setScanResult(this.scanResult);

      // 4. 启动文件监听
      console.log("Starting file watcher...");
      await this.watcher.start();

      // 监听文件变化事件
      this.watcher.on("change", (event) => {
        console.log(`文件变化: ${event.type} ${event.relativePath}`);
      });

      this.watcher.on("scan-complete", (result) => {
        console.log("增量扫描完成，更新 MCP 服务器数据");
        this.scanResult = result;
        this.mcpServer.setScanResult(result);
      });

      // 5. 启动 MCP 服务器
      console.log("Starting MCP server...");
      await this.mcpServer.start();

      console.log("OctoLens started successfully");
      console.log(`Project: ${this.scanResult.projectMetadata.name}`);
      console.log(`Framework: ${this.scanResult.projectMetadata.framework}`);
      console.log(`Files: ${this.scanResult.fileCount}`);
      console.log(`Directories: ${this.scanResult.directoryCount}`);
    } catch (error) {
      console.error("Failed to start OctoLens:", error);
      throw error;
    }
  }

  /**
   * 停止服务
   */
  async stop() {
    try {
      await this.watcher.stop();
      console.log("OctoLens stopped");
    } catch (error) {
      console.error("Failed to stop OctoLens:", error);
    }
  }

  /**
   * 获取扫描结果
   */
  getScanResult(): ScanResult | undefined {
    return this.scanResult;
  }

  /**
   * 重新扫描项目
   */
  async rescan(): Promise<ScanResult> {
    console.log("Rescanning project...");
    this.scanResult = await this.scanner.scan();

    // 重新进行 AI 分析
    if (this.aiProvider) {
      console.log("Re-analyzing with AI...");
      this.scanResult.projectStructure = await this.aiProvider.analyze(
        this.scanResult.projectStructure
      );
    }

    this.mcpServer.setScanResult(this.scanResult);
    return this.scanResult;
  }

  /**
   * 获取文件监听器
   */
  getWatcher(): ProjectWatcher {
    return this.watcher;
  }

  /**
   * 获取 AI 提供商
   */
  getAIProvider(): LocalAIProvider {
    return this.aiProvider;
  }
}
