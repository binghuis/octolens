import { ComponentIndexer } from "./indexer.js";
import { ConfigManager } from "./config-manager.js";

// === Fastify HTTP 服务集成 ===
import Fastify from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";

export class SimpleMCPServer {
  private indexer: ComponentIndexer;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
    const config = this.configManager.loadConfig();
    this.indexer = new ComponentIndexer(config);
  }

  async handleRequest(method: string, params: any) {
    switch (method) {
      case "scan_project":
        return this.handleScanProject(params);

      case "search_components":
        return this.handleSearchComponents(params);

      case "get_component":
        return this.handleGetComponent(params);

      case "list_components":
        return this.handleListComponents(params);

      case "update_config":
        return this.handleUpdateConfig(params);

      case "show_config":
        return this.handleShowConfig(params);

      case "create_config":
        return this.handleCreateConfig(params);

      default:
        throw new Error(`未知的方法: ${method}`);
    }
  }

  private async handleScanProject(args: any) {
    try {
      await this.indexer.scanProject();
      const components = this.indexer.getAllComponents();

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
    } catch (error) {
      throw new Error(`扫描项目失败: ${error}`);
    }
  }

  private async handleSearchComponents(args: any) {
    const { query, type, limit = 5 } = args;

    if (!query) {
      throw new Error("搜索查询不能为空");
    }

    const results = this.indexer.searchComponents(query, type);
    const limitedResults = results.slice(0, limit);

    let response = `搜索 "${query}" 的结果 (${results.length} 个匹配):\n\n`;

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

  private async handleGetComponent(args: any) {
    const { id } = args;

    if (!id) {
      throw new Error("组件ID不能为空");
    }

    const component = this.indexer.getComponent(id);
    if (!component) {
      throw new Error(`未找到组件: ${id}`);
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

  private async handleListComponents(args: any) {
    const { type, limit = 20 } = args;

    const components = this.indexer.getAllComponents();
    const filteredComponents = type
      ? components.filter((c) => c.type === type)
      : components;
    const limitedComponents = filteredComponents.slice(0, limit);

    let response = `项目中的组件列表 (${filteredComponents.length} 个):\n\n`;

    // 按类型分组
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

  private async handleUpdateConfig(args: any) {
    const { config } = args;

    if (!config) {
      throw new Error("配置不能为空");
    }

    // 更新配置
    const newConfig = this.configManager.updateConfig(config);
    this.indexer = new ComponentIndexer(newConfig);

    return {
      content: [
        {
          type: "text",
          text: "配置已更新，请重新扫描项目以应用新配置。",
        },
      ],
    };
  }

  private async handleShowConfig(args: any) {
    const config = this.configManager.loadConfig();
    const configPath = this.configManager.getConfigPath();

    let response = `**当前配置**\n\n`;
    response += `配置文件路径: \`${configPath}\`\n\n`;
    response += `**组件路径:**\n`;
    config.componentPaths.forEach((path) => {
      response += `- \`${path}\`\n`;
    });
    response += `\n**Hook路径:**\n`;
    config.hookPaths.forEach((path) => {
      response += `- \`${path}\`\n`;
    });
    response += `\n**工具函数路径:**\n`;
    config.utilityPaths.forEach((path) => {
      response += `- \`${path}\`\n`;
    });
    response += `\n**类型定义路径:**\n`;
    config.typePaths.forEach((path) => {
      response += `- \`${path}\`\n`;
    });
    response += `\n**排除模式:**\n`;
    config.excludePatterns.forEach((pattern) => {
      response += `- \`${pattern}\`\n`;
    });

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private async handleCreateConfig(args: any) {
    this.configManager.createDefaultConfig();

    return {
      content: [
        {
          type: "text",
          text: "已创建默认配置文件，请根据需要修改配置。",
        },
      ],
    };
  }
}

// === Fastify HTTP 服务集成 ===
if (require.main === module) {
  const fastify = Fastify({ logger: true });
  const server = new SimpleMCPServer();

  async function handle(
    method: string,
    req: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const result = await server.handleRequest(method, req.body || {});
      reply.send(result);
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  }

  fastify.post("/scan_project", (req, reply) =>
    handle("scan_project", req, reply)
  );
  fastify.post("/search_components", (req, reply) =>
    handle("search_components", req, reply)
  );
  fastify.post("/get_component", (req, reply) =>
    handle("get_component", req, reply)
  );
  fastify.post("/list_components", (req, reply) =>
    handle("list_components", req, reply)
  );
  fastify.post("/update_config", (req, reply) =>
    handle("update_config", req, reply)
  );
  fastify.post("/show_config", (req, reply) =>
    handle("show_config", req, reply)
  );
  fastify.post("/create_config", (req, reply) =>
    handle("create_config", req, reply)
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  fastify.listen({ port, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Structor MCP Tool HTTP 服务已启动: ${address}`);
  });
}
