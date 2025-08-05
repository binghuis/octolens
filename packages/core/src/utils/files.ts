import { Transform } from "stream";
import { readFileSync, createReadStream, statSync } from "fs";
import { ProjectNode } from "./project";
import { FILE_PRIORITY_WEIGHTS, AnalysisOptions } from "./options";
import { logger } from "./logger";

/**
 * 文件收集和排序结果
 */
export interface FileCollectionResult {
  files: ProjectNode[];
  totalSize: number;
  skippedFiles: number;
}

/**
 * 批处理结果
 */
export interface BatchResult {
  batches: ProjectNode[][];
  batchSizes: number[];
}

/**
 * 文件收集和排序
 */
export function collectAndSortFiles(
  projectTree: ProjectNode,
  options: AnalysisOptions
): FileCollectionResult {
  const files: ProjectNode[] = [];
  let totalSize = 0;
  let skippedFiles = 0;

  function collectFiles(node: ProjectNode) {
    if (node.type === "file") {
      // 检查文件大小限制
      if (node.size && node.size > (options.maxFileSize || 100 * 1024)) {
        if (options.verbose) {
          logger.debug(
            `跳过过大文件: ${node.path} (${(node.size / 1024).toFixed(1)}KB)`
          );
        }
        skippedFiles++;
        return;
      }

      files.push(node);
      totalSize += node.size || 0;
    } else if (node.children) {
      for (const child of node.children) {
        collectFiles(child);
      }
    }
  }

  collectFiles(projectTree);

  // 按优先级排序
  files.sort(
    (a, b) =>
      calculateFilePriority(b, options) - calculateFilePriority(a, options)
  );

  if (options.verbose) {
    logger.info(
      `收集到 ${files.length} 个文件，总大小: ${(
        totalSize /
        1024 /
        1024
      ).toFixed(2)} MB`
    );
    if (skippedFiles > 0) {
      logger.info(`跳过 ${skippedFiles} 个过大文件`);
    }
  }

  return { files, totalSize, skippedFiles };
}

/**
 * 计算文件优先级
 */
export function calculateFilePriority(
  node: ProjectNode,
  options: AnalysisOptions
): number {
  let priority = 0;
  const extension = node.extension || "";

  // 根据文件扩展名计算优先级
  for (const [ext, weight] of Object.entries(FILE_PRIORITY_WEIGHTS.code)) {
    if (extension === ext) {
      priority += weight;
      break;
    }
  }

  // 样式文件优先级
  for (const [ext, weight] of Object.entries(FILE_PRIORITY_WEIGHTS.style)) {
    if (extension === ext) {
      priority += weight;
      break;
    }
  }

  // 类型定义文件优先级
  for (const [ext, weight] of Object.entries(FILE_PRIORITY_WEIGHTS.type)) {
    if (extension === ext) {
      priority += weight;
      break;
    }
  }

  // 测试文件优先级（降低）
  for (const [pattern, weight] of Object.entries(FILE_PRIORITY_WEIGHTS.test)) {
    if (node.name.includes(pattern)) {
      priority += weight;
      break;
    }
  }

  // 根据文件大小计算优先级
  const fileSize = node.size || 0;
  if (fileSize < 10 * 1024) {
    priority += FILE_PRIORITY_WEIGHTS.size.small;
  } else if (fileSize < 50 * 1024) {
    priority += FILE_PRIORITY_WEIGHTS.size.medium;
  } else {
    priority += FILE_PRIORITY_WEIGHTS.size.large;
  }

  return priority;
}

/**
 * 构建动态批次
 */
export function buildDynamicBatches(
  files: ProjectNode[],
  options: AnalysisOptions
): BatchResult {
  const batches: ProjectNode[][] = [];
  const batchSizes: number[] = [];
  let currentBatch: ProjectNode[] = [];
  let currentBatchSize = 0;
  const maxBatchSize = (options.batchSize || 10) * 1024; // 转换为字节

  for (const file of files) {
    const fileSize = file.size || 0;

    // 如果当前批次过大或达到数量限制，开始新批次
    if (
      currentBatchSize + fileSize > maxBatchSize ||
      currentBatch.length >= (options.batchSize || 10)
    ) {
      if (currentBatch.length > 0) {
        batches.push([...currentBatch]);
        batchSizes.push(currentBatchSize);
      }
      currentBatch = [file];
      currentBatchSize = fileSize;
    } else {
      currentBatch.push(file);
      currentBatchSize += fileSize;
    }
  }

  // 添加最后一个批次
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
    batchSizes.push(currentBatchSize);
  }

  return { batches, batchSizes };
}

/**
 * 优化的内容处理逻辑
 */
export function processContentOptimized(
  content: string,
  maxLines: number
): string {
  // 快速过滤空行，避免多次字符串操作
  const lines = content.split("\n");
  const nonEmptyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line !== "") {
      nonEmptyLines.push(line);
    }

    // 如果行数过多，提前截断
    if (nonEmptyLines.length > maxLines) {
      break;
    }
  }

  // 如果行数超过限制，智能截断
  if (nonEmptyLines.length > maxLines) {
    const startLines = Math.floor(maxLines * 0.6);
    const endLines = maxLines - startLines;

    const startContent = nonEmptyLines.slice(0, startLines).join("\n");
    const endContent = nonEmptyLines.slice(-endLines).join("\n");

    return `${startContent}\n// ... (中间内容已截断) ...\n${endContent}`;
  }

  return nonEmptyLines.join("\n");
}

/**
 * 同步处理小文件内容
 */
export function processFileContentSync(
  filePath: string,
  maxLines: number
): string {
  const fileContent = readFileSync(filePath, "utf-8");
  return processContentOptimized(fileContent, maxLines);
}

/**
 * 流式处理大文件内容（使用 Transform Stream）
 */
export function processFileContentStream(
  filePath: string,
  maxLines: number,
  chunkSize: number = 64 * 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const nonEmptyLines: string[] = [];
    let lineCount = 0;

    // 创建 Transform Stream 来边读边处理
    const transformStream = new Transform({
      transform(chunk, _encoding, callback) {
        const chunkStr = chunk.toString("utf-8");
        const lines = chunkStr.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed !== "") {
            nonEmptyLines.push(trimmed);
            lineCount++;

            // 如果行数过多，提前截断
            if (lineCount >= maxLines) {
              break;
            }
          }
        }

        // 如果已经达到行数限制，停止读取
        if (lineCount >= maxLines) {
          this.destroy();
        }

        callback();
      },

      flush(callback) {
        // 处理最终结果
        const result = processContentOptimized(
          nonEmptyLines.join("\n"),
          maxLines
        );
        resolve(result);
        callback();
      },
    });

    const stream = createReadStream(filePath, {
      encoding: "utf-8",
      highWaterMark: chunkSize,
    });

    stream.pipe(transformStream);

    stream.on("error", (error) => {
      reject(error);
    });

    transformStream.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * 智能文件内容读取策略
 */
export async function readFileWithStrategy(
  filePath: string,
  options: AnalysisOptions
): Promise<string> {
  try {
    const stats = statSync(filePath);
    const chunkSize = options.chunkSize || 64 * 1024;
    const maxLines = options.maxLines || 1000;

    // 对于小文件，直接读取
    if (stats.size < chunkSize) {
      return processFileContentSync(filePath, maxLines);
    }

    // 对于大文件，使用流式处理
    return await processFileContentStream(filePath, maxLines, chunkSize);
  } catch (error) {
    logger.warn(`处理文件内容失败: ${filePath}`, error);
    return "";
  }
}
