import {
  analyzeProjectStructure,
  analyzeProjectWithAI,
} from "./project-reader";

/**
 * 性能测试函数
 */
export async function runPerformanceTest(projectPath: string = process.cwd()) {
  console.log("🚀 开始性能测试...\n");

  // 1. 分析项目结构
  console.log("📁 分析项目结构...");
  const projectTree = analyzeProjectStructure(projectPath, {
    useGitignore: true,
    maxDepth: 5,
  });

  // 2. 测试优化前的性能（模拟）
  console.log("\n⏱️  测试优化后的性能...");
  const startTime = Date.now();

  const results = await analyzeProjectWithAI(projectTree, {
    concurrentLimit: 5,
    batchSize: 10,
    enableProgress: true,
    maxRetries: 3,
    retryDelay: 1000,
    enablePerformanceMonitoring: true,
  });

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  console.log(`\n✅ 性能测试完成！`);
  console.log(`- 总耗时: ${(totalTime / 1000).toFixed(2)} 秒`);
  console.log(`- 分析文件数: ${results.length} 个`);

  return {
    totalTime,
    fileCount: results.length,
    results,
  };
}

// 如果直接运行此文件
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}
