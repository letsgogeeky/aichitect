import { loadBuilderData } from "@/lib/data-loaders";
import BuilderClient from "./BuilderClient";

export default async function BuilderPage() {
  const { tools, relationships, slots } = await loadBuilderData();
  return <BuilderClient slots={slots} tools={tools} relationships={relationships} />;
}
