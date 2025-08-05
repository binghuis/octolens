import z from "zod";

export const FileAnalysisResultSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum([
    "component",
    "page",
    "hook",
    "utility",
    "style",
    "asset",
    "other",
  ]),
  description: z.string(),
  dependencies: z.array(z.string()),
  props: z.array(z.string()).optional(),
  exports: z.array(z.string()).optional(),
  imports: z.array(z.string()).optional(),
  size: z.number().optional(),
  extension: z.string().optional(),
});

export type FileAnalysisResult = z.infer<typeof FileAnalysisResultSchema>;
