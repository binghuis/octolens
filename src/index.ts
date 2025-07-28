import Fastify from "fastify";
import cors from "@fastify/cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { ComponentIndexer } from "./indexer";
import { ConfigManager } from "./config-manager";
import { randomUUID } from "crypto";

// 初始化 structor 业务
const configManager = new ConfigManager();
const config = configManager.loadConfig();
let indexer = new ComponentIndexer(config);

// 创建 MCP Server
const server = new McpServer({
  name: "structor-mcp",
  version: "1.0.0",
});

// 注册 MCP Tool: scan_project
server.registerTool(
  "scan_project",
  {
    title: "扫描项目",
    description: "扫描并索引所有组件/工具函数/类型",
    inputSchema: {},
  },
  async () => {
    await indexer.scanProject();
    const components = indexer.getAllComponents();
    return {
      content: [
        {
          type: "text",
          text:
            `项目扫描完成！共找到 ${components.length} 个组件/工具函数。\n\n` +
            `组件: ${
              components.filter((c) => c.type === "component").length
            } 个\n` +
            `Hooks: ${
              components.filter((c) => c.type === "hook").length
            } 个\n` +
            `工具函数: ${
              components.filter((c) => c.type === "utility").length
            } 个\n` +
            `类型定义: ${
              components.filter((c) => c.type === "type").length
            } 个`,
        },
      ],
    };
  }
);

// 注册 MCP Tool: search_components
server.registerTool(
  "search_components",
  {
    title: "搜索组件",
    description: "根据关键词搜索项目组件",
    inputSchema: {
      query: z.string(),
      type: z.string().optional(),
      limit: z.number().optional(),
    },
  },
  async ({
    query,
    type,
    limit,
  }: {
    query: string;
    type?: string;
    limit?: number;
  }) => {
    const validTypes = [
      "type",
      "component",
      "hook",
      "utility",
      "constant",
    ] as const;
    type ComponentType = (typeof validTypes)[number];
    const typeSafe = validTypes.includes(type as ComponentType)
      ? (type as ComponentType)
      : undefined;
    const results = indexer.searchComponents(query, typeSafe);
    const limitedResults = results.slice(0, limit || 5);
    let response = `搜索 \"${query}\" 的结果 (${results.length} 个匹配):\n\n`;
    limitedResults.forEach((result, index) => {
      const comp = result.component;
      response += `${index + 1}. **${comp.name}** (${comp.type})\n`;
      response += `   路径: \`${comp.path}\`\n`;
      response += `   描述: ${comp.description || "无描述"}\n`;
      response += `   匹配度: ${result.score}/20\n`;
      response += `   原因: ${result.reason}\n`;
      if (comp.props && Object.keys(comp.props).length > 0) {
        response += `   Props: ${Object.entries(comp.props)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")}\n`;
      }
      response += "\n";
    });
    return {
      content: [{ type: "text", text: response }],
    };
  }
);

// 注册 MCP Tool: get_component
server.registerTool(
  "get_component",
  {
    title: "组件详情",
    description: "获取指定组件的详细信息",
    inputSchema: {
      id: z.string(),
    },
  },
  async ({ id }) => {
    const component = indexer.getComponent(id);
    if (!component) {
      return {
        content: [{ type: "text", text: `未找到组件: ${id}` }],
      };
    }
    let response = `**${component.name}** (${component.type})\n\n`;
    response += `路径: \`${component.path}\`\n`;
    response += `框架: ${component.framework || "未知"}\n`;
    response += `复杂度: ${component.complexity || "未知"}\n`;
    response += `导出类型: ${component.exportType}\n`;
    response += `创建时间: ${component.createdAt.toLocaleString()}\n`;
    response += `更新时间: ${component.updatedAt.toLocaleString()}\n\n`;
    if (component.description) {
      response += `**描述:**\n${component.description}\n\n`;
    }
    if (component.props && Object.keys(component.props).length > 0) {
      response += `**Props:**\n`;
      Object.entries(component.props).forEach(([name, type]) => {
        response += `- \`${name}\`: ${type}\n`;
      });
      response += "\n";
    }
    if (component.dependencies && component.dependencies.length > 0) {
      response += `**依赖:**\n`;
      component.dependencies.forEach((dep) => {
        response += `- \`${dep}\`\n`;
      });
      response += "\n";
    }
    if (component.tags && component.tags.length > 0) {
      response += `**标签:** ${component.tags.join(", ")}\n`;
    }
    return {
      content: [{ type: "text", text: response }],
    };
  }
);

// 注册 MCP Tool: list_components
server.registerTool(
  "list_components",
  {
    title: "组件列表",
    description: "列出所有组件/工具/类型",
    inputSchema: {
      type: z.string().optional(),
      limit: z.number().optional(),
    },
  },
  async ({ type, limit }) => {
    const components = indexer.getAllComponents();
    const filteredComponents = type
      ? components.filter((c) => c.type === type)
      : components;
    const limitedComponents = filteredComponents.slice(0, limit || 20);
    let response = `项目中的组件列表 (${filteredComponents.length} 个):\n\n`;
    const grouped = limitedComponents.reduce((acc, comp) => {
      if (!acc[comp.type]) acc[comp.type] = [];
      acc[comp.type].push(comp);
      return acc;
    }, {} as Record<string, any[]>);
    Object.entries(grouped).forEach(([type, comps]) => {
      response += `**${type}** (${comps.length} 个):\n`;
      comps.forEach((comp) => {
        response += `- \`${comp.name}\` - ${comp.description || "无描述"} (${
          comp.path
        })\n`;
      });
      response += "\n";
    });
    return {
      content: [{ type: "text", text: response }],
    };
  }
);

// 注册 MCP Tool: update_config
server.registerTool(
  "update_config",
  {
    title: "更新配置",
    description: "更新 structor 索引配置",
    inputSchema: {
      config: z.any(),
    },
  },
  async ({ config }) => {
    const newConfig = configManager.updateConfig(config);
    indexer = new ComponentIndexer(newConfig);
    return {
      content: [
        {
          type: "text",
          text: "配置已更新，请重新扫描项目以应用新配置。",
        },
      ],
    };
  }
);

// Fastify HTTP 服务
const fastify = Fastify({ logger: true });
await fastify.register(cors, {
  origin: true,
  exposedHeaders: ["Mcp-Session-Id"],
  allowedHeaders: ["Content-Type", "mcp-session-id"],
});

fastify.post("/mcp", async (request, reply) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await server.connect(transport);
  await transport.handleRequest(request.raw, reply.raw, request.body);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(
    `Structor MCP Tool (MCP SDK) Fastify 服务已启动: ${address}/mcp`
  );
});
