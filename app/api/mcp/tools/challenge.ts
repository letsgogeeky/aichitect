import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateChallenge } from "@/lib/ai/challenge";
import { resolveTools } from "@/lib/ai/resolveTools";
import { getTools } from "@/lib/data/tools";
import { getSlots } from "@/lib/data/slots";
import { analyzeGenome, detectArchetype } from "@/lib/genomeAnalysis";

export function registerChallengeStack(server: McpServer) {
  server.tool(
    "challenge_stack",
    "Argue adversarially against the tools in your AI stack. Pass tool names as you know them — slots are derived automatically from the catalog.",
    {
      tools: z
        .array(z.string())
        .min(1)
        .describe("Tool names as you know them, e.g. ['Cursor', 'LangGraph', 'Supabase']"),
    },
    async ({ tools }) => {
      const [allTools, allSlots] = await Promise.all([getTools(), getSlots()]);
      const { resolved, skipped } = resolveTools(tools, allTools);

      if (resolved.length === 0) {
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

      // Derive slot names from the catalog — no user input needed
      const filledSlots = resolved.map((r) => {
        const slotInfo = report.filledSlots.find((fs) => fs.tool.id === r.tool.id);
        return {
          slotName: slotInfo?.slotName ?? r.tool.slot,
          toolName: r.tool.name,
        };
      });

      const result = await generateChallenge({
        filledSlots,
        missingRequired: report.missingSlots
          .filter((s) => s.priority === "required")
          .map((s) => s.slotName),
        tier: report.tier,
        fitnessScore: report.fitnessScore,
        archetype,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ...result, skipped }),
          },
        ],
      };
    }
  );
}
