import { execa } from "execa";
import { describe, it, expect } from "vitest";
import path from "path";

describe("octolens CLI", () => {
  it("should print project structure", async () => {
    const cliPath = path.resolve(__dirname, "../../cli/dist/index.js");
    const { stdout } = await execa("node", [
      cliPath,
      "--rootPath",
      path.resolve(__dirname, "mock-project"),
      "--no-watch",
    ]);
    expect(stdout).toContain("Scan completed successfully");
  });
});
