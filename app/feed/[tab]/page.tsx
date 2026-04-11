import { notFound } from "next/navigation";
import { FILTER_TABS } from "../tabs";
import FeedClient from "../FeedClient";
import { SITE_URL } from "@/lib/constants";

type Props = { params: Promise<{ tab: string }> };

export async function generateMetadata({ params }: Props) {
  const { tab } = await params;
  const match = FILTER_TABS.find((t) => t.id === tab && t.id !== "all");
  if (!match) return {};
  return {
    title: `${match.label} — Activity Feed | AIchitect`,
    description: `${match.label} activity in the AI tools ecosystem — health score shifts, star milestones, pricing updates, and more.`,
    alternates: { canonical: `${SITE_URL}/feed/${match.id}` },
  };
}

export default async function Page({ params }: Props) {
  const { tab } = await params;
  const valid = FILTER_TABS.some((t) => t.id === tab && t.id !== "all");
  if (!valid) notFound();
  return <FeedClient />;
}
