import { BaseAIProvider } from "../plugins/base.js";
import type { ProjectNode, NodeMetadata, AIConfig } from "../types/index.js";

export class LocalAIProvider extends BaseAIProvider {
  name = "local-ai";
  version = "1.0.0";
  private model = "llama3.2:3b"; // 默认使用较小的模型
  private baseUrl = "http://localhost:11434";

  constructor(config?: AIConfig) {
    super();
    if (config?.model) this.model = config.model;
    if (config?.baseUrl) this.baseUrl = config.baseUrl;
  }

  /**
   * 分析项目结构
   */
  async analyze(structure: ProjectNode): Promise<ProjectNode> {
    this.log("开始分析项目结构...");

    try {
      // 分析根节点
      const analyzedStructure = await this.analyzeNode(structure);
      this.log("项目结构分析完成");
      return analyzedStructure;
    } catch (error) {
      this.error("项目结构分析失败", error);
      return structure;
    }
  }

  /**
   * 过滤有价值的节点
   */
  async filter(nodes: ProjectNode[]): Promise<ProjectNode[]> {
    this.log("开始过滤节点...");

    try {
      const valuableNodes: ProjectNode[] = [];

      for (const node of nodes) {
        const isValuable = await this.assessNodeValue(node);
        if (isValuable) {
          valuableNodes.push(node);
        }
      }

      this.log(`过滤完成，保留 ${valuableNodes.length}/${nodes.length} 个节点`);
      return valuableNodes;
    } catch (error) {
      this.error("节点过滤失败", error);
      return nodes;
    }
  }

  /**
   * 为节点添加智能标注
   */
  async annotate(node: ProjectNode): Promise<NodeMetadata> {
    this.log(`为节点 ${node.name} 添加标注...`);

    try {
      const metadata: NodeMetadata = {
        description: await this.generateDescription(node),
        category: (await this.categorizeNode(node)) as NodeMetadata["category"],
        tags: await this.generateTags(node),
        importance: await this.assessImportance(node),
        framework: await this.detectFramework(node),
      };

      this.log(`节点 ${node.name} 标注完成`);
      return metadata;
    } catch (error) {
      this.error(`节点 ${node.name} 标注失败`, error);
      return {};
    }
  }

  /**
   * 分析单个节点
   */
  private async analyzeNode(node: ProjectNode): Promise<ProjectNode> {
    // 为当前节点添加标注
    if (node.type === "file") {
      node.metadata = await this.annotate(node);
    }

    // 递归分析子节点
    if (node.children) {
      for (const child of node.children) {
        await this.analyzeNode(child);
      }
    }

    return node;
  }

  /**
   * 评估节点价值
   */
  private async assessNodeValue(node: ProjectNode): Promise<boolean> {
    if (node.type === "directory") {
      // 目录的价值评估
      const prompt = `评估以下目录对 AI 编程的价值：
目录名: ${node.name}
路径: ${node.path}
子文件数: ${node.children?.length || 0}

请回答 "valuable" 或 "not-valuable"`;

      const response = await this.callLocalAI(prompt);
      return response.toLowerCase().includes("valuable");
    } else {
      // 文件的价值评估
      const prompt = `评估以下文件对 AI 编程的价值：
文件名: ${node.name}
路径: ${node.path}
扩展名: ${node.name.split(".").pop()}

请回答 "valuable" 或 "not-valuable"`;

      const response = await this.callLocalAI(prompt);
      return response.toLowerCase().includes("valuable");
    }
  }

  /**
   * 生成节点描述
   */
  private async generateDescription(node: ProjectNode): Promise<string> {
    const prompt = `为以下文件生成简短描述（1-2句话）：
文件名: ${node.name}
路径: ${node.path}
类型: ${node.type}

描述：`;

    try {
      const response = await this.callLocalAI(prompt);
      return response.trim();
    } catch (error) {
      return `文件: ${node.name}`;
    }
  }

  /**
   * 分类节点
   */
  private async categorizeNode(node: ProjectNode): Promise<string> {
    const prompt = `将以下文件分类为以下类型之一：
component, page, api, utility, hook, type, style, config, documentation, test, other

文件名: ${node.name}
路径: ${node.path}

分类：`;

    try {
      const response = await this.callLocalAI(prompt);
      const category = response.trim().toLowerCase();

      // 验证分类是否有效
      const validCategories = [
        "component",
        "page",
        "api",
        "utility",
        "hook",
        "type",
        "style",
        "config",
        "documentation",
        "test",
        "other",
      ];
      return validCategories.includes(category) ? category : "other";
    } catch (error) {
      return "other";
    }
  }

  /**
   * 生成标签
   */
  private async generateTags(node: ProjectNode): Promise<string[]> {
    const prompt = `为以下文件生成标签（用逗号分隔）：
文件名: ${node.name}
路径: ${node.path}
类型: ${node.type}

标签：`;

    try {
      const response = await this.callLocalAI(prompt);
      return response
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * 评估重要性
   */
  private async assessImportance(
    node: ProjectNode
  ): Promise<"high" | "medium" | "low"> {
    const prompt = `评估以下文件的重要性：
文件名: ${node.name}
路径: ${node.path}
类型: ${node.type}

请回答 "high", "medium" 或 "low"`;

    try {
      const response = await this.callLocalAI(prompt);
      const importance = response.trim().toLowerCase();

      if (
        importance === "high" ||
        importance === "medium" ||
        importance === "low"
      ) {
        return importance;
      }
      return "medium";
    } catch (error) {
      return "medium";
    }
  }

  /**
   * 检测框架
   */
  private async detectFramework(node: ProjectNode): Promise<string> {
    const prompt = `检测以下文件使用的框架：
文件名: ${node.name}
路径: ${node.path}

请回答：react, vue, angular, nextjs, vite, webpack, 或其他框架名称`;

    try {
      const response = await this.callLocalAI(prompt);
      return response.trim().toLowerCase();
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * 调用本地 AI API
   */
  private async callLocalAI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`本地 AI API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.response || "";
    } catch (error) {
      this.error("本地 AI API 调用失败", error);
      throw error;
    }
  }

  /**
   * 检查本地 AI 服务是否可用
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      this.error("本地 AI 服务不可用", error);
      return false;
    }
  }
}
