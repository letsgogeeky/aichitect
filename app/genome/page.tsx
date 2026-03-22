import { getTools } from "@/lib/data/tools";
import { getSlots } from "@/lib/data/slots";
import { getRelationships } from "@/lib/data/relationships";
import toolsJson from "@/data/tools.json";
import slotsJson from "@/data/slots.json";
import relationshipsJson from "@/data/relationships.json";
import type { Tool, Slot, Relationship } from "@/lib/types";
import GenomeClient from "./GenomeClient";

export default async function GenomePage() {
  let tools: Tool[], slots: Slot[], relationships: Relationship[];
  try {
    [tools, slots, relationships] = await Promise.all([getTools(), getSlots(), getRelationships()]);
  } catch {
    tools = toolsJson as Tool[];
    slots = slotsJson as Slot[];
    relationships = relationshipsJson as Relationship[];
  }
  return <GenomeClient tools={tools} slots={slots} relationships={relationships} />;
}
