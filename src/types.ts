export interface ComponentIndex {
  id: string;
  name: string;
  path: string;
  type: "component" | "hook" | "utility" | "type" | "constant";
  description?: string;
  props?: Record<string, any>;
  dependencies?: string[];
  usage?: string[];
  tags?: string[];
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  exportType: "default" | "named" | "both";
  framework?: "react" | "vue" | "svelte" | "vanilla";
  complexity?: "simple" | "medium" | "complex";
}

export interface IndexConfig {
  rootPath: string;
  includePatterns: string[];
  excludePatterns: string[];
  componentPaths: string[];
  hookPaths: string[];
  utilityPaths: string[];
  typePaths: string[];
  autoWatch: boolean;
  indexFile: string;
}

export interface SearchResult {
  component: ComponentIndex;
  score: number;
  reason: string;
}

export interface IndexStats {
  totalComponents: number;
  totalHooks: number;
  totalUtilities: number;
  totalTypes: number;
  lastUpdated: Date;
  indexedFiles: number;
}
