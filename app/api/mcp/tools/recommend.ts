import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QUESTIONS } from "@/lib/quizContent";
import { scoreStacks, type QuizAnswers } from "@/lib/quizScoring";
import { loadGenomeData } from "@/lib/data-loaders";
import { analyzeGenome, detectArchetype } from "@/lib/genomeAnalysis";
import { logMcpEvent } from "@/lib/mcp/logger";

export function registerGetStackQuestions(server: McpServer) {
  server.tool(
    "get_stack_questions",
    "Returns the AIchitect questionnaire. Present each question to the user in order and collect their answer before calling recommend_stack.",
    {},
    async () => {
      const t0 = Date.now();
      const questions = QUESTIONS.map((q) => ({
        id: q.id,
        text: q.question,
        hint: q.hint,
        options: q.options.map((o) => ({
          id: o.value,
          label: o.label,
          description: o.sub,
        })),
      }));

      logMcpEvent({ tool: "get_stack_questions", duration_ms: Date.now() - t0, success: true });

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ questions }) }],
      };
    }
  );
}

export function registerRecommendStack(server: McpServer) {
  server.tool(
    "recommend_stack",
    "Given answers to the get_stack_questions questionnaire, returns a slot-by-slot AI stack recommendation using AIchitect's scoring system and live tool health data.",
    {
      answers: z
        .array(
          z.object({
            question_id: z.string().describe("The question id from get_stack_questions"),
            option_id: z.string().describe("The chosen option id"),
          })
        )
        .min(1),
    },
    async ({ answers }) => {
      const t0 = Date.now();
      const { tools, slots, stacks } = await loadGenomeData();

      // Map answers array → QuizAnswers shape, falling back to empty string for missing questions
      const quizAnswers: QuizAnswers = {
        what: answers.find((a) => a.question_id === "what")?.option_id ?? "",
        who: answers.find((a) => a.question_id === "who")?.option_id ?? "",
        priority: answers.find((a) => a.question_id === "priority")?.option_id ?? "",
        budget: answers.find((a) => a.question_id === "budget")?.option_id ?? "",
      };

      const ranked = scoreStacks(quizAnswers);
      const best = ranked[0];
      const matchedStack = stacks.find((s) => s.id === best.stackId);

      // Use the matched stack's tools as the "detected" set for genome analysis
      const stackToolIds = matchedStack?.tools ?? [];
      const archetype = detectArchetype(stackToolIds, tools);
      const report = analyzeGenome(stackToolIds, tools, slots, archetype);

      const recommendations = [
        ...report.filledSlots.map((fs) => ({
          slot: fs.slotName,
          slot_id: fs.slotId,
          priority: fs.priority,
          tool: {
            id: fs.tool.id,
            name: fs.tool.name,
            tagline: fs.tool.tagline,
            type: fs.tool.type,
            health_score: fs.tool.health_score ?? null,
            website_url: fs.tool.website_url,
          },
        })),
        ...report.missingSlots.map((ms) => ({
          slot: ms.slotName,
          slot_id: ms.slotId,
          priority: ms.priority,
          tool: ms.suggestTool
            ? {
                id: ms.suggestTool.id,
                name: ms.suggestTool.name,
                tagline: ms.suggestTool.tagline,
                type: ms.suggestTool.type,
                health_score: ms.suggestTool.health_score ?? null,
                website_url: ms.suggestTool.website_url,
              }
            : null,
        })),
      ];

      const output = {
        recommended_stack_id: matchedStack?.id,
        recommendations,
        fitness_score: report.fitnessScore,
        tier: report.tier,
        archetype,
      };

      logMcpEvent({
        tool: "recommend_stack",
        duration_ms: Date.now() - t0,
        success: true,
        tool_count: answers.length,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
      };
    }
  );
}
