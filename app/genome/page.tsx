import { getTools } from "@/lib/data/tools";
import { getSlots } from "@/lib/data/slots";
import { getRelationships } from "@/lib/data/relationships";
import GenomeClient from "./GenomeClient";

export default async function GenomePage() {
  const [tools, slots, relationships] = await Promise.all([
    getTools(),
    getSlots(),
    getRelationships(),
  ]);
  return <GenomeClient tools={tools} slots={slots} relationships={relationships} />;
}
