import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "./server";

export const dynamic = "force-dynamic";

function checkMcpAuth(req: Request): Response | null {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) return null; // not enforced — open for dev / existing integrations
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

function makeTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session management
    enableJsonResponse: true,
  });
}

export async function POST(req: Request) {
  const denied = checkMcpAuth(req);
  if (denied) return denied;
  const transport = makeTransport();
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  const denied = checkMcpAuth(req);
  if (denied) return denied;
  const transport = makeTransport();
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function DELETE(req: Request) {
  const denied = checkMcpAuth(req);
  if (denied) return denied;
  const transport = makeTransport();
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}
