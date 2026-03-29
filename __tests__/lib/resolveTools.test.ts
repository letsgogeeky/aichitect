import { describe, it, expect } from "vitest";
import { resolveTools } from "@/lib/ai/resolveTools";
import type { Tool } from "@/lib/types";

function makeTool(overrides: Partial<Tool> & { id: string; name: string }): Tool {
  return {
    category: "coding-assistants",
    tagline: "",
    description: "",
    type: "commercial",
    pricing: { free_tier: false, plans: [] },
    github_stars: null,
    slot: "coding-assistant",
    website_url: null,
    github_url: null,
    use_context: "dev-productivity",
    ...overrides,
  };
}

const CATALOG: Tool[] = [
  makeTool({ id: "cursor", name: "Cursor" }),
  makeTool({
    id: "langgraph",
    name: "LangGraph",
    aliases: { npm: ["@langchain/langgraph"], pip: ["langgraph"], env_vars: [], config_files: [] },
  }),
  makeTool({
    id: "openai",
    name: "OpenAI",
    aliases: { npm: [], pip: [], env_vars: ["OPENAI_API_KEY"], config_files: [] },
  }),
  makeTool({ id: "supabase", name: "Supabase" }),
];

describe("resolveTools", () => {
  it("matches by exact id", () => {
    const { resolved, skipped } = resolveTools(["cursor"], CATALOG);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].tool.id).toBe("cursor");
    expect(skipped).toHaveLength(0);
  });

  it("matches by case-insensitive name", () => {
    const { resolved } = resolveTools(["Cursor", "SUPABASE", "langgraph"], CATALOG);
    expect(resolved.map((r) => r.tool.id)).toEqual(["cursor", "supabase", "langgraph"]);
  });

  it("matches hyphenated id when input has the same normalized form", () => {
    const catalog = [...CATALOG, makeTool({ id: "claude-code", name: "Claude Code" })];
    // "Claude_Code" normalizes to "claude-code" which matches the id
    const { resolved } = resolveTools(["Claude_Code"], catalog);
    expect(resolved[0].tool.id).toBe("claude-code");
  });

  it("matches by npm alias", () => {
    const { resolved } = resolveTools(["@langchain/langgraph"], CATALOG);
    expect(resolved[0].tool.id).toBe("langgraph");
  });

  it("matches by pip alias", () => {
    const { resolved } = resolveTools(["langgraph"], CATALOG);
    expect(resolved[0].tool.id).toBe("langgraph");
  });

  it("matches by env_var alias", () => {
    const { resolved } = resolveTools(["OPENAI_API_KEY"], CATALOG);
    expect(resolved[0].tool.id).toBe("openai");
  });

  it("puts unmatched names in skipped", () => {
    const { resolved, skipped } = resolveTools(["Cursor", "UnknownTool"], CATALOG);
    expect(resolved).toHaveLength(1);
    expect(skipped).toEqual(["UnknownTool"]);
  });

  it("deduplicates when the same tool is matched twice", () => {
    const { resolved } = resolveTools(["cursor", "Cursor"], CATALOG);
    expect(resolved).toHaveLength(1);
  });

  it("returns empty resolved and all skipped when nothing matches", () => {
    const { resolved, skipped } = resolveTools(["__x__", "__y__"], CATALOG);
    expect(resolved).toHaveLength(0);
    expect(skipped).toEqual(["__x__", "__y__"]);
  });

  it("preserves the original input string in resolved", () => {
    const { resolved } = resolveTools(["Cursor"], CATALOG);
    expect(resolved[0].input).toBe("Cursor");
  });
});
