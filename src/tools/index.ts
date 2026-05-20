import type { ToolDef } from "../types.js";
import { encodingTools } from "./encoding.js";
import { hashingTools } from "./hashing.js";
import { identifierTools } from "./identifiers.js";
import { formatTools } from "./format.js";
import { textTools } from "./text.js";
import { generatorTools } from "./generators.js";
import { regexTools } from "./regex.js";
import { colorTools } from "./color.js";
import { timeTools } from "./time.js";
import { llmTools } from "./llm.js";

/**
 * Master tool registry. Adding a new tool: implement it in a category file
 * (or create a new one), export it from that file's array, then add the
 * array to the spread below.
 */
export const allTools: ToolDef[] = [
  ...encodingTools,
  ...hashingTools,
  ...identifierTools,
  ...formatTools,
  ...textTools,
  ...generatorTools,
  ...regexTools,
  ...colorTools,
  ...timeTools,
  ...llmTools,
];

export const toolByName = new Map(allTools.map((t) => [t.name, t]));
