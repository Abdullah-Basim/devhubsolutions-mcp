import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { allTools, toolByName } from "./tools/index.js";

const PACKAGE_NAME = "@devhubsolutions/mcp";
const PACKAGE_VERSION = "0.1.0";

/**
 * Builds and returns a configured MCP server with every registered tool
 * wired up. The bin entrypoint connects this to a transport (stdio).
 */
export function createServer(): Server {
  const server = new Server(
    { name: PACKAGE_NAME, version: PACKAGE_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = toolByName.get(request.params.name);
    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${request.params.name}. Available: ${allTools
              .map((t) => t.name)
              .join(", ")}.`,
          },
        ],
      };
    }

    try {
      const output = await tool.handler(request.params.arguments ?? {});
      return {
        content: [{ type: "text" as const, text: output }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Error in ${tool.name}: ${message}`,
          },
        ],
      };
    }
  });

  return server;
}
