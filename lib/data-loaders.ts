import { getTools } from "@/lib/data/tools";
import { getRelationships } from "@/lib/data/relationships";
import { getSlots } from "@/lib/data/slots";
import { getStacks } from "@/lib/data/stacks";
import toolsJson from "@/data/tools.json";
import slotsJson from "@/data/slots.json";
import relationshipsJson from "@/data/relationships.json";
import stacksJson from "@/data/stacks.json";
import type { Tool, Slot, Relationship, Stack } from "@/lib/types";

export async function loadGraphData() {
  const [tools, relationships] = await Promise.all([getTools(), getRelationships()]);
  return { tools, relationships };
}

export async function loadBuilderData() {
  const [tools, relationships, slots] = await Promise.all([
    getTools(),
    getRelationships(),
    getSlots(),
  ]);
  return { tools, relationships, slots };
}

export async function loadStacksData() {
  const [tools, stacks] = await Promise.all([getTools(), getStacks()]);
  return { tools, stacks };
}

/** Fetches genome data with a static-JSON fallback if the DB is unavailable. */
export async function loadGenomeData(): Promise<{
  tools: Tool[];
  slots: Slot[];
  relationships: Relationship[];
  stacks: Stack[];
}> {
  try {
    const [tools, slots, relationships, stacks] = await Promise.all([
      getTools(),
      getSlots(),
      getRelationships(),
      getStacks(),
    ]);
    return { tools, slots, relationships, stacks };
  } catch {
    return {
      tools: toolsJson as Tool[],
      slots: slotsJson as Slot[],
      relationships: relationshipsJson as Relationship[],
      stacks: stacksJson as Stack[],
    };
  }
}
