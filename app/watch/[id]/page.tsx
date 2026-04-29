import { Metadata } from "next";
import { WatchClient } from "./WatchClient";

export const metadata: Metadata = {
  title: "Stack Watch — AIchitect",
  description: "Live signals, health trends, and swap recommendations for your saved AI stack.",
};

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WatchClient stackId={id} />;
}
