import pino, { type Logger } from "pino";

/**
 * 创建 Pino Logger 实例
 */
export const logger: Logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname", // 简洁输出
      translateTime: "SYS:standard",
    },
  },
});

// 导出 pino Logger 类型
export type { Logger };
