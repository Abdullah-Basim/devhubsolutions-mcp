/**
 * Tool definition contract. Every tool the server exposes implements this.
 * Handlers can return either a plain string (most tools) or a structured
 * object — both get serialised into the MCP CallToolResult content array.
 */
export interface ToolDef {
  name: string;
  description: string;
  /** JSON Schema for the tool's input — sent verbatim to MCP clients. */
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  handler: (input: Record<string, unknown>) => Promise<string> | string;
}
