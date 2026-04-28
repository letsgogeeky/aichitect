import { Suspense } from "react";
import MyStackTray from "@/components/ui/MyStackTray";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Explore",
  description:
    "Browse 123 AI tools across 12 categories — code editors, agent frameworks, LLM providers, observability, vector databases, and more — mapped with their integrations and relationships.",
  path: "/explore",
  ogImageAlt: "AIchitect — AI Tool Landscape Map",
});

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <main className="flex-1 overflow-hidden">{children}</main>
      <Suspense fallback={null}>
        <MyStackTray />
      </Suspense>
    </div>
  );
}
