import { z } from "zod";

const DependencySchema = z.object({
  name: z.string().describe("依赖名称"),
  version: z.string().describe("依赖版本"),
  description: z.string().describe("依赖描述"),
});

const ScriptSchema = z.object({
  name: z.string().describe("脚本名称"),
  description: z.string().describe("脚本描述"),
  command: z.string().describe("脚本命令"),
});

export const ProjectMetadataSchema = z.object({
  name: z.string().optional().describe("项目名称"),
  description: z.string().optional().describe("项目描述"),
  keywords: z.array(z.string()).optional().describe("项目关键词"),
  dependencies: z.array(DependencySchema).describe("项目依赖"),
  scripts: z.array(ScriptSchema).describe("项目脚本"),
});

// 导出类型定义
export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>;
