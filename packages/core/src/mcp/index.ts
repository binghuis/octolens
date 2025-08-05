import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type ListToolsRequest,
  type CallToolRequest,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import type { ScanResult, ScanConfig } from "../types";
import { OctoLensScanner } from "../scanner";
import { logger } from "../utils/logger";

// MCP 工具定义
export interface OctoLensTool extends Tool {
  name: string;
  description: string;
  inputSchema: any;
}

// MCP 服务器实现
export class OctoLensMCPServer {
  private server: Server;
  private scanner: OctoLensScanner;
  private isWatching = false;

  constructor() {
    this.scanner = new OctoLensScanner();
    this.server = new Server(
      {
        name: "octolens-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // 工具列表
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "scan_project",
            description: "扫描和分析项目结构",
            inputSchema: {
              type: "object",
              properties: {
                rootPath: { type: "string" },
                maxDepth: { type: "number" },
                enableAI: { type: "boolean" },
                ignorePatterns: { type: "array", items: { type: "string" } },
              },
              required: ["rootPath"],
            },
          },
          {
            name: "analyze_file",
            description: "分析单个文件",
            inputSchema: {
              type: "object",
              properties: {
                filePath: { type: "string" },
              },
              required: ["filePath"],
            },
          },
          {
            name: "get_project_structure",
            description: "获取项目结构",
            inputSchema: {
              type: "object",
              properties: {
                rootPath: { type: "string" },
              },
              required: ["rootPath"],
            },
          },
        ],
      };
    });

    // 调用工具
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case "scan_project":
              return await this.handleScanProject(args);
            case "analyze_file":
              return await this.handleAnalyzeFile(args);
            case "get_project_structure":
              return await this.handleGetProjectStructure(args);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          logger.error(`Tool execution failed: ${name}`, error);
          throw error;
        }
      }
    );
  }

  private async handleScanProject(args: any) {
    const config: ScanConfig = {
      rootPath: args.rootPath,
      maxDepth: args.maxDepth || 10,
      enableAI: args.enableAI || false,
      ignorePatterns: args.ignorePatterns || [],
    };

    const result = await this.scanner.scanProject(config);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleAnalyzeFile(args: any) {
    const { filePath } = args;

    // TODO: 实现文件分析逻辑
    const analysis = {
      path: filePath,
      type: "unknown",
      size: 0,
      analysis: "File analysis not implemented yet",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  private async handleGetProjectStructure(args: any) {
    const { rootPath } = args;

    // TODO: 实现项目结构获取逻辑
    const structure = {
      root: rootPath,
      files: [],
      directories: [],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info("OctoLens MCP Server started");
  }

  async stop(): Promise<void> {
    await this.server.close();
    logger.info("OctoLens MCP Server stopped");
  }
}

// MCP 客户端实现
export class OctoLensMCPClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor() {
    this.client = new Client({
      name: "octolens-client",
      version: "1.0.0",
    });
    this.transport = new StdioClientTransport({
      command: "node",
      args: [process.argv[1]],
    });
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
    logger.info("OctoLens MCP Client connected");
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    logger.info("OctoLens MCP Client disconnected");
  }

  async callTool(name: string, args: any): Promise<any> {
    const result = await this.client.callTool({
      name,
      arguments: args,
    });
    return result;
  }

  async listTools(): Promise<Tool[]> {
    const result = await this.client.listTools({});
    return result.tools;
  }
}

// 便捷函数
export async function createMCPServer(): Promise<OctoLensMCPServer> {
  const server = new OctoLensMCPServer();
  await server.start();
  return server;
}

export async function createMCPClient(): Promise<OctoLensMCPClient> {
  const client = new OctoLensMCPClient();
  await client.connect();
  return client;
}
