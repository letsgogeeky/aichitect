import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import MyStackTray from "@/components/ui/MyStackTray";
import { pageMeta } from "@/lib/metadata";
import { getCounts } from "@/lib/data/counts";

export const metadata = pageMeta({
  title: "Explore — AI Tool Landscape Map",
  description:
    "Browse 123 AI tools across 12 categories — code editors, agent frameworks, LLM providers, observability, vector databases, and more — mapped with their integrations and relationships.",
  path: "/explore",
  ogImageAlt: "AIchitect — AI Tool Landscape Map",
});

export default async function ExploreLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar counts={counts} />
      <main className="flex-1 overflow-hidden">{children}</main>
      <Suspense fallback={null}>
        <MyStackTray />
      </Suspense>
    </div>
  );
}
