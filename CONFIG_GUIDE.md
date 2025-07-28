# Structor 配置指南

## 📁 配置方式

### 1. **手动配置文件（推荐）**

#### **项目级配置**

在项目根目录创建 `structor.config.json`：

```json
{
  "rootPath": ".",
  "componentPaths": [
    "src/components/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "src/ui/**/*.{ts,tsx}"
  ],
  "hookPaths": ["src/hooks/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}"],
  "utilityPaths": [
    "src/utils/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}"
  ],
  "typePaths": ["src/types/**/*.{ts,tsx}", "types/**/*.{ts,tsx}"],
  "excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/test/**",
    "**/stories/**"
  ],
  "autoWatch": true
}
```

#### **全局配置**

在 `~/.cursor/settings.json` 中配置：

```json
{
  "mcpServers": {
    "structor": {
      "command": "node",
      "args": ["/path/to/structor/dist/index.js"],
      "env": {
        "STRUCTOR_CONFIG_PATH": "/path/to/global/config.json"
      }
    }
  }
}
```

### 2. **环境变量配置**

```bash
# 设置配置文件路径
export STRUCTOR_CONFIG_PATH="/path/to/config.json"

# 设置项目根目录
export STRUCTOR_ROOT_PATH="/path/to/project"
```

### 3. **动态配置（通过工具调用）**

```bash
# 更新组件路径
node dist/index.js update_config '{"componentPaths": ["src/ui/**/*.{ts,tsx}"]}'

# 添加排除模式
node dist/index.js update_config '{"excludePatterns": ["**/test/**", "**/stories/**"]}'

# 禁用自动监听
node dist/index.js update_config '{"autoWatch": false}'
```

## 🔧 配置选项详解

### **基础配置**

| 选项              | 类型     | 默认值                                 | 说明           |
| ----------------- | -------- | -------------------------------------- | -------------- |
| `rootPath`        | string   | `process.cwd()`                        | 项目根目录     |
| `includePatterns` | string[] | `["**/*.{ts,tsx,js,jsx}"]`             | 包含的文件模式 |
| `excludePatterns` | string[] | `["**/node_modules/**", "**/dist/**"]` | 排除的文件模式 |

### **路径配置**

| 选项             | 类型     | 默认值                             | 说明          |
| ---------------- | -------- | ---------------------------------- | ------------- |
| `componentPaths` | string[] | `["src/components/**/*.{ts,tsx}"]` | 组件文件路径  |
| `hookPaths`      | string[] | `["src/hooks/**/*.{ts,tsx}"]`      | Hook 文件路径 |
| `utilityPaths`   | string[] | `["src/utils/**/*.{ts,tsx}"]`      | 工具函数路径  |
| `typePaths`      | string[] | `["src/types/**/*.{ts,tsx}"]`      | 类型定义路径  |

### **功能配置**

| 选项        | 类型    | 默认值                 | 说明                 |
| ----------- | ------- | ---------------------- | -------------------- |
| `autoWatch` | boolean | `true`                 | 是否自动监听文件变化 |
| `indexFile` | string  | `.structor-index.json` | 索引文件路径         |

## 📂 配置文件优先级

1. **环境变量指定路径** - `STRUCTOR_CONFIG_PATH`
2. **项目根目录** - `structor.config.json`
3. **隐藏配置文件** - `.structor.json`
4. **配置目录** - `config/structor.json`
5. **Cursor 配置** - `.cursor/structor.json`
6. **默认配置** - 内置默认值

## 🎯 常见项目结构配置

### **React 项目**

```json
{
  "componentPaths": [
    "src/components/**/*.{ts,tsx}",
    "src/pages/**/*.{ts,tsx}",
    "src/features/**/components/**/*.{ts,tsx}"
  ],
  "hookPaths": [
    "src/hooks/**/*.{ts,tsx}",
    "src/features/**/hooks/**/*.{ts,tsx}"
  ],
  "utilityPaths": ["src/utils/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"]
}
```

### **Vue 项目**

```json
{
  "componentPaths": ["src/components/**/*.{vue,ts}", "src/views/**/*.{vue,ts}"],
  "hookPaths": ["src/composables/**/*.{ts,js}"],
  "utilityPaths": ["src/utils/**/*.{ts,js}", "src/helpers/**/*.{ts,js}"]
}
```

### **Next.js 项目**

```json
{
  "componentPaths": [
    "components/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
    "app/**/components/**/*.{ts,tsx}"
  ],
  "hookPaths": ["hooks/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
  "excludePatterns": ["**/node_modules/**", "**/.next/**", "**/out/**"]
}
```

## 🛠️ 配置管理命令

### **查看当前配置**

```bash
node dist/index.js show_config
```

### **创建默认配置**

```bash
node dist/index.js create_config
```

### **更新配置**

```bash
# 更新组件路径
node dist/index.js update_config '{"componentPaths": ["src/ui/**/*.{ts,tsx}"]}'

# 添加排除模式
node dist/index.js update_config '{"excludePatterns": ["**/test/**"]}'

# 批量更新
node dist/index.js update_config '{
  "componentPaths": ["src/ui/**/*.{ts,tsx}"],
  "excludePatterns": ["**/test/**", "**/stories/**"],
  "autoWatch": false
}'
```

## 💡 最佳实践

### **1. 项目级配置**

- 将配置文件放在项目根目录
- 使用相对路径
- 版本控制配置文件

### **2. 路径模式**

- 使用 `**/*.{ts,tsx}` 匹配所有子目录
- 明确指定文件扩展名
- 避免过于宽泛的模式

### **3. 排除规则**

- 排除 `node_modules` 和构建目录
- 排除测试文件和文档
- 排除临时文件和缓存

### **4. 性能优化**

- 合理设置 `autoWatch`
- 避免扫描不必要的目录
- 定期清理索引文件

## 🔍 故障排除

### **配置文件不生效**

1. 检查配置文件路径是否正确
2. 验证 JSON 格式是否正确
3. 确认文件权限

### **扫描结果为空**

1. 检查路径模式是否正确
2. 确认文件扩展名匹配
3. 查看排除规则是否过于严格

### **性能问题**

1. 减少扫描的文件数量
2. 优化路径模式
3. 禁用不必要的功能
