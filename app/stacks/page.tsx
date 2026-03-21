import { getStacks } from "@/lib/data/stacks";
import { getTools } from "@/lib/data/tools";
import StacksClient from "./StacksClient";

export default async function StacksPage() {
  const [stacks, tools] = await Promise.all([getStacks(), getTools()]);
  return <StacksClient stacks={stacks} tools={tools} />;
}
