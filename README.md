# Structor - Cursor MCP 组件索引工具

一个为 Cursor 设计的 MCP (Model Context Protocol) 工具，用于自动索引和管理项目中的组件、Hooks、工具函数等，帮助 AI 更好地理解项目结构并提供更准确的代码生成建议。

## 功能特性

### 🎯 核心功能

- **自动扫描** - 自动发现项目中的组件、Hooks、工具函数
- **智能索引** - 建立详细的组件索引表，包含属性、依赖、描述等信息
- **语义搜索** - 基于功能描述和属性匹配推荐组件
- **实时更新** - 监听文件变化，自动更新索引

### 🔍 搜索能力

- **多维度匹配** - 支持按名称、描述、标签、类型搜索
- **相似度评分** - 提供匹配度评分和推荐原因
- **类型过滤** - 支持按组件类型（component/hook/utility/type）过滤
- **智能推荐** - 基于使用频率和相似度推荐最佳组件

### 📊 索引信息

- **组件属性** - 自动提取 Props 接口定义
- **依赖关系** - 分析组件间的依赖关系
- **框架检测** - 自动识别 React/Vue/Svelte 等框架
- **复杂度评估** - 评估组件的复杂度等级
- **使用统计** - 记录组件的使用频率

## 安装使用

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 配置 Cursor

在 Cursor 的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "structor": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    }
  }
}
```

### 4. 使用工具

#### 扫描项目

```
扫描项目中的所有组件和工具函数
```

#### 搜索组件

```
搜索包含 "button" 的组件
```

#### 查看组件详情

```
查看组件 "Button" 的详细信息
```

#### 列出所有组件

```
列出项目中的所有组件
```

## 配置选项

### 默认配置

```typescript
{
  rootPath: process.cwd(),
  includePatterns: ['**/*.{ts,tsx,js,jsx}'],
  excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  componentPaths: ['src/components/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  hookPaths: ['src/hooks/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],
  utilityPaths: ['src/utils/**/*.{ts,tsx}', 'utils/**/*.{ts,tsx}'],
  typePaths: ['src/types/**/*.{ts,tsx}', 'types/**/*.{ts,tsx}'],
  autoWatch: true,
  indexFile: '.structor-index.json'
}
```

### 自定义配置

可以通过 `update_config` 工具更新配置：

```json
{
  "config": {
    "componentPaths": ["src/ui/**/*.{ts,tsx}"],
    "excludePatterns": ["**/test/**", "**/stories/**"],
    "autoWatch": false
  }
}
```

## 优化建议

### 1. 索引结构优化

- **分层索引** - 按功能模块分层组织索引
- **关系图谱** - 建立组件间的依赖关系图谱
- **版本管理** - 支持组件版本管理和变更追踪

### 2. 搜索算法优化

- **向量搜索** - 使用向量嵌入进行语义搜索
- **模糊匹配** - 支持拼写错误和近似匹配
- **上下文感知** - 基于当前代码上下文推荐组件

### 3. 集成增强

- **IDE 插件** - 开发 VS Code/Cursor 插件
- **代码补全** - 智能导入建议和自动补全
- **重构工具** - 检测重复代码并建议使用现有组件

### 4. 性能优化

- **增量更新** - 只更新变更的文件
- **缓存机制** - 缓存搜索结果和组件信息
- **并行处理** - 并行扫描多个目录

### 5. 扩展功能

- **组件文档** - 自动生成组件文档
- **测试建议** - 基于组件属性生成测试用例
- **性能分析** - 分析组件的性能特征
- **安全检查** - 检测潜在的安全问题

## 开发计划

### Phase 1: 基础功能 ✅

- [x] 项目扫描和索引
- [x] 基础搜索功能
- [x] MCP 服务器实现

### Phase 2: 智能增强 🚧

- [ ] AST 解析优化
- [ ] 语义搜索
- [ ] 依赖关系分析

### Phase 3: 集成优化 📋

- [ ] IDE 插件开发
- [ ] 代码补全集成
- [ ] 重构工具

### Phase 4: 高级功能 📋

- [ ] 组件文档生成
- [ ] 性能分析
- [ ] 安全检查

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

ISC License
