# Structor 索引文件格式说明

## 📁 索引文件概述

Structor 生成的索引文件是 JSON 格式，包含项目中所有组件、Hooks、工具函数的详细信息。索引文件默认保存为 `.structor-index.json`。

## 🔧 索引文件结构

### **根结构**

```json
[
  {
    // 组件/Hook/工具函数条目
  },
  {
    // 更多条目...
  }
]
```

### **单个条目结构**

```json
{
  "id": "unique_identifier",
  "name": "组件名称",
  "path": "文件路径",
  "type": "类型",
  "description": "描述信息",
  "props": {},
  "dependencies": [],
  "exportType": "导出类型",
  "framework": "框架",
  "complexity": "复杂度",
  "createdAt": "创建时间",
  "updatedAt": "更新时间",
  "tags": [],
  "usage": []
}
```

## 📊 字段详解

### **基础信息**

| 字段   | 类型   | 说明          | 示例                                           |
| ------ | ------ | ------------- | ---------------------------------------------- |
| `id`   | string | 唯一标识符    | `"component_Button_1753674312234"`             |
| `name` | string | 组件/函数名称 | `"Button"`, `"useCounter"`                     |
| `path` | string | 文件相对路径  | `"src/components/Button.tsx"`                  |
| `type` | string | 类型分类      | `"component"`, `"hook"`, `"utility"`, `"type"` |

### **描述信息**

| 字段          | 类型     | 说明             | 示例                                 |
| ------------- | -------- | ---------------- | ------------------------------------ |
| `description` | string   | JSDoc 注释或描述 | `"主要按钮组件，支持多种尺寸"`       |
| `tags`        | string[] | 提取的标签       | `["param", "returns", "deprecated"]` |

### **技术信息**

| 字段           | 类型     | 说明       | 示例                                      |
| -------------- | -------- | ---------- | ----------------------------------------- |
| `props`        | object   | 属性定义   | `{"variant": "string", "size": "string"}` |
| `dependencies` | string[] | 依赖模块   | `["react", "@/utils/classNames"]`         |
| `exportType`   | string   | 导出类型   | `"default"`, `"named"`, `"both"`          |
| `framework`    | string   | 框架类型   | `"react"`, `"vue"`, `"vanilla"`           |
| `complexity`   | string   | 复杂度等级 | `"simple"`, `"medium"`, `"complex"`       |

### **时间信息**

| 字段        | 类型   | 说明     | 示例                         |
| ----------- | ------ | -------- | ---------------------------- |
| `createdAt` | string | 创建时间 | `"2025-07-28T03:45:12.234Z"` |
| `updatedAt` | string | 更新时间 | `"2025-07-28T03:45:12.234Z"` |

### **使用统计**

| 字段    | 类型     | 说明     | 示例                                                  |
| ------- | -------- | -------- | ----------------------------------------------------- |
| `usage` | string[] | 使用记录 | `["src/pages/Home.tsx", "src/components/Header.tsx"]` |

## 🎯 实际示例

### **React 组件示例**

```json
{
  "id": "component_Button_1753674312234",
  "name": "Button",
  "path": "src/components/Button.tsx",
  "type": "component",
  "description": "主要按钮组件\n支持多种尺寸和状态",
  "props": {
    "variant": "'primary' | 'secondary' | 'outline'",
    "size": "'sm' | 'md' | 'lg'",
    "disabled": "boolean",
    "onClick": "(event: React.MouseEvent) => void",
    "children": "React.ReactNode"
  },
  "dependencies": ["react"],
  "exportType": "both",
  "framework": "react",
  "complexity": "medium",
  "createdAt": "2025-07-28T03:45:12.234Z",
  "updatedAt": "2025-07-28T03:45:12.234Z",
  "tags": ["@param", "@returns"],
  "usage": []
}
```

### **自定义 Hook 示例**

```json
{
  "id": "hook_useCounter_1753674312237",
  "name": "useCounter",
  "path": "src/hooks/useCounter.ts",
  "type": "hook",
  "description": "计数器Hook\n提供基本的计数功能",
  "props": {
    "initialValue": "number",
    "min": "number",
    "max": "number",
    "step": "number"
  },
  "dependencies": ["react"],
  "exportType": "named",
  "framework": "react",
  "complexity": "medium",
  "createdAt": "2025-07-28T03:45:12.237Z",
  "updatedAt": "2025-07-28T03:45:12.237Z",
  "tags": ["@param", "@returns"],
  "usage": []
}
```

### **工具函数示例**

```json
{
  "id": "utility_formatDate_1753674312238",
  "name": "formatDate",
  "path": "src/utils/formatDate.ts",
  "type": "utility",
  "description": "日期格式化工具函数\n提供多种日期格式化选项",
  "props": {
    "date": "Date | string",
    "options": "DateFormatOptions"
  },
  "dependencies": [],
  "exportType": "named",
  "framework": "vanilla",
  "complexity": "medium",
  "createdAt": "2025-07-28T03:45:12.238Z",
  "updatedAt": "2025-07-28T03:45:12.238Z",
  "tags": ["@param", "@returns"],
  "usage": []
}
```

## 🔍 类型分类说明

### **component**

- React/Vue/Svelte 组件
- UI 组件、页面组件
- 包含 JSX/TSX 的文件

### **hook**

- React Hooks (useState, useEffect 等)
- Vue Composables
- 自定义状态管理函数

### **utility**

- 工具函数、辅助函数
- 数据处理函数
- 格式化、验证函数

### **type**

- TypeScript 类型定义
- 接口定义
- 类型别名

## 📈 索引文件用途

### **1. 搜索和发现**

- 基于名称、描述、标签搜索
- 按类型过滤组件
- 相似度匹配

### **2. 代码生成**

- 提供现有组件信息
- 避免重复创建
- 保持项目一致性

### **3. 依赖分析**

- 分析组件间依赖关系
- 识别未使用的组件
- 优化导入结构

### **4. 文档生成**

- 自动生成组件文档
- API 文档
- 使用示例

## 🛠️ 索引文件管理

### **查看索引内容**

```bash
# 查看所有组件
node dist/index.js list_components

# 查看特定类型
node dist/index.js list_components '{"type": "component"}'

# 搜索组件
node dist/index.js search_components '{"query": "button"}'
```

### **更新索引**

```bash
# 重新扫描项目
node dist/index.js scan_project

# 更新配置后重新扫描
node dist/index.js update_config '{"componentPaths": ["src/ui/**/*.{ts,tsx}"]}'
node dist/index.js scan_project
```

### **索引文件位置**

- 默认位置：`.structor-index.json`
- 可通过配置修改：`indexFile` 选项
- 支持相对路径和绝对路径

## 💡 最佳实践

### **1. 版本控制**

- 将索引文件加入 `.gitignore`
- 索引文件是自动生成的，不需要手动编辑
- 每次扫描都会重新生成

### **2. 性能优化**

- 定期清理索引文件
- 避免扫描不必要的文件
- 使用合适的排除模式

### **3. 团队协作**

- 统一配置文件的路径模式
- 保持组件命名规范
- 添加清晰的 JSDoc 注释

## 🔧 自定义索引格式

如果需要自定义索引格式，可以修改 `src/indexer.ts` 中的 `analyzeFile` 方法：

```typescript
private async analyzeFile(filePath: string, type: ComponentIndex['type']): Promise<void> {
  // 自定义分析逻辑
  const component: ComponentIndex = {
    // 自定义字段
    customField: 'customValue',
    // ... 其他字段
  };
}
```
