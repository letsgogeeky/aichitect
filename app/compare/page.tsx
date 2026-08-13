export const revalidate = 3600;

import { getTools } from "@/lib/data/tools";
import { getRelationships } from "@/lib/data/relationships";
import { pageMeta } from "@/lib/metadata";
import CompareClient from "./CompareClient";

export const metadata = pageMeta({
  title: "Compare AI Tools",
  description:
    "Pick two AI tools and compare pricing, features, and shared integrations side by side.",
  path: "/compare",
});

export default async function CompareIndexPage() {
  const [tools, relationships] = await Promise.all([getTools(), getRelationships()]);
  return <CompareClient tools={tools} relationships={relationships} />;
}
