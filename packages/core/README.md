# @octolens/core

[![npm version](https://badge.fury.io/js/%40octolens%2Fcore.svg)](https://badge.fury.io/js/%40octolens%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

A powerful and extensible project analysis tool that provides intelligent insights into codebases using AI-powered analysis.

## Features

- 🔍 **Smart Project Scanning**: Efficiently analyze project structure and dependencies
- 🤖 **AI-Powered Analysis**: Get intelligent insights about your codebase
- 🔌 **Plugin System**: Extensible architecture for custom analysis
- 📊 **Performance Tracking**: Monitor analysis performance and optimize
- 🎯 **Type Safety**: Full TypeScript support with comprehensive types
- ⚡ **High Performance**: Optimized for large codebases

## Installation

```bash
npm install @octolens/core
```

## Quick Start

```typescript
import { OctoLensScanner } from "@octolens/core";

const scanner = new OctoLensScanner({
  rootPath: "./my-project",
  maxDepth: 10,
  enableAI: true,
  ignorePatterns: ["node_modules", "dist"],
});

const result = await scanner.scan();
console.log("Analysis complete:", result);
```

## API Reference

### OctoLensScanner

The main scanner class for project analysis.

#### Constructor

```typescript
new OctoLensScanner(config: ScanConfig)
```

#### Configuration

```typescript
interface ScanConfig {
  rootPath: string; // Project root directory
  maxDepth: number; // Maximum directory depth
  enableAI: boolean; // Enable AI analysis
  ignorePatterns: string[]; // Patterns to ignore
  aiConfig?: AIConfig; // AI provider configuration
  enableWatch?: boolean; // Enable file watching
}
```

#### Methods

- `scan()`: Perform project analysis
- `getStatus()`: Get current scanner status
- `getProgress()`: Get analysis progress
- `stop()`: Stop ongoing analysis
- `reset()`: Reset scanner state

### Plugin System

Create custom analysis plugins:

```typescript
import { Plugin } from "@octolens/core";

class MyPlugin implements Plugin {
  name = "my-plugin";
  version = "1.0.0";
  description = "Custom analysis plugin";
  priority = 1;

  canHandle(path: string): boolean {
    return path.endsWith(".myext");
  }

  async analyzeFile(path: string, content: string) {
    // Custom analysis logic
    return {
      /* analysis result */
    };
  }
}

// Register plugin
import { pluginManager } from "@octolens/core";
pluginManager.register(new MyPlugin());
```

## Configuration

### Basic Configuration

```typescript
const config = {
  rootPath: "./my-project",
  maxDepth: 10,
  enableAI: true,
  ignorePatterns: ["node_modules", "dist", ".git"],
};
```

### AI Configuration

```typescript
const config = {
  // ... basic config
  aiConfig: {
    provider: "deepseek",
    model: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
    temperature: 0.1,
  },
};
```

## Examples

### Basic Project Analysis

```typescript
import { OctoLensScanner } from "@octolens/core";

const scanner = new OctoLensScanner({
  rootPath: "./my-project",
  maxDepth: 5,
  enableAI: false,
});

const result = await scanner.scan();
console.log(
  `Found ${result.fileCount} files in ${result.directoryCount} directories`
);
```

### AI-Powered Analysis

```typescript
import { OctoLensScanner } from "@octolens/core";

const scanner = new OctoLensScanner({
  rootPath: "./my-project",
  maxDepth: 10,
  enableAI: true,
  aiConfig: {
    provider: "deepseek",
    model: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
});

const result = await scanner.scan();
console.log(
  "AI Analysis:",
  result.files.map((f) => f.aiAnalysis)
);
```

### Custom Plugin

```typescript
import { Plugin, pluginManager } from "@octolens/core";

class ReactPlugin implements Plugin {
  name = "react-analyzer";
  version = "1.0.0";
  description = "React-specific analysis";
  priority = 2;

  canHandle(path: string): boolean {
    return path.endsWith(".jsx") || path.endsWith(".tsx");
  }

  async analyzeFile(path: string, content: string) {
    const hooks = (content.match(/use[A-Z][a-zA-Z]*/g) || []).length;
    const components = (content.match(/function\s+[A-Z][a-zA-Z]*/g) || [])
      .length;

    return {
      path,
      hooks,
      components,
      summary: `Contains ${hooks} hooks and ${components} components`,
    };
  }
}

pluginManager.register(new ReactPlugin());
```

## Architecture

The library follows a modular architecture:

- **Scanner**: Core analysis engine
- **Plugins**: Extensible analysis system
- **AI**: AI-powered insights
- **Utils**: Utility functions and helpers
- **Types**: Comprehensive TypeScript definitions

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture information.

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/octolens/structor.git

# Install dependencies
pnpm install

# Build the core package
pnpm build

# Run tests
pnpm test
```

### Code Style

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add comprehensive tests
- Update documentation for new features

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

- 📖 [Documentation](https://octolens.dev)
- 🐛 [Issue Tracker](https://github.com/octolens/structor/issues)
- 💬 [Discussions](https://github.com/octolens/structor/discussions)
- 📧 [Email Support](mailto:support@octolens.dev)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and changes.
