export const revalidate = 3600;

import { getTools } from "@/lib/data/tools";
import { getRelationships } from "@/lib/data/relationships";
import CompareClient from "./CompareClient";

export default async function CompareIndexPage() {
  const [tools, relationships] = await Promise.all([getTools(), getRelationships()]);
  return <CompareClient tools={tools} relationships={relationships} />;
}
