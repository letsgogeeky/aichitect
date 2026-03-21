import { getSlots } from "@/lib/data/slots";
import { getTools } from "@/lib/data/tools";
import { getRelationships } from "@/lib/data/relationships";
import BuilderClient from "./BuilderClient";

export default async function BuilderPage() {
  const [slots, tools, relationships] = await Promise.all([
    getSlots(),
    getTools(),
    getRelationships(),
  ]);
  return <BuilderClient slots={slots} tools={tools} relationships={relationships} />;
}
