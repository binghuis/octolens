import { EventEmitter } from "events";
import type { ProjectNode, ScanConfig } from "../types/index.js";
import { ProjectScanner } from "./scanner.js";

export interface FileChangeEvent {
  type: "add" | "change" | "unlink" | "addDir" | "unlinkDir";
  path: string;
  relativePath: string;
  timestamp: Date;
}

export interface WatcherConfig extends ScanConfig {
  watchPatterns?: string[];
  debounceMs?: number;
}

export class ProjectWatcher extends EventEmitter {
  private scanner: ProjectScanner;
  private config: WatcherConfig;
  private debounceTimer: NodeJS.Timeout | null = null;
  private isScanning = false;
  private watchedFiles = new Set<string>();

  constructor(config: WatcherConfig) {
    super();
    this.config = config;
    this.scanner = new ProjectScanner(config);
  }

  /**
   * 开始监听文件变化
   */
  async start(): Promise<void> {
    console.log("开始监听文件变化...");

    const watchPatterns = this.config.watchPatterns || ["**/*"];
    const ignorePatterns = this.config.ignorePatterns || [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".git/**",
      "*.log",
      "*.tmp",
    ];

    console.log(`监听模式: ${watchPatterns.join(", ")}`);
    console.log(`忽略模式: ${ignorePatterns.join(", ")}`);

    // 模拟文件监听（实际项目中会使用 chokidar）
    this.simulateFileWatching();
  }

  /**
   * 停止监听
   */
  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    console.log("文件监听已停止");
  }

  /**
   * 模拟文件监听（用于演示）
   */
  private simulateFileWatching(): void {
    console.log("文件监听器已就绪（模拟模式）");
    this.emit("ready");

    // 模拟文件变化事件
    setTimeout(() => {
      this.handleFileChange("add", "src/new-file.ts");
    }, 5000);
  }

  /**
   * 处理文件变化事件
   */
  private handleFileChange(type: FileChangeEvent["type"], path: string): void {
    const relativePath = path;
    const fullPath = `${this.config.rootPath}/${path}`;

    const event: FileChangeEvent = {
      type,
      path: fullPath,
      relativePath,
      timestamp: new Date(),
    };

    console.log(`文件变化: ${type} ${relativePath}`);
    this.emit("change", event);

    // 防抖处理，避免频繁扫描
    this.debounceScan();
  }

  /**
   * 防抖扫描
   */
  private debounceScan(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.performIncrementalScan();
    }, this.config.debounceMs || 1000);
  }

  /**
   * 执行增量扫描
   */
  private async performIncrementalScan(): Promise<void> {
    if (this.isScanning) {
      console.log("扫描正在进行中，跳过...");
      return;
    }

    this.isScanning = true;
    console.log("执行增量扫描...");

    try {
      const result = await this.scanner.scan();
      this.emit("scan-complete", result);
      console.log("增量扫描完成");
    } catch (error) {
      console.error("增量扫描失败:", error);
      this.emit("scan-error", error);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * 获取当前监听的文件列表
   */
  async getWatchedFiles(): Promise<string[]> {
    return Array.from(this.watchedFiles);
  }

  /**
   * 检查文件是否被监听
   */
  isWatched(path: string): boolean {
    return this.watchedFiles.has(path);
  }

  /**
   * 添加监听路径
   */
  addWatchPath(path: string): void {
    this.watchedFiles.add(path);
    console.log(`添加监听路径: ${path}`);
  }

  /**
   * 移除监听路径
   */
  removeWatchPath(path: string): void {
    this.watchedFiles.delete(path);
    console.log(`移除监听路径: ${path}`);
  }

  /**
   * 手动触发文件变化事件（用于测试）
   */
  triggerFileChange(type: FileChangeEvent["type"], path: string): void {
    this.handleFileChange(type, path);
  }
}
