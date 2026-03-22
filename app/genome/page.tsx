import { loadGenomeData } from "@/lib/data-loaders";
import GenomeClient from "./GenomeClient";

export default async function GenomePage() {
  const { tools, slots, relationships } = await loadGenomeData();
  return <GenomeClient tools={tools} slots={slots} relationships={relationships} />;
}
