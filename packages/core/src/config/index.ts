import { z } from "zod";
import type { ScanConfig, AIConfig } from "../types";

// 配置验证 Schema
export const ConfigSchema = z.object({
  rootPath: z.string().min(1, "项目路径不能为空"),
  maxDepth: z.number().min(1).max(10).default(5),
  enableAI: z.boolean().default(true),
  ignorePatterns: z
    .array(z.string())
    .default([
      "node_modules",
      ".git",
      ".turbo",
      "dist",
      "build",
      ".next",
      ".cache",
      "coverage",
      "*.log",
    ]),
  aiConfig: z
    .object({
      provider: z.string().default("ollama"),
      model: z.string().default("llama3.2"),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
    })
    .optional(),
  enableWatch: z.boolean().default(false),
});

export type ValidatedConfig = z.infer<typeof ConfigSchema>;

// 默认配置
export const DEFAULT_CONFIG: ScanConfig = {
  rootPath: process.cwd(),
  maxDepth: 5,
  enableAI: true,
  ignorePatterns: [
    "node_modules",
    ".git",
    ".turbo",
    "dist",
    "build",
    ".next",
    ".cache",
    "coverage",
    "*.log",
  ],
  aiConfig: {
    provider: "ollama",
    model: "llama3.2",
    baseUrl: "http://localhost:11434",
  },
  enableWatch: false,
};

// 配置验证函数
export function validateConfig(config: Partial<ScanConfig>): ValidatedConfig {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  return ConfigSchema.parse(mergedConfig);
}

// 获取配置
export function getConfig(overrides?: Partial<ScanConfig>): ValidatedConfig {
  return validateConfig(overrides || {});
}
