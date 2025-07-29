import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/tests/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    globals: true,
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
