import type {
  ScanConfig,
  ScanResult,
  ProjectMetadata,
  FileAnalysisResult,
} from "./types";
import { validateConfig, getConfig } from "./config";
import { logger } from "./utils/logger";
import { PerformanceTracker } from "./utils/performance";
import { getProjectMetadata, analyzeProjectStructure } from "./utils/project";
import { collectAndSortFiles, buildDynamicBatches } from "./utils/files";
import { DEFAULT_ANALYSIS_OPTIONS } from "./utils/options";
import { pluginManager } from "./plugins";

/**
 * OctoLens 核心扫描器
 */
export class OctoLensScanner {
  private config: ScanConfig;
  private performanceTracker: PerformanceTracker;
  private isScanning = false;

  constructor(config?: Partial<ScanConfig>) {
    this.config = getConfig(config);
    this.performanceTracker = new PerformanceTracker();
  }

  /**
   * 扫描项目
   */
  async scanProject(overrides?: Partial<ScanConfig>): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error("扫描已在进行中");
    }

    this.isScanning = true;
    const startTime = Date.now();

    try {
      // 合并配置
      const finalConfig = { ...this.config, ...overrides };
      const validatedConfig = validateConfig(finalConfig);

      logger.info(`开始扫描项目: ${validatedConfig.rootPath}`);

      // 1. 获取项目元数据
      const projectMetadata = await this.getProjectMetadata(
        validatedConfig.rootPath
      );

      // 2. 分析项目结构
      const projectTree = analyzeProjectStructure(validatedConfig.rootPath, {
        maxDepth: validatedConfig.maxDepth,
        useGitignore: true,
      });

      // 3. 收集和排序文件
      const collectionResult = collectAndSortFiles(projectTree, {
        ...DEFAULT_ANALYSIS_OPTIONS,
        verbose: true,
      });

      // 4. 构建批处理
      const batchResult = buildDynamicBatches(collectionResult.files, {
        ...DEFAULT_ANALYSIS_OPTIONS,
        batchSize: 10,
      });

      // 5. AI 分析文件（如果启用）
      let fileAnalysisResults: FileAnalysisResult[] = [];
      if (validatedConfig.enableAI && validatedConfig.aiConfig) {
        fileAnalysisResults = await this.analyzeFilesWithAI(
          collectionResult.files,
          validatedConfig
        );
      }

      const duration = Date.now() - startTime;

      const result: ScanResult = {
        projectMetadata,
        fileCount: collectionResult.files.length,
        directoryCount: this.countDirectories(projectTree),
        files: fileAnalysisResults,
        scanTime: new Date(),
        duration,
      };

      logger.info(`扫描完成，耗时: ${duration}ms`);
      return result;
    } catch (error) {
      logger.error("扫描失败:", error);
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * 获取项目元数据
   */
  private async getProjectMetadata(rootPath: string): Promise<ProjectMetadata> {
    const metadata = getProjectMetadata(rootPath);

    // 使用插件分析项目
    const pluginResults = await pluginManager.analyzeProject(rootPath);

    // 合并插件结果
    const mergedMetadata: ProjectMetadata = {
      name: metadata.packageJson.name || "unknown",
      description: metadata.packageJson.description || "",
      keywords: metadata.packageJson.keywords || [],
      dependencies: [],
      scripts: [],
    };

    // 处理依赖
    if (metadata.packageJson.dependencies) {
      for (const [name, version] of Object.entries(
        metadata.packageJson.dependencies
      )) {
        mergedMetadata.dependencies.push({
          name,
          version: version as string,
          description: "",
        });
      }
    }

    // 处理脚本
    if (metadata.packageJson.scripts) {
      for (const [name, command] of Object.entries(
        metadata.packageJson.scripts
      )) {
        mergedMetadata.scripts.push({
          name,
          command: command as string,
          description: "",
        });
      }
    }

    return mergedMetadata;
  }

  /**
   * 使用 AI 分析文件
   */
  private async analyzeFilesWithAI(
    files: any[],
    config: ScanConfig
  ): Promise<FileAnalysisResult[]> {
    logger.info(`开始 AI 分析 ${files.length} 个文件`);

    const results: FileAnalysisResult[] = [];
    const batchSize = 5; // 小批量处理

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      const batchPromises = batch.map(async (file) => {
        try {
          // 使用插件分析文件
          const pluginResults = await pluginManager.analyzeFile(
            file.path,
            file.content || ""
          );

          if (pluginResults.length > 0) {
            return pluginResults[0]; // 返回第一个插件的结果
          }

          // 如果没有插件结果，使用默认分析
          return {
            name: file.name,
            path: file.path,
            type: "other",
            description: "",
            dependencies: [],
            size: file.size,
            extension: file.extension,
          } as FileAnalysisResult;
        } catch (error) {
          logger.warn(`分析文件失败: ${file.path}`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...(batchResults.filter(Boolean) as FileAnalysisResult[]));

      // 进度日志
      if (i % 20 === 0) {
        logger.info(
          `已分析 ${Math.min(i + batchSize, files.length)}/${
            files.length
          } 个文件`
        );
      }
    }

    logger.info(`AI 分析完成，成功分析 ${results.length} 个文件`);
    return results;
  }

  /**
   * 计算目录数量
   */
  private countDirectories(node: any): number {
    let count = 0;

    function traverse(n: any) {
      if (n.type === "directory") {
        count++;
      }
      if (n.children) {
        for (const child of n.children) {
          traverse(child);
        }
      }
    }

    traverse(node);
    return count;
  }

  /**
   * 获取扫描状态
   */
  isScanningProject(): boolean {
    return this.isScanning;
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return this.performanceTracker.getSnapshot();
  }

  /**
   * 重置扫描器
   */
  reset(): void {
    this.isScanning = false;
    this.performanceTracker.reset();
  }
}
