# analyzeProjectWithAI 性能优化说明

## 优化概述

本次优化主要针对 `analyzeProjectWithAI` 函数进行了全面的性能提升，包括并发控制、内存优化、错误处理和监控等方面。

## 主要优化点

### 1. 真正的并发控制 🚀

**问题**: 原版本使用简单的 `Promise.all` 和延迟，无法真正控制并发数量。

**解决方案**:

- 实现了 `Semaphore` 类来控制并发数量
- 确保同时只有指定数量的文件在处理
- 避免系统资源过载

```typescript
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  async acquire(): Promise<void> {
    /* ... */
  }
  release(): void {
    /* ... */
  }
}
```

### 2. 智能文件优先级排序 📊

**优化**: 根据文件类型和大小计算优先级，优先处理重要文件

```typescript
function calculateFilePriority(node: ProjectNode): number {
  let priority = 0;

  // 核心代码文件优先级最高
  if (AI_PROGRAMMING_FILE_TYPES.code.includes(node.extension || "")) {
    priority += 100;
  }

  // 小文件优先级更高（处理更快）
  if (node.size && node.size < 10 * 1024) {
    priority += 50;
  }

  // 测试文件优先级较低
  if (node.name.includes(".test.") || node.name.includes(".spec.")) {
    priority -= 20;
  }

  return priority;
}
```

### 3. 流式文件处理 💾

**问题**: 大文件一次性读入内存可能导致内存溢出。

**解决方案**:

- 小文件（<64KB）使用同步读取
- 大文件使用流式处理，分块读取
- 智能截断，保留文件开头和结尾的重要部分

```typescript
async function processFileContent(filePath: string): Promise<string> {
  const stats = require("fs").statSync(filePath);
  if (stats.size < CHUNK_SIZE) {
    return processFileContentSync(filePath);
  }
  return await processFileContentStream(filePath);
}
```

### 4. 动态批处理策略 📦

**优化**: 根据文件大小动态调整批次，避免单个批次过大

```typescript
// 如果当前批次过大或达到数量限制，开始新批次
if (
  currentBatchSize + nodeSize > maxBatchSize ||
  currentBatch.length >= batchSize
) {
  batches.push([...currentBatch]);
  currentBatch = [node];
  currentBatchSize = nodeSize;
}
```

### 5. 智能重试机制 🔄

**特性**:

- 指数退避重试策略
- 可配置重试次数和延迟
- 失败文件统计和报告

```typescript
if (retryCount < maxRetries) {
  const delay = retryDelay * Math.pow(2, retryCount);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return analyzeFileWithRetry(node, retryCount + 1);
}
```

### 6. 性能监控 📈

**新增功能**:

- 实时进度显示
- 内存使用监控
- 处理速度统计
- 详细的性能报告

```typescript
if (enablePerformanceMonitoring) {
  console.log(`\n📊 性能统计:`);
  console.log(`- 总耗时: ${(totalTime / 1000).toFixed(2)} 秒`);
  console.log(
    `- 处理速度: ${(totalSize / 1024 / 1024 / (totalTime / 1000)).toFixed(
      2
    )} MB/秒`
  );
  console.log(
    `- 内存使用: ${(finalMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
  );
}
```

## 使用示例

### 基础使用

```typescript
const results = await analyzeProjectWithAI(projectTree, {
  concurrentLimit: 5,
  batchSize: 10,
  enableProgress: true,
});
```

### 启用性能监控

```typescript
const results = await analyzeProjectWithAI(projectTree, {
  concurrentLimit: 5,
  batchSize: 10,
  enableProgress: true,
  maxRetries: 3,
  retryDelay: 1000,
  enablePerformanceMonitoring: true, // 启用性能监控
});
```

### 性能测试

```typescript
import { runPerformanceTest } from "./performance-test";

const testResults = await runPerformanceTest("./your-project-path");
```

## 性能提升预期

1. **并发效率**: 提升 30-50% 的处理速度
2. **内存使用**: 减少 40-60% 的内存占用
3. **稳定性**: 大幅减少因内存不足导致的崩溃
4. **可观测性**: 详细的性能指标和进度显示

## 配置参数说明

| 参数                          | 默认值 | 说明                 |
| ----------------------------- | ------ | -------------------- |
| `concurrentLimit`             | 5      | 同时处理的最大文件数 |
| `batchSize`                   | 10     | 每批处理的文件数量   |
| `enableProgress`              | true   | 是否显示进度信息     |
| `maxRetries`                  | 3      | 失败重试次数         |
| `retryDelay`                  | 1000   | 重试延迟（毫秒）     |
| `enablePerformanceMonitoring` | false  | 是否启用性能监控     |

## 注意事项

1. **并发限制**: 根据系统资源调整 `concurrentLimit`，建议不超过 10
2. **内存监控**: 大项目建议启用性能监控，观察内存使用情况
3. **文件大小**: 超过 100KB 的文件会被跳过，避免处理过大的文件
4. **错误处理**: 失败的文件会记录在日志中，不会影响整体处理流程
