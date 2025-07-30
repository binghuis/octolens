import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * 读取项目文件
 * @param rootPath 项目根路径，默认为当前工作目录
 * @returns 包含package.json和README信息的对象
 */
export function readProjectFiles(rootPath: string = process.cwd()) {
  const packagePath = join(rootPath, "package.json");
  const readmePath = join(rootPath, "README.md");

  const result = {
    packageJson: null as any,
    readme: null as string | null,
    hasPackageJson: existsSync(packagePath),
    hasReadme: existsSync(readmePath),
  };

  if (result.hasPackageJson) {
    result.packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
  }

  if (result.hasReadme) {
    result.readme = readFileSync(readmePath, "utf-8");
  }

  return result;
}
