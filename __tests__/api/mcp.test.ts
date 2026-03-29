import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "@/app/api/mcp/server";

type TextContent = { type: "text"; text: string };

async function createConnectedClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

function firstTextContent(result: Awaited<ReturnType<Client["callTool"]>>): TextContent {
  const content = result.content as TextContent[];
  return content[0];
}

describe("MCP server", () => {
  it("lists all expected tools", async () => {
    const client = await createConnectedClient();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);

    expect(names).toContain("ping");
    expect(names).toContain("roast_stack");
    expect(names).toContain("challenge_stack");
    expect(names).toContain("get_stack_questions");
    expect(names).toContain("recommend_stack");
  });

  it("ping returns pong", async () => {
    const client = await createConnectedClient();
    const result = await client.callTool({ name: "ping", arguments: {} });
    const content = firstTextContent(result);
    expect(content.type).toBe("text");
    expect(JSON.parse(content.text)).toEqual({ pong: true });
  });

  it("get_stack_questions returns all 4 questions with options", async () => {
    const client = await createConnectedClient();
    const result = await client.callTool({ name: "get_stack_questions", arguments: {} });
    const { questions } = JSON.parse(firstTextContent(result).text);

    expect(questions).toHaveLength(4);
    const ids = questions.map((q: { id: string }) => q.id);
    expect(ids).toEqual(["what", "who", "priority", "budget"]);

    for (const q of questions) {
      expect(q.options.length).toBeGreaterThan(0);
      expect(typeof q.text).toBe("string");
      expect(typeof q.hint).toBe("string");
    }
  });

  it("roast_stack returns no_valid_tools when no names match catalog", async () => {
    const client = await createConnectedClient();
    const result = await client.callTool({
      name: "roast_stack",
      arguments: { tools: ["__nonexistent_tool__"] },
    });
    const body = JSON.parse(firstTextContent(result).text);
    expect(body.error).toBe("no_valid_tools");
    expect(body.skipped).toContain("__nonexistent_tool__");
  });

  it("challenge_stack returns no_valid_tools when no names match catalog", async () => {
    const client = await createConnectedClient();
    const result = await client.callTool({
      name: "challenge_stack",
      arguments: { tools: ["__nonexistent__"] },
    });
    const body = JSON.parse(firstTextContent(result).text);
    expect(body.error).toBe("no_valid_tools");
    expect(body.skipped).toContain("__nonexistent__");
  });
});
