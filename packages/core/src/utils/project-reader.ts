import { readFileSync, existsSync } from "fs";
import { join, relative } from "path";
import { PackageJson } from "type-fest";
import directoryTree from "directory-tree";
import type { FileAnalysisResult } from "../types/file-analysis-result";
import { fileAnalysisChain } from "../ai/genFileAnalysisResult";
import { DEFAULT_ANALYSIS_OPTIONS, AnalysisOptions } from "./default-options";
import { logger } from "./logger";
import { PerformanceTracker } from "./performance-tracker";
import {
  collectAndSortFiles,
  buildDynamicBatches,
  readFileWithStrategy,
} from "./file-processor";
import ignore from "ignore";
import pLimit from "p-limit";

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
 * 项目文件节点接口
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
 * 创建 ignore 实例并加载 .gitignore 规则
 * @param rootPath 项目根路径
 * @returns ignore 实例
 */
function createIgnoreInstance(rootPath: string): ignore.Ignore {
  const ig = ignore();
  const gitignorePath = join(rootPath, ".gitignore");

  if (existsSync(gitignorePath)) {
    try {
      const content = readFileSync(gitignorePath, "utf-8");
      ig.add(content);
    } catch (error) {
      logger.warn("读取 .gitignore 文件失败:", error);
    }
  }

  return ig;
}

/**
 * 使用 ignore 库过滤项目节点
 * @param node 项目节点
 * @param rootPath 项目根路径
 * @param ig ignore 实例
 * @returns 过滤后的节点
 */
function filterNodeWithIgnore(
  node: ProjectNode,
  rootPath: string,
  ig: ignore.Ignore
): ProjectNode | null {
  // 计算相对于根路径的相对路径
  const relativePath = relative(rootPath, node.path);

  // 使用 ignore 库检查是否应该忽略
  if (ig.ignores(relativePath)) {
    return null;
  }

  // 如果是目录，递归过滤子节点
  if (node.children && node.children.length > 0) {
    const filteredChildren = node.children
      .map((child) => filterNodeWithIgnore(child, rootPath, ig))
      .filter((child): child is ProjectNode => child !== null);

    if (filteredChildren.length === 0) {
      // 如果目录下没有有效文件，也忽略该目录
      return null;
    }

    return {
      ...node,
      children: filteredChildren,
    };
  }

  return node;
}

// 保留原有的文件类型定义
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

  // 合并用户自定义排除规则和默认规则
  const excludePatterns = [...(options.exclude || []), ...defaultExclude];

  // 只分析业务代码文件
  const defaultExtensions = new RegExp(
    `\\.(${AI_PROGRAMMING_FILE_TYPES.code.join("|").replace(/\./g, "")})$`
  );

  // 使用 directory-tree 生成初始树结构
  const tree = directoryTree(rootPath, {
    exclude: excludePatterns,
    extensions: options.extensions || defaultExtensions,
    normalizePath: options.normalizePath ?? true,
    attributes: options.attributes || (["size", "type", "extension"] as any),
    depth: options.maxDepth || 5,
  } as any) as ProjectNode;

  // 如果启用了 gitignore 过滤，使用 ignore 库进行二次过滤
  if (options.useGitignore !== false) {
    const ig = createIgnoreInstance(rootPath);
    const filteredTree = filterNodeWithIgnore(tree, rootPath, ig);
    return (
      filteredTree || {
        name: "",
        path: rootPath,
        type: "directory",
        children: [],
      }
    );
  }

  return tree;
}

/**
 * 文件分析函数
 * @param filePath 文件路径
 * @param fileName 文件名
 * @param fileExtension 文件扩展名
 * @param fileSize 文件大小
 * @param options 分析选项
 * @returns 文件分析结果，过大文件返回null
 */
async function analyzeFileWithAI(
  filePath: string,
  fileName: string,
  fileExtension: string,
  fileSize?: number,
  options: AnalysisOptions = {}
): Promise<FileAnalysisResult | null> {
  try {
    const maxFileSize = options.maxFileSize || 100 * 1024;
    if (fileSize && fileSize > maxFileSize) {
      if (options.verbose) {
        logger.debug(
          `跳过过大文件: ${filePath} (${(fileSize / 1024).toFixed(1)}KB)`
        );
      }
      return null; // 过大文件直接返回null，不包含在结果中
    }

    // 只分析业务代码文件
    if (AI_PROGRAMMING_FILE_TYPES.code.includes(fileExtension)) {
      const fileContent = await readFileWithStrategy(filePath, options);
      return await fileAnalysisChain(filePath, fileContent);
    }

    // 非业务代码文件直接跳过
    return null;
  } catch (error) {
    logger.warn(`分析文件失败: ${filePath}`, error);
    return null;
  }
}

