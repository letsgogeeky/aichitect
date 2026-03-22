import { describe, it, expect } from "vitest";
import { generateStackStory } from "@/lib/stackStory";
import type { Tool } from "@/lib/types";

function makeTool(overrides: Partial<Tool> & Pick<Tool, "id" | "name" | "category">): Tool {
  return {
    tagline: "",
    description: "",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "orchestration",
    website_url: null,
    github_url: null,
    ...overrides,
  };
}

const cursor = makeTool({
  id: "cursor",
  name: "Cursor",
  category: "coding-assistants",
  slot: "code-editor",
});
const langgraph = makeTool({
  id: "langgraph",
  name: "LangGraph",
  category: "agent-frameworks",
  slot: "agent-framework",
});
const openai = makeTool({
  id: "openai",
  name: "OpenAI",
  category: "llm-infra",
  slot: "llm-provider",
});

describe("generateStackStory", () => {
  it("returns null for fewer than 2 tools", () => {
    expect(generateStackStory([])).toBeNull();
    expect(generateStackStory([cursor])).toBeNull();
  });

  it("builds a flow string joined by arrows", () => {
    const result = generateStackStory([cursor, langgraph]);
    expect(result).not.toBeNull();
    expect(result!.flow).toContain("→");
    expect(result!.flow).toContain("Cursor");
    expect(result!.flow).toContain("LangGraph");
  });

  it("sorts tools by slot order (code-editor before agent-framework before llm-provider)", () => {
    // Pass in reverse order — output should still be sorted
    const result = generateStackStory([openai, langgraph, cursor]);
    expect(result!.flow).toBe("Cursor → LangGraph → OpenAI");
  });

  it("uses 'then' conjunction for exactly two tools", () => {
    const result = generateStackStory([cursor, langgraph]);
    expect(result!.prose).toMatch(/then/i);
    expect(result!.prose.endsWith(".")).toBe(true);
  });

  it("uses commas and 'and' conjunction for three or more tools", () => {
    const result = generateStackStory([cursor, langgraph, openai]);
    expect(result!.prose).toMatch(/,/);
    expect(result!.prose).toMatch(/\band\b/);
    expect(result!.prose.endsWith(".")).toBe(true);
  });

  it("capitalizes the first character of prose", () => {
    const result = generateStackStory([cursor, langgraph]);
    expect(result!.prose[0]).toBe(result!.prose[0].toUpperCase());
  });
});
