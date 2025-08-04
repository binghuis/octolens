/**
 * 默认分析选项配置
 */
export const DEFAULT_ANALYSIS_OPTIONS = {
  concurrentLimit: 5,
  batchSize: 10,
  maxRetries: 3,
  retryDelay: 1000,
  enableProgress: true,
  enablePerformanceMonitoring: false,
  verbose: false,
  maxFileSize: 100 * 1024, // 100KB
  maxLines: 1000,
  chunkSize: 64 * 1024, // 64KB
} as const;

/**
 * 分析选项类型
 */
export interface AnalysisOptions {
  concurrentLimit?: number;
  batchSize?: number;
  enableProgress?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enablePerformanceMonitoring?: boolean;
  verbose?: boolean;
  maxFileSize?: number;
  maxLines?: number;
  chunkSize?: number;
}

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalSize: number;
  averageProcessingTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  startTime: number;
  endTime?: number;
}

/**
 * 文件优先级权重配置
 */
export const FILE_PRIORITY_WEIGHTS = {
  // 核心代码文件
  code: {
    ".js": 100,
    ".ts": 100,
    ".jsx": 100,
    ".tsx": 100,
    ".vue": 100,
    ".svelte": 100,
    ".astro": 100,
  },

  // 样式文件
  style: {
    ".css": 50,
    ".scss": 50,
    ".less": 50,
    ".sass": 50,
  },

  // 类型定义文件
  type: {
    ".d.ts": 80,
  },

  // 测试文件（优先级较低）
  test: {
    ".test.": -20,
    ".spec.": -20,
    ".e2e.": -30,
    ".cy.": -30,
  },

  // 文件大小权重
  size: {
    small: 50, // < 10KB
    medium: 25, // 10KB - 50KB
    large: 0, // > 50KB
  },
} as const;
