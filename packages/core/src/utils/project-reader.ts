import { readFileSync, existsSync, createReadStream } from "fs";
import { join } from "path";
import { Readable } from "stream";
import { PackageJson } from "type-fest";
import directoryTree from "directory-tree";
import type { FileAnalysisResult } from "../types/file-analysis-result";
import { fileAnalysisChain } from "../ai/genFileAnalysisResult";
/**
 * 读取项目文件
 * @param rootPath 项目根路径，默认为当前工作目录
 * @returns 包含 package.json 和 README 信息的对象
 */
export function getProjectMetadata(rootPath: string = process.cwd()) {
  const packagePath = join(rootPath, "package.json");
  const readmePath = join(rootPath, "README.md");

  const result = {
    packageJson: {} as PackageJson,
    readme: null as string | null,
    hasPackageJson: existsSync(packagePath),
    hasReadme: existsSync(readmePath),
  };

  if (result.hasPackageJson) {
    result.packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
  }

  if (result.hasReadme) {
    result.readme = readFileSync(readmePath, "utf-8");
  }

  return result;
}

/**
 * 项目文件节点接口 - 兼容 directory-tree 的输出格式
 */
export interface ProjectNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: ProjectNode[];
  size?: number;
  extension?: string;
  sizeInBytes?: number;
  isDirectory?: boolean;
}

/**
 * 从 .gitignore 文件读取排除规则
 * @param rootPath 项目根路径
 * @returns 正则表达式数组
 */
