import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "./server";

export const dynamic = "force-dynamic";

function makeTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session management
    enableJsonResponse: true,
  });
}

export async function POST(req: Request) {
  const transport = makeTransport();
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  const transport = makeTransport();
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function DELETE(req: Request) {
  const transport = makeTransport();
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}
