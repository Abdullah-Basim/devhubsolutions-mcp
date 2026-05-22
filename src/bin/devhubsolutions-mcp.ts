#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../server.js";

/**
 * Entrypoint for the @dev-hub-solutions/mcp CLI. Spawns the MCP server on
 * stdio — this is the format Claude Desktop, Claude Code, and Cursor all
 * speak natively.
 *
 * Never write to stdout from anywhere else in the process: stdout is the
 * JSON-RPC channel. Use stderr for any diagnostics.
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[devhubsolutions-mcp] fatal: ${message}\n`);
  process.exit(1);
});