function readGitignorePatterns(rootPath: string): RegExp[] {
  const gitignorePath = join(rootPath, ".gitignore");
  const patterns: RegExp[] = [];

  if (!existsSync(gitignorePath)) {
    return patterns;
  }

  try {
    const content = readFileSync(gitignorePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // 转换 gitignore 模式为正则表达式
      let pattern = trimmed;

      // 处理通配符
      pattern = pattern.replace(/\./g, "\\."); // 转义点号
      pattern = pattern.replace(/\*/g, ".*"); // * 转换为 .*
      pattern = pattern.replace(/\?/g, "."); // ? 转换为 .
      pattern = pattern.replace(/\//g, "\\/"); // 转义斜杠

      // 处理目录匹配（以 / 结尾）
      if (pattern.endsWith("\\/")) {
        pattern = pattern.slice(0, -2) + "(\\/.*)?";
      }

      // 处理路径前缀（以 / 开头）
      if (pattern.startsWith("\\/")) {
        pattern = "^" + pattern;
      } else {
        pattern = ".*" + pattern;
      }

      patterns.push(new RegExp(pattern));
    }
  } catch (error) {
    console.warn("读取 .gitignore 文件失败:", error);
  }

  return patterns;
}

// 共享的文件类型定义
const AI_PROGRAMMING_FILE_TYPES = {
  // 核心源代码文件 - AI需要理解业务逻辑
  code: [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".mjs",
    ".cjs",
    ".vue",
    ".svelte",
    ".astro",
  ],

  // 样式文件 - 影响UI逻辑
  style: [".css", ".scss", ".less", ".sass"],

  // 类型定义文件 - AI需要理解数据结构
  type: [".d.ts"],

  // 静态资源文件 - AI需要理解UI资源
  asset: [
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".avif",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
  ],

  // 测试文件 - 帮助AI理解功能
  test: [".test.", ".spec.", ".e2e.", ".cy."],
};

/**
 * 分析项目整体架构，生成树形结构对象
 * @param rootPath 项目根路径，默认为当前工作目录
 * @param options 配置选项
 * @returns 项目树形结构对象
 */
export function analyzeProjectStructure(
  rootPath: string = process.cwd(),
  options: {
    exclude?: RegExp[];
    extensions?: RegExp[];
    normalizePath?: boolean;
    attributes?: string[];
    maxDepth?: number;
    useGitignore?: boolean;
  } = {}
): ProjectNode {
  // 从 .gitignore 读取排除规则
  const gitignorePatterns =
    options.useGitignore !== false ? readGitignorePatterns(rootPath) : [];

  // 默认排除规则（作为后备）
  const defaultExclude = [
    /node_modules/,
    /\.git/,
    /\.DS_Store/,
    /dist/,
    /build/,
    /\.next/,
    /\.turbo/,
    /coverage/,
    /\.nyc_output/,
    /\.log$/,
    /\.env/,
    /\.lock$/,
  ];

  // 合并用户自定义排除规则、gitignore 规则和默认规则
  const excludePatterns = [
    ...(options.exclude || []),
    ...gitignorePatterns,
    ...defaultExclude,
  ];

  // 只分析业务代码文件
  const defaultExtensions = new RegExp(
    `\\.(${AI_PROGRAMMING_FILE_TYPES.code.join("|").replace(/\./g, "")})$`
  );

  const tree = directoryTree(rootPath, {
    exclude: excludePatterns,
    extensions: options.extensions || defaultExtensions,
    normalizePath: options.normalizePath ?? true,
    attributes: options.attributes || (["size", "type", "extension"] as any),
    depth: options.maxDepth || 5,
  } as any) as ProjectNode;

  return tree;
}

// 文件大小限制（字节）
const MAX_FILE_SIZE = 100 * 1024; // 100KB
const MAX_LINES = 1000; // 最大行数限制
const CHUNK_SIZE = 64 * 1024; // 64KB 块大小

/**
 * 流式读取文件内容，优化内存使用
 * @param filePath 文件路径
 * @returns 处理后的文件内容
 */
async function processFileContent(filePath: string): Promise<string> {
  try {
    // 对于小文件，直接读取
    const stats = require("fs").statSync(filePath);
    if (stats.size < CHUNK_SIZE) {
      return processFileContentSync(filePath);
    }

    // 对于大文件，使用流式处理
    return await processFileContentStream(filePath);
  } catch (error) {
    console.warn(`处理文件内容失败: ${filePath}`, error);
    return "";
  }
}

/**
 * 同步处理小文件内容
 * @param filePath 文件路径
 * @returns 处理后的文件内容
 */
function processFileContentSync(filePath: string): string {
  const fileContent = readFileSync(filePath, "utf-8");
  return processContentOptimized(fileContent);
}

/**
 * 流式处理大文件内容
 * @param filePath 文件路径
 * @returns 处理后的文件内容
 */
async function processFileContentStream(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const stream = createReadStream(filePath, {
      encoding: "utf-8",
      highWaterMark: CHUNK_SIZE,
    });

    stream.on("data", (chunk: string | Buffer) => {
      const chunkStr =
        typeof chunk === "string" ? chunk : chunk.toString("utf-8");
      chunks.push(chunkStr);

      // 如果累积内容过大，提前处理
      if (chunks.join("").length > MAX_FILE_SIZE * 2) {
        stream.destroy();
        const content = chunks.join("");
        resolve(processContentOptimized(content));
      }
    });

    stream.on("end", () => {
      const content = chunks.join("");
      resolve(processContentOptimized(content));
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * 优化的内容处理逻辑
 * @param content 原始文件内容
 * @returns 处理后的内容
 */
function processContentOptimized(content: string): string {
  // 快速过滤空行，避免多次字符串操作
  const lines = content.split("\n");
  const nonEmptyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line !== "") {
      nonEmptyLines.push(line);
    }

    // 如果行数过多，提前截断
    if (nonEmptyLines.length > MAX_LINES) {
      break;
    }
  }

  // 如果行数超过限制，智能截断
  if (nonEmptyLines.length > MAX_LINES) {
    const startLines = Math.floor(MAX_LINES * 0.6);
    const endLines = MAX_LINES - startLines;

    const startContent = nonEmptyLines.slice(0, startLines).join("\n");
    const endContent = nonEmptyLines.slice(-endLines).join("\n");

    return `${startContent}\n// ... (中间内容已截断) ...\n${endContent}`;
  }

  return nonEmptyLines.join("\n");
}

/**
 * 文件分析函数
 * @param filePath 文件路径
 * @param fileName 文件名
 * @param fileExtension 文件扩展名
 * @param fileSize 文件大小
 * @returns 文件分析结果，过大文件返回null
 */
async function analyzeFileWithAI(
  filePath: string,
  fileName: string,
  fileExtension: string,
  fileSize?: number
): Promise<FileAnalysisResult | null> {
  try {
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return null; // 过大文件直接返回null，不包含在结果中
    }

    // 只分析业务代码文件
    if (AI_PROGRAMMING_FILE_TYPES.code.includes(fileExtension)) {
      const fileContent = await processFileContent(filePath);

      return await fileAnalysisChain(filePath, fileContent);
    }

    // 非业务代码文件直接跳过
    return null;
  } catch (error) {
    console.warn(`分析文件失败: ${filePath}`, error);
    return null;
  }
}

// 并发控制配置
const CONCURRENT_LIMIT = 5; // 同时分析的文件数量
const BATCH_SIZE = 10; // 批处理大小

/**
 * 信号量类 - 用于控制并发数量
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

/**
 * 文件优先级计算 - 根据文件类型和大小计算优先级
 */
function calculateFilePriority(node: ProjectNode): number {
  let priority = 0;

  // 核心代码文件优先级最高
  if (AI_PROGRAMMING_FILE_TYPES.code.includes(node.extension || "")) {
    priority += 100;
  }

  // 小文件优先级更高（处理更快）
  if (node.size && node.size < 10 * 1024) {
    // 10KB以下
    priority += 50;
  } else if (node.size && node.size < 50 * 1024) {
    // 50KB以下
    priority += 25;
  }

  // 测试文件优先级较低
  if (node.name.includes(".test.") || node.name.includes(".spec.")) {
    priority -= 20;
  }

  return priority;
}

/**
 * 优化的项目分析函数（支持真正的并发控制和智能批处理）
 * @param projectTree 项目树（已通过analyzeProjectStructure过滤）
 * @param options 分析选项
 * @returns 文件分析结果数组
 */
export async function analyzeProjectWithAI(
  projectTree: ProjectNode,
  options: {
    concurrentLimit?: number;
    batchSize?: number;
    enableProgress?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    enablePerformanceMonitoring?: boolean;
  } = {}
): Promise<FileAnalysisResult[]> {
  const {
    concurrentLimit = CONCURRENT_LIMIT,
    batchSize = BATCH_SIZE,
    enableProgress = true,
    maxRetries = 3,
    retryDelay = 1000,
    enablePerformanceMonitoring = false,
  } = options;

  const startTime = Date.now();
  const performanceMetrics = {
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    averageProcessingTime: 0,
    memoryUsage: process.memoryUsage(),
  };

  const analysisResults: FileAnalysisResult[] = [];
  const fileQueue: ProjectNode[] = [];
  const semaphore = new Semaphore(concurrentLimit);
  let processedCount = 0;
  let failedCount = 0;

  // 1. 收集所有文件并按优先级排序
  function collectFiles(node: ProjectNode) {
    if (node.type === "file") {
      fileQueue.push(node);
    } else if (node.children) {
      for (const child of node.children) {
        collectFiles(child);
      }
    }
  }

  collectFiles(projectTree);

  // 按优先级排序，优先处理重要文件
  fileQueue.sort((a, b) => calculateFilePriority(b) - calculateFilePriority(a));

  // 更新性能指标
  performanceMetrics.totalFiles = fileQueue.length;
  performanceMetrics.totalSize = fileQueue.reduce(
    (sum, file) => sum + (file.size || 0),
    0
  );

  if (enableProgress) {
    console.log(
      `开始分析 ${fileQueue.length} 个文件（并发限制: ${concurrentLimit}）...`
    );
    if (enablePerformanceMonitoring) {
      console.log(
        `总文件大小: ${(performanceMetrics.totalSize / 1024 / 1024).toFixed(
          2
        )} MB`
      );
    }
  }

  // 2. 带重试的文件分析函数
  async function analyzeFileWithRetry(
    node: ProjectNode,
    retryCount: number = 0
  ): Promise<FileAnalysisResult | null> {
    try {
      await semaphore.acquire();

      const result = await analyzeFileWithAI(
        node.path,
        node.name,
        node.extension || "",
        node.size
      );

      processedCount++;
      if (enableProgress && processedCount % 10 === 0) {
        const progress = ((processedCount / fileQueue.length) * 100).toFixed(1);
        console.log(
          `进度: ${progress}% (${processedCount}/${fileQueue.length})`
        );
      }

      return result;
    } catch (error) {
      failedCount++;
      console.warn(
        `分析文件失败 (尝试 ${retryCount + 1}/${maxRetries}): ${node.path}`,
        error
      );

      if (retryCount < maxRetries) {
        // 指数退避重试
        const delay = retryDelay * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return analyzeFileWithRetry(node, retryCount + 1);
      } else {
        // 达到最大重试次数，返回错误结果
        return {
          name: node.name,
          path: node.path,
          type: "other" as const,
          description: `分析失败: ${node.name}`,
          dependencies: [],
          size: node.size,
          extension: node.extension,
        };
      }
    } finally {
      semaphore.release();
    }
  }

  // 3. 智能批处理 - 根据文件大小动态调整批次
  async function processBatch(
    batch: ProjectNode[]
  ): Promise<FileAnalysisResult[]> {
    const promises = batch.map((node) => analyzeFileWithRetry(node));
    const results = await Promise.all(promises);
    return results.filter(
      (result): result is FileAnalysisResult => result !== null
    );
  }

  // 4. 动态批处理策略
  const batches: ProjectNode[][] = [];
  let currentBatch: ProjectNode[] = [];
  let currentBatchSize = 0;
  const maxBatchSize = batchSize * 1024; // 转换为字节

  for (const node of fileQueue) {
    const nodeSize = node.size || 0;

    // 如果当前批次过大或达到数量限制，开始新批次
    if (
      currentBatchSize + nodeSize > maxBatchSize ||
      currentBatch.length >= batchSize
    ) {
      if (currentBatch.length > 0) {
        batches.push([...currentBatch]);
      }
      currentBatch = [node];
      currentBatchSize = nodeSize;
    } else {
      currentBatch.push(node);
      currentBatchSize += nodeSize;
    }
  }

  // 添加最后一个批次
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // 5. 处理所有批次
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    if (enableProgress) {
      console.log(
        `处理批次 ${i + 1}/${batches.length} (${
          batch.length
        } 个文件, 总大小: ${(currentBatchSize / 1024).toFixed(1)}KB)`
      );
    }

    const batchResults = await processBatch(batch);
    analysisResults.push(...batchResults);

    // 批次间短暂延迟，避免系统过载
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // 更新最终性能指标
  performanceMetrics.processedFiles = processedCount - failedCount;
  performanceMetrics.failedFiles = failedCount;
  performanceMetrics.averageProcessingTime = totalTime / processedCount;

  if (enableProgress) {
    console.log(`分析完成！`);
    console.log(`- 成功处理: ${processedCount - failedCount} 个文件`);
    console.log(`- 失败文件: ${failedCount} 个文件`);
    console.log(`- 总结果: ${analysisResults.length} 个文件`);

    if (enablePerformanceMonitoring) {
      const finalMemoryUsage = process.memoryUsage();
      console.log(`\n📊 性能统计:`);
      console.log(`- 总耗时: ${(totalTime / 1000).toFixed(2)} 秒`);
      console.log(
        `- 平均处理时间: ${performanceMetrics.averageProcessingTime.toFixed(
          2
        )} 毫秒/文件`
      );
      console.log(
        `- 处理速度: ${(
          performanceMetrics.totalSize /
          1024 /
          1024 /
          (totalTime / 1000)
        ).toFixed(2)} MB/秒`
      );
      console.log(
        `- 内存使用: ${(finalMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `- 内存增长: ${(
          (finalMemoryUsage.heapUsed -
            performanceMetrics.memoryUsage.heapUsed) /
          1024 /
          1024
        ).toFixed(2)} MB`
      );
    }
  }

  return analysisResults;
}