/**
 * 重构后的项目分析函数（使用 p-limit 优化并发控制）
 * @param projectTree 项目树（已通过analyzeProjectStructure过滤）
 * @param options 分析选项
 * @returns 文件分析结果数组
 */
export async function analyzeProjectWithAI(
  projectTree: ProjectNode,
  options: AnalysisOptions = {}
): Promise<FileAnalysisResult[]> {
  // 合并默认选项和用户选项
  const mergedOptions = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };

  // 初始化性能跟踪器
  const performanceTracker = new PerformanceTracker();

  // 1. 收集和排序文件
  const {
    files: fileQueue,
    totalSize,
    skippedFiles,
  } = collectAndSortFiles(projectTree, mergedOptions);

  // 设置性能跟踪器的总文件数
  performanceTracker.setTotalFiles(fileQueue.length);
  performanceTracker.updateFileStats(0, 0, skippedFiles, totalSize);

  if (mergedOptions.enableProgress) {
    logger.info(
      `开始分析 ${fileQueue.length} 个文件（并发限制: ${mergedOptions.concurrentLimit}）...`
    );
    if (mergedOptions.enablePerformanceMonitoring) {
      logger.info(`总文件大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  // 2. 构建动态批次
  const { batches, batchSizes } = buildDynamicBatches(fileQueue, mergedOptions);

  // 3. 使用 p-limit 创建并发限制器
  const limit = pLimit(mergedOptions.concurrentLimit);
  const analysisResults: FileAnalysisResult[] = [];
  let processedCount = 0;
  let failedCount = 0;

  // 4. 带重试的文件分析函数
  async function analyzeFileWithRetry(
    node: ProjectNode,
    retryCount: number = 0
  ): Promise<FileAnalysisResult | null> {
    try {
      const result = await analyzeFileWithAI(
        node.path,
        node.name,
        node.extension || "",
        node.size,
        mergedOptions
      );

      processedCount++;
      performanceTracker.updateFileStats(1, 0, 0, node.size || 0);

      if (mergedOptions.enableProgress && processedCount % 10 === 0) {
        const progress = performanceTracker.getProgressPercentage().toFixed(1);
        logger.info(
          `进度: ${progress}% (${processedCount}/${fileQueue.length})`
        );
      }

      return result;
    } catch (error) {
      failedCount++;
      performanceTracker.updateFileStats(0, 1, 0, 0);
      logger.warn(
        `分析文件失败 (尝试 ${retryCount + 1}/${mergedOptions.maxRetries}): ${
          node.path
        }`,
        error
      );

      if (retryCount < mergedOptions.maxRetries) {
        // 指数退避重试
        const delay = mergedOptions.retryDelay * Math.pow(2, retryCount);
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
    }
  }

  // 5. 批处理函数（使用 p-limit）
  async function processBatch(
    batch: ProjectNode[]
  ): Promise<FileAnalysisResult[]> {
    const promises = batch.map((node) =>
      limit(() => analyzeFileWithRetry(node))
    );
    const results = await Promise.all(promises);
    return results.filter(
      (result): result is FileAnalysisResult => result !== null
    );
  }

  // 6. 处理所有批次
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchSize = batchSizes[i];

    if (mergedOptions.enableProgress) {
      logger.info(
        `处理批次 ${i + 1}/${batches.length} (${
          batch.length
        } 个文件, 总大小: ${(batchSize / 1024).toFixed(1)}KB)`
      );
    }

    const batchResults = await processBatch(batch);
    analysisResults.push(...batchResults);

    // 批次间短暂延迟，避免系统过载
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // 7. 打印最终结果和性能报告
  if (mergedOptions.enableProgress) {
    logger.info(`分析完成！`);
    logger.info(`- 成功处理: ${processedCount - failedCount} 个文件`);
    logger.info(`- 失败文件: ${failedCount} 个文件`);
    logger.info(`- 跳过文件: ${skippedFiles} 个文件`);
    logger.info(`- 总结果: ${analysisResults.length} 个文件`);

    // 打印性能报告
    performanceTracker.printReport(mergedOptions.enablePerformanceMonitoring);
  }

  return analysisResults;
}

/**
 * 获取项目中被忽略的文件列表（用于调试）
 * @param rootPath 项目根路径
 * @param filePaths 要检查的文件路径数组
 * @returns 被忽略的文件路径数组
 */
export function getIgnoredFiles(
  rootPath: string,
  filePaths: string[]
): string[] {
  const ig = createIgnoreInstance(rootPath);
  return filePaths.filter((filePath) => {
    const relativePath = relative(rootPath, filePath);
    return ig.ignores(relativePath);
  });
}
