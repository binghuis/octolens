# OctoLens

OctoLens 是一个智能项目结构分析工具，使用 AI 技术深入理解代码库结构，为开发者提供强大的代码洞察能力。

## 特性

- 🤖 **AI 驱动分析** - 使用本地 AI 模型（如 Ollama）智能分析代码结构
- 🔍 **多维度扫描** - 支持 Vite、Next.js 等多种框架的项目扫描
- 📡 **MCP 协议支持** - 与 Cursor 等编辑器无缝集成
- 🔄 **实时监听** - 文件变化时自动更新项目结构
- 🧩 **插件化架构** - 易于扩展支持更多框架和工具
- ⚡ **高性能** - 基于 Fastify 的高性能 HTTP 服务

## 快速开始

### 安装

```bash
npm install octolens
```

### 命令行使用

```bash
# 分析当前目录
octolens

# 分析指定项目
octolens --path ./my-project

# 自定义配置
octolens --ignore "node_modules,dist" --max-depth 5 --ai-provider ollama
```

### 编程使用

```typescript
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
```

## MCP 工具函数

OctoLens 提供以下 MCP 工具函数：

- `getProjectStructure` - 获取项目结构概览
- `getComponents` - 获取组件列表
- `getPages` - 获取页面列表
- `getAssets` - 获取可复用资产
- `getSimilarFiles` - 查找相似功能的文件
- `getDependencies` - 获取依赖信息
- `getCodeStyle` - 获取代码风格特征
- `searchFiles` - 搜索文件
- `getFileContent` - 获取文件内容
- `analyzeCodePatterns` - 分析代码模式

## 插件开发

### 扫描器插件

```typescript
import { BaseScannerPlugin } from "@octolens/core";

export class MyScannerPlugin extends BaseScannerPlugin {
  name = "my-scanner";
  version = "1.0.0";

  validate(config: ScanConfig): boolean {
    return Boolean(config.rootPath && config.maxDepth > 0);
  }

  async scan(config: ScanConfig): Promise<Partial<ScanResult>> {
    // 实现扫描逻辑
    return {
      projectMetadata: {
        name: "my-project",
        framework: "my-framework",
      },
    };
  }
}
```

### 编辑器插件

```typescript
import { BaseEditorPlugin } from "@octolens/core";

export class MyEditorPlugin extends BaseEditorPlugin {
  name = "my-editor";
  version = "1.0.0";

  async integrate(config: PluginConfig): Promise<void> {
    // 实现编辑器集成逻辑
  }
}
```

## 配置选项

| 选项             | 类型     | 默认值                     | 描述             |
| ---------------- | -------- | -------------------------- | ---------------- |
| `rootPath`       | string   | `"."`                      | 项目根目录路径   |
| `maxDepth`       | number   | `10`                       | 最大扫描深度     |
| `ignorePatterns` | string[] | `["node_modules", "dist"]` | 忽略的文件模式   |
| `enableAI`       | boolean  | `true`                     | 是否启用 AI 分析 |
| `aiConfig`       | AIConfig | `{}`                       | AI 配置          |
| `enableWatch`    | boolean  | `true`                     | 是否启用文件监听 |

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check

# 测试
pnpm test
```

## 许可证

MIT
