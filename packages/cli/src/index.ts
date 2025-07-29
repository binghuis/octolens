import { OctoLens } from "@octolens/core";
import type { ScanConfig } from "@octolens/core";

// 解析命令行参数
function parseArgs(): ScanConfig & { noWatch?: boolean } {
  const args = process.argv.slice(2);
  const config: any = {
    rootPath: process.cwd(),
    maxDepth: 5,
    enableAI: false,
    ignorePatterns: [],
    noWatch: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--rootPath" && args[i + 1]) {
      config.rootPath = args[++i];
    } else if (arg === "--maxDepth" && args[i + 1]) {
      config.maxDepth = parseInt(args[++i], 10);
    } else if (arg === "--enableAI") {
      config.enableAI = true;
    } else if (arg === "--ignore" && args[i + 1]) {
      config.ignorePatterns.push(args[++i]);
    } else if (arg === "--no-watch") {
      config.noWatch = true;
    } else if (arg === "-h" || arg === "--help") {
      showHelp();
      process.exit(0);
    } else if (arg === "-v" || arg === "--version") {
      showVersion();
      process.exit(0);
    }
  }
  return config;
}

// 显示帮助信息
function showHelp(): void {
  console.log(`
OctoLens - 智能项目结构分析工具

用法: octolens [选项]

选项:
  --path <path>              项目路径 (默认: 当前目录)
  --max-depth <number>       最大扫描深度 (默认: 10)
  --ignore <patterns>        忽略的文件模式 (逗号分隔)
  --ai-provider <provider>   AI 提供商 (默认: ollama)
  --enable-ai <boolean>      是否启用 AI 分析 (默认: true)
  --watch <boolean>          是否启用文件监听 (默认: true)
  --help, -h                 显示帮助信息
  --version, -v              显示版本信息

示例:
  octolens --path ./my-project
  octolens --ignore "node_modules,dist" --max-depth 5
  octolens --ai-provider ollama --enable-ai true

编程用法:
  import { OctoLens } from "@octolens/core";

  const octolens = new OctoLens({
    rootPath: "./my-project",
    maxDepth: 10,
    ignorePatterns: ["node_modules", "dist"],
    aiConfig: {
      provider: "ollama",
      model: "codellama",
    },
  });

  await octolens.start();
`);
}

// 显示版本信息
function showVersion(): void {
  const packageJson = require("../package.json");
  console.log(`OctoLens v${packageJson.version}`);
}

// 主函数
async function main(): Promise<void> {
  try {
    // 解析配置
    const config = parseArgs();

    console.log("Starting OctoLens...");
    console.log(`Project path: ${config.rootPath}`);
    console.log(`Max depth: ${config.maxDepth}`);
    console.log(`AI enabled: ${config.enableAI}`);

    // 创建并启动 OctoLens
    const octolens = new OctoLens(config);
    await octolens.start();

    // 获取扫描结果
    const result = octolens.getScanResult();
    if (result) {
      console.log("\nScan completed successfully!");
      console.log(`Project: ${result.projectMetadata.name}`);
      console.log(
        `Framework: ${result.projectMetadata.framework || "unknown"}`
      );
      console.log(`Files: ${result.fileCount}`);
      console.log(`Directories: ${result.directoryCount}`);
    }

    // 保持进程运行以支持文件监听
    console.log("\nOctoLens is running. Press Ctrl+C to stop.");

    // 优雅关闭
    process.on("SIGINT", async () => {
      console.log("\nShutting down OctoLens...");
      await octolens.stop();
      process.exit(0);
    });

    if (config.noWatch) {
      await octolens.stop();
      process.exit(0);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// 运行主函数
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
