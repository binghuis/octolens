import { OctoLens } from "../src/index";
import { describe, it, expect } from "vitest";
import path from "path";

describe("OctoLens core integration", () => {
  it("should scan a mock project and return structure", async () => {
    const rootPath = path.resolve(__dirname, "mock-project");
    const octolens = new OctoLens({
      rootPath,
      ignorePatterns: [],
      maxDepth: 5,
      enableAI: false,
    });
    await octolens.start();
    const result = octolens.getScanResult();
    expect(result).toBeDefined();
    expect(result?.projectStructure).toBeDefined();
  });
});
