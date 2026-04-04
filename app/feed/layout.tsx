import Navbar from "@/components/ui/Navbar";
import { pageMeta } from "@/lib/metadata";
import { getCounts } from "@/lib/data/counts";

export const metadata = pageMeta({
  title: "Activity Feed",
  description:
    "What changed in the AI tools ecosystem — health score shifts, star milestones, pricing updates, and more. Updated nightly.",
  path: "/feed",
  ogImageAlt: "AIchitect Activity Feed",
});

export default async function FeedLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar counts={counts} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
