import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateRoast } from "@/lib/ai/roast";
import { resolveTools } from "@/lib/ai/resolveTools";
import { getTools } from "@/lib/data/tools";
import { getSlots } from "@/lib/data/slots";
import { analyzeGenome, detectArchetype } from "@/lib/genomeAnalysis";
import { logMcpEvent } from "@/lib/mcp/logger";

export function registerRoastStack(server: McpServer) {
  server.tool(
    "roast_stack",
    "Roast an AI stack with wit and specificity. Pass tool names as you know them (e.g. 'Cursor', 'LangGraph', 'Supabase') — no need to know internal IDs.",
    {
      tools: z
        .array(z.string())
        .min(1)
        .describe("Tool names as you know them, e.g. ['Cursor', 'LangGraph', 'Supabase']"),
      roastness_level: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe(
          "1 = warm and constructive, 3 = opinionated (default), 5 = full scorched-earth comedian mode"
        ),
    },
    async ({ tools, roastness_level }) => {
      const t0 = Date.now();
      const [allTools, allSlots] = await Promise.all([getTools(), getSlots()]);
      const { resolved, skipped } = resolveTools(tools, allTools);

      if (resolved.length === 0) {
        logMcpEvent({
          tool: "roast_stack",
          duration_ms: Date.now() - t0,
          success: false,
          tool_count: 0,
          skipped_count: skipped.length,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "no_valid_tools", skipped }),
            },
          ],
        };
      }

      const ids = resolved.map((r) => r.tool.id);
      const archetype = detectArchetype(ids, allTools);
      const report = analyzeGenome(ids, allTools, allSlots, archetype);

      const result = await generateRoast({
        tools: report.detectedTools.map((t) => t.name),
        tier: report.tier,
        fitnessScore: report.fitnessScore,
        missingRequired: report.missingSlots
          .filter((s) => s.priority === "required")
          .map((s) => s.slotName),
        missingRecommended: report.missingSlots
          .filter((s) => s.priority === "recommended")
          .map((s) => s.slotName),
        roastnessLevel: roastness_level as 1 | 2 | 3 | 4 | 5 | undefined,
      });

      logMcpEvent({
        tool: "roast_stack",
        duration_ms: Date.now() - t0,
        success: true,
        tool_count: resolved.length,
        skipped_count: skipped.length,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              lines: result.lines,
              tier: report.tier,
              fitness_score: report.fitnessScore,
              skipped,
            }),
          },
        ],
      };
    }
  );
}
