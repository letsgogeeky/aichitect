import { loadStacksData } from "@/lib/data-loaders";
import StacksClient from "./StacksClient";

export default async function StacksPage() {
  const { tools, stacks } = await loadStacksData();
  return <StacksClient stacks={stacks} tools={tools} />;
}
