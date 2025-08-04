import { PerformanceMetrics } from "./default-options";
import { logger } from "./logger";

/**
 * 性能跟踪器类
 */
export class PerformanceTracker {
  private metrics: PerformanceMetrics;
  private startTime: number;
  private isFinished: boolean = false;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      totalSize: 0,
      averageProcessingTime: 0,
      memoryUsage: process.memoryUsage(),
      startTime: this.startTime,
    };
  }

  /**
   * 更新文件统计
   */
  updateFileStats(
    processed: number = 0,
    failed: number = 0,
    skipped: number = 0,
    totalSize: number = 0
  ): void {
    if (this.isFinished) {
      logger.warn(
        "PerformanceTracker is already finished, cannot update stats"
      );
      return;
    }

    this.metrics.processedFiles += processed;
    this.metrics.failedFiles += failed;
    this.metrics.skippedFiles += skipped;
    this.metrics.totalSize += totalSize;
  }

  /**
   * 设置总文件数
   */
  setTotalFiles(totalFiles: number): void {
    if (this.isFinished) {
      logger.warn(
        "PerformanceTracker is already finished, cannot set total files"
      );
      return;
    }
    this.metrics.totalFiles = totalFiles;
  }

  /**
   * 获取当前进度百分比
   */
  getProgressPercentage(): number {
    const total = this.getTotalProcessedFiles();
    return this.metrics.totalFiles > 0
      ? (total / this.metrics.totalFiles) * 100
      : 0;
  }

  /**
   * 获取处理速度（MB/秒）
   */
  getProcessingSpeed(): number {
    const elapsed = this.getElapsedTime();
    return elapsed > 0 ? this.metrics.totalSize / 1024 / 1024 / elapsed : 0;
  }

  /**
   * 获取平均处理时间（毫秒/文件）
   */
  getAverageProcessingTime(): number {
    const total = this.getTotalProcessedFiles();
    const elapsed = this.getElapsedTime();
    return total > 0 ? elapsed / total : 0;
  }

  /**
   * 获取当前内存使用情况
   */
  getCurrentMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * 获取内存增长（MB）
   */
  getMemoryGrowth(): number {
    const current = this.getCurrentMemoryUsage();
    const initial = this.metrics.memoryUsage;
    return (current.heapUsed - initial.heapUsed) / 1024 / 1024;
  }

  /**
   * 获取已处理文件总数
   */
  private getTotalProcessedFiles(): number {
    return (
      this.metrics.processedFiles +
      this.metrics.failedFiles +
      this.metrics.skippedFiles
    );
  }

  /**
   * 获取经过的时间（秒）
   */
  private getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * 完成跟踪并返回最终指标
   */
  finish(): PerformanceMetrics {
    if (this.isFinished) {
      logger.warn("PerformanceTracker is already finished");
      return this.metrics;
    }

    this.isFinished = true;
    this.metrics.endTime = Date.now();
    this.metrics.averageProcessingTime = this.getAverageProcessingTime();

    return { ...this.metrics };
  }

  /**
   * 打印性能报告
   */
  printReport(enablePerformanceMonitoring: boolean = false): void {
    if (!enablePerformanceMonitoring) return;

    const finalMetrics = this.finish();
    const totalTime = this.getElapsedTime();
    const currentMemoryUsage = this.getCurrentMemoryUsage();

    logger.info("\n📊 性能统计:");
    logger.info(`- 总耗时: ${totalTime.toFixed(2)} 秒`);
    logger.info(
      `- 平均处理时间: ${finalMetrics.averageProcessingTime.toFixed(
        2
      )} 毫秒/文件`
    );
    logger.info(`- 处理速度: ${this.getProcessingSpeed().toFixed(2)} MB/秒`);
    logger.info(
      `- 当前内存: ${(currentMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
    );
    logger.info(`- 内存增长: ${this.getMemoryGrowth().toFixed(2)} MB`);
    logger.info(`- 成功处理: ${finalMetrics.processedFiles} 个文件`);
    logger.info(`- 失败文件: ${finalMetrics.failedFiles} 个文件`);
    logger.info(`- 跳过文件: ${finalMetrics.skippedFiles} 个文件`);
    logger.info(`- 总文件数: ${finalMetrics.totalFiles} 个文件`);
  }

  /**
   * 获取当前指标快照
   */
  getSnapshot(): PerformanceMetrics {
    return {
      ...this.metrics,
      averageProcessingTime: this.getAverageProcessingTime(),
    };
  }

  /**
   * 重置跟踪器（用于重复使用）
   */
  reset(): void {
    this.startTime = Date.now();
    this.isFinished = false;
    this.metrics = {
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      totalSize: 0,
      averageProcessingTime: 0,
      memoryUsage: process.memoryUsage(),
      startTime: this.startTime,
    };
  }
}
