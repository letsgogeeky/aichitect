import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPing } from "./tools/ping";
import { registerRoastStack } from "./tools/roast";
import { registerChallengeStack } from "./tools/challenge";
import { registerGetStackQuestions, registerRecommendStack } from "./tools/recommend";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "aichitect",
    version: "1.0.0",
  });

  registerPing(server);
  registerRoastStack(server);
  registerChallengeStack(server);
  registerGetStackQuestions(server);
  registerRecommendStack(server);

  return server;
}
