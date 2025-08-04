# OctoLens Core

OctoLens 的核心功能模块，提供项目结构分析、AI 智能分析和插件系统支持。

## 项目结构

```
packages/core/src/
├── index.ts              # 主入口文件，导出所有公共 API
├── types/                # 类型定义
│   ├── index.ts         # 核心类型定义
│   ├── project-metadata.ts  # 项目元数据类型
│   └── file-analysis-result.ts  # 文件分析结果类型
├── config/               # 配置管理
│   └── index.ts         # 配置验证和默认配置
├── utils/                # 工具函数
│   ├── logger.ts        # 日志工具
│   ├── performance-tracker.ts  # 性能跟踪器
│   ├── project-reader.ts      # 项目读取器
│   ├── file-processor.ts      # 文件处理器
│   └── default-options.ts     # 默认选项配置
├── ai/                   # AI 功能
│   ├── client.ts        # AI 客户端
│   ├── genFileAnalysisResult.ts  # 文件分析生成
│   └── genProjectMetadata.ts     # 项目元数据生成
├── plugins/              # 插件系统
│   └── index.ts         # 插件管理器和接口
├── mcp/                  # MCP 协议
│   └── index.ts         # MCP 服务器和客户端实现
├── prompts/              # AI 提示词
│   ├── file-analysis.ts # 文件分析提示词
│   └── project-analysis.ts  # 项目分析提示词
└── scanner.ts            # 核心扫描器
```

## 核心功能

### 1. 类型系统 (`types/`)

- **统一类型定义**: 所有核心类型在 `types/index.ts` 中定义
- **类型安全**: 使用 Zod 进行运行时类型验证
- **模块化**: 按功能分离类型定义

### 2. 配置管理 (`config/`)

- **配置验证**: 使用 Zod Schema 验证配置
- **默认配置**: 提供合理的默认值
- **类型安全**: 配置对象具有完整的类型定义

### 3. 工具函数 (`utils/`)

- **日志系统**: 统一的日志记录
- **性能跟踪**: 详细的性能监控
- **文件处理**: 高效的文件读取和处理
- **项目读取**: 项目结构分析

### 4. AI 功能 (`ai/`)

- **AI 客户端**: 支持多种 AI 提供商
- **结构化输出**: 使用 LangChain 生成结构化结果
- **提示词管理**: 统一的提示词模板

### 5. 插件系统 (`plugins/`)

- **插件接口**: 标准化的插件接口
- **插件管理器**: 统一的插件注册和管理
- **优先级系统**: 支持插件优先级排序

### 6. MCP 协议 (`mcp/`)

- **协议实现**: Model Context Protocol 实现
- **服务器端**: 提供 MCP 服务
- **客户端**: MCP 客户端实现

### 7. 核心扫描器 (`scanner.ts`)

- **统一入口**: 整合所有功能的扫描器
- **配置驱动**: 支持灵活的配置选项
- **性能优化**: 批量处理和并发控制

## 使用示例

### 基本使用

```typescript
import { OctoLensScanner } from "@octolens/core";

const scanner = new OctoLensScanner({
  rootPath: "./my-project",
  enableAI: true,
  aiConfig: {
    provider: "ollama",
    model: "llama3.2",
  },
});

const result = await scanner.scanProject();
console.log(result);
```

### 使用插件

```typescript
import { pluginManager } from "@octolens/core";

// 注册插件
pluginManager.register({
  name: "my-plugin",
  version: "1.0.0",
  description: "自定义插件",
  priority: 100,
  canHandle: (path) => path.endsWith(".my"),
  analyzeFile: async (path, content) => {
    // 自定义分析逻辑
    return {
      /* 分析结果 */
    };
  },
});
```

### 配置验证

```typescript
import { validateConfig } from "@octolens/core";

const config = validateConfig({
  rootPath: "./project",
  maxDepth: 5,
  enableAI: true,
});
```

## API 文档

### 核心类型

- `ScanConfig`: 扫描配置
- `ScanResult`: 扫描结果
- `ProjectMetadata`: 项目元数据
- `FileAnalysisResult`: 文件分析结果

### 主要类

- `OctoLensScanner`: 核心扫描器
- `PluginManager`: 插件管理器
- `PerformanceTracker`: 性能跟踪器

### 工具函数

- `validateConfig()`: 配置验证
- `getProjectMetadata()`: 获取项目元数据
- `analyzeProjectStructure()`: 分析项目结构

## 开发指南

### 添加新功能

1. 在相应的目录下创建新文件
2. 在 `index.ts` 中导出新功能
3. 添加类型定义到 `types/`
4. 更新文档

### 插件开发

1. 实现 `Plugin` 接口
2. 使用 `pluginManager.register()` 注册插件
3. 实现必要的生命周期方法

### 测试

```bash
# 运行测试
pnpm test

# 类型检查
pnpm type-check

# 构建
pnpm build
```

## 依赖关系

### 内部依赖

- `types/` → 所有模块的基础类型
- `config/` → 被 `scanner.ts` 使用
- `utils/` → 被所有模块使用
- `ai/` → 被 `scanner.ts` 使用
- `plugins/` → 被 `scanner.ts` 使用
- `mcp/` → 独立模块，可选择性使用

### 外部依赖

- `zod`: 类型验证
- `@langchain/deepseek`: AI 模型
- `directory-tree`: 目录树生成
- `ignore`: 文件忽略规则

## 注意事项

1. **类型安全**: 所有公共 API 都有完整的类型定义
2. **错误处理**: 所有异步操作都有适当的错误处理
3. **性能**: 使用批量处理和并发控制优化性能
4. **可扩展性**: 插件系统支持功能扩展
5. **配置**: 支持灵活的配置选项
