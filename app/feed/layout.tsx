import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Activity Feed",
  description:
    "What changed in the AI tools ecosystem — health score shifts, star milestones, pricing updates, and more. Updated nightly.",
  path: "/feed",
  ogImageAlt: "AIchitect Activity Feed",
});

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
