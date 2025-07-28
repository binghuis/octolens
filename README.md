# structor MCP Tool

structor 是一个面向团队协作的组件/工具函数索引与搜索服务，专为 Cursor 编辑器 MCP Tool 生态设计。

## 主要特性

- 远程部署，团队成员零配置接入
- 标准 HTTP API，100% 兼容 Cursor MCP Tool 规范
- 支持组件、Hook、工具函数、类型的自动索引与搜索
- 灵活配置（structor.config.json）

## 快速部署

### 1. 安装依赖

```bash
pnpm install
# 或 npm install
```

### 2. 配置 structor.config.json

- 编辑根目录下的 structor.config.json，配置你的组件、hook、工具函数等路径。

### 3. 启动 MCP Tool 服务

```bash
pnpm start
# 或 node src/index.ts
```

- 默认监听 3000 端口，可通过 `PORT=xxxx` 环境变量自定义端口。

### 4. （可选）后台守护

推荐用 pm2、systemd、docker 等方式让服务常驻。

## Cursor 集成

1. 打开 Cursor 设置（Settings）
2. 搜索 MCP Tool 或 mcpServers
3. 添加 structor MCP Tool 服务地址，例如：
   ```
   http://your-server-ip:3000
   ```
4. 保存设置，所有成员即可统一使用 structor 的组件索引和搜索能力。

## 典型接口

- POST /scan_project
- POST /search_components
- POST /get_component
- POST /list_components
- POST /update_config

## 配置变更

- 修改 structor.config.json 后，重启服务即可生效。
- 也可通过 /update_config 动态更新配置。

## 目录结构

```
structor/
  src/
    simple-mcp-server.ts   # MCP Tool HTTP 服务入口
    indexer.ts             # 组件/工具索引核心
    config-manager.ts      # 配置管理
    types.ts               # 类型定义
  structor.config.json     # 索引配置文件
  package.json
  README.md
  tsconfig.json
```

## 远程部署建议

- 推荐部署在公司内网或云服务器
- 结合 pm2/systemd/docker 实现自动重启和监控
- 端口需对团队成员开放

---

如需多项目支持、自动化脚本或高级用法，欢迎提 issue！
