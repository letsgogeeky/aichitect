import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPing(server: McpServer) {
  server.tool("ping", "Health check — returns pong", {}, async () => ({
    content: [{ type: "text" as const, text: JSON.stringify({ pong: true }) }],
  }));
}
