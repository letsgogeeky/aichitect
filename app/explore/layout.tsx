import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import MyStackTray from "@/components/ui/MyStackTray";

export const metadata: Metadata = {
  title: "Explore — AI Tool Landscape Map",
  description:
    "Browse 123 AI tools across 12 categories — code editors, agent frameworks, LLM providers, API specs, observability, and more — mapped with their integrations and relationships.",
  alternates: { canonical: "https://aichitect.dev/explore" },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden">{children}</main>
      <Suspense fallback={null}>
        <MyStackTray />
      </Suspense>
    </div>
  );
}
