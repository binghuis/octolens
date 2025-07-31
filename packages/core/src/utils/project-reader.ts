import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PackageJson } from "type-fest";
import directoryTree from "directory-tree";
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

  // 使用AI_PROGRAMMING_FILE_TYPES生成默认扩展名正则表达式
  const allExtensions = [
    ...AI_PROGRAMMING_FILE_TYPES.code,
    ...AI_PROGRAMMING_FILE_TYPES.style,
    ...AI_PROGRAMMING_FILE_TYPES.type,
    ...AI_PROGRAMMING_FILE_TYPES.asset,
  ];
  const defaultExtensions = new RegExp(
    `\\.(${allExtensions.join("|").replace(/\./g, "")})$`
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

/**
 * 文件分析结果接口
 */
export interface FileAnalysis {
  name: string;
  path: string;
  type:
    | "component"
    | "page"
    | "hook"
    | "utility"
    | "style"
    | "asset"
    | "config"
    | "test"
    | "other";
  description: string;
  dependencies: string[];
  props?: string[];
  exports?: string[];
  imports?: string[];
  size?: number;
  extension?: string;
}

// 文件类型识别规则
const FILE_TYPE_RULES = {
  // 基于扩展名的直接映射
  extensions: {
    // 样式文件 - 直接通过扩展名识别
    ".css": "style",
    ".scss": "style",
    ".less": "style",
    ".sass": "style",

    // 静态资源 - 直接通过扩展名识别
    ".svg": "asset",
    ".png": "asset",
    ".jpg": "asset",
    ".jpeg": "asset",
    ".webp": "asset",
    ".avif": "asset",
    ".ico": "asset",
    ".gif": "asset",
    ".bmp": "asset",
    ".tiff": "asset",
    ".woff": "asset",
    ".woff2": "asset",
    ".ttf": "asset",
    ".otf": "asset",

    // 类型定义文件
    ".d.ts": "utility",
  },

  // 需要AI分析的扩展名
  needsAIAnalysis: [".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte", ".astro"],
} as const;

// 文件大小限制（字节）
const MAX_FILE_SIZE = 100 * 1024; // 100KB
const MAX_CONTENT_LENGTH = 50 * 1024; // 50KB for AI analysis

/**
 * 文件分析函数
 * @param filePath 文件路径
 * @param fileName 文件名
 * @param fileExtension 文件扩展名
 * @param fileSize 文件大小
 * @returns 文件分析结果
 */
async function analyzeFileWithAI(
  filePath: string,
  fileName: string,
  fileExtension: string,
  fileSize?: number
): Promise<FileAnalysis> {
  try {
    // 1. 文件大小检查
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return {
        name: fileName,
        path: filePath,
        type: "other",
        description: `文件过大，跳过分析: ${fileName} (${Math.round(
          fileSize / 1024
        )}KB)`,
        dependencies: [],
        size: fileSize,
        extension: fileExtension,
      };
    }

    // 2. 静态资源文件 - 根据文件名生成描述
    if (
      FILE_TYPE_RULES.extensions[
        fileExtension as keyof typeof FILE_TYPE_RULES.extensions
      ] === "asset"
    ) {
      return {
        name: fileName,
        path: filePath,
        type: "asset",
        description: `静态资源文件: ${fileName}`,
        dependencies: [],
        size: fileSize,
        extension: fileExtension,
      };
    }

    // 3. 样式文件 - 根据文件名生成描述
    if (
      FILE_TYPE_RULES.extensions[
        fileExtension as keyof typeof FILE_TYPE_RULES.extensions
      ] === "style"
    ) {
      return {
        name: fileName,
        path: filePath,
        type: "style",
        description: `样式文件: ${fileName}`,
        dependencies: [],
        size: fileSize,
        extension: fileExtension,
      };
    }

    // 4. 业务代码文件 - 通过AI分析内容
    if (FILE_TYPE_RULES.needsAIAnalysis.includes(fileExtension as any)) {
      let fileContent = "";
      try {
        fileContent = readFileSync(filePath, "utf-8");
        if (fileContent.length > MAX_CONTENT_LENGTH) {
          fileContent =
            fileContent.substring(0, MAX_CONTENT_LENGTH) +
            "\n// ... (内容已截断)";
        }
      } catch (readError) {
        return {
          name: fileName,
          path: filePath,
          type: "other",
          description: `无法读取文件: ${fileName}`,
          dependencies: [],
          size: fileSize,
          extension: fileExtension,
        };
      }

      // 构建AI分析提示
      const analysisPrompt = `请分析以下代码文件，判断其类型（页面、组件、Hook、工具函数等）并提取关键信息：

文件路径: ${filePath}
文件内容:
${fileContent}

请返回JSON格式的分析结果，包含：文件类型、功能描述、业务场景、依赖关系等关键信息。`;

      // TODO: 调用AI模型进行分析
      // const aiModel = getAIModel();
      // const analysisResult = await aiModel.analyze(analysisPrompt);
      // const parsedAnalysis = JSON.parse(analysisResult);

      return {
        name: fileName,
        path: filePath,
        type: "component", // AI分析后会确定具体类型
        description: `AI分析待实现: ${fileName}`,
        dependencies: [],
        size: fileSize,
        extension: fileExtension,
      };
    }

    // 5. 其他文件
    return {
      name: fileName,
      path: filePath,
      type: "other",
      description: `未识别的文件类型: ${fileName}`,
      dependencies: [],
      size: fileSize,
      extension: fileExtension,
    };
  } catch (error) {
    console.warn(`分析文件失败: ${filePath}`, error);
    return {
      name: fileName,
      path: filePath,
      type: "other",
      description: `分析失败: ${fileName}`,
      dependencies: [],
      size: fileSize,
      extension: fileExtension,
    };
  }
}

// 并发控制配置
const CONCURRENT_LIMIT = 5; // 同时分析的文件数量
const BATCH_SIZE = 10; // 批处理大小

/**
 * 优化的项目分析函数（支持并发控制）
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
  } = {}
): Promise<FileAnalysis[]> {
  const {
    concurrentLimit = CONCURRENT_LIMIT,
    batchSize = BATCH_SIZE,
    enableProgress = true,
  } = options;

  const analysisResults: FileAnalysis[] = [];
  const fileQueue: ProjectNode[] = [];

  // 1. 收集所有文件
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

  if (enableProgress) {
    console.log(`开始分析 ${fileQueue.length} 个文件...`);
  }

  // 2. 并发控制函数
  async function processBatch(batch: ProjectNode[]): Promise<FileAnalysis[]> {
    const promises = batch.map(async (node) => {
      try {
        return await analyzeFileWithAI(
          node.path,
          node.name,
          node.extension || "",
          node.size
        );
      } catch (error) {
        console.warn(`分析文件失败: ${node.path}`, error);
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
    });

    return Promise.all(promises);
  }

  // 3. 分批处理
  for (let i = 0; i < fileQueue.length; i += batchSize) {
    const batch = fileQueue.slice(i, i + batchSize);

    if (enableProgress) {
      console.log(
        `处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          fileQueue.length / batchSize
        )} (${batch.length} 个文件)`
      );
    }

    const batchResults = await processBatch(batch);
    analysisResults.push(...batchResults);

    // 4. 并发限制
    if (i + batchSize < fileQueue.length) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // 短暂延迟避免过载
    }
  }

  if (enableProgress) {
    console.log(`分析完成，共处理 ${analysisResults.length} 个文件`);
  }

  return analysisResults;
}
