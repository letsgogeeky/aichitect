import type { Metadata } from "next";
import toolsJson from "@/data/tools.json";
import stacksJson from "@/data/stacks.json";
import relationshipsJson from "@/data/relationships.json";
import slotsJson from "@/data/slots.json";
import type { Tool, Stack, Relationship, Slot } from "@/lib/types";
import { pageMeta } from "@/lib/metadata";
import { CaseClient } from "./CaseClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; stack?: string }>;
}): Promise<Metadata> {
  const { s, stack } = await searchParams;
  const stacks = stacksJson as Stack[];
  const tools = toolsJson as Tool[];

  if (stack) {
    const found = stacks.find((st) => st.id === stack);
    if (found) {
      return pageMeta({
        title: `Make a case for ${found.name}`,
        description: found.description,
        path: `/case?stack=${stack}`,
        ogImage: `/case/og?stack=${stack}`,
        ogImageAlt: `Make a case for ${found.name}`,
      });
    }
  }

  if (s) {
    const toolIds = s.split(",").filter(Boolean);
    const names = toolIds
      .map((id) => (tools as Tool[]).find((t) => t.id === id)?.name)
      .filter(Boolean) as string[];
    const shown = names.slice(0, 3).join(", ");
    const extra = names.length - 3;
    const title = `Make a case for ${shown}${extra > 0 ? ` +${extra}` : ""}`;
    return pageMeta({
      title,
      description: `A stack decision brief for ${names.join(", ")}. Tools selected, alternatives rejected, tradeoffs and exit conditions defined.`,
      path: `/case?s=${s}`,
      ogImage: `/case/og?s=${s}`,
      ogImageAlt: title,
    });
  }

  return { title: "Make a Case" };
}

export default async function CasePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; stack?: string }>;
}) {
  const { s, stack } = await searchParams;
  const tools = toolsJson as Tool[];
  const stacks = stacksJson as Stack[];
  const relationships = relationshipsJson as Relationship[];
  const slots = slotsJson as Slot[];

  return (
    <CaseClient
      toolIds={s ? s.split(",").filter(Boolean) : []}
      stackId={stack}
      tools={tools}
      stacks={stacks}
      relationships={relationships}
      slots={slots}
    />
  );
}
