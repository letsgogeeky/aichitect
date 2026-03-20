import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import MyStackTray from "@/components/ui/MyStackTray";

export const metadata: Metadata = {
  title: "Stacks — 10 Curated AI Stacks",
  description:
    "Skip the research. Explore 10 curated AI stacks with honest reasoning and tradeoffs — from Indie Hacker to Enterprise RAG, Evaluation, and Spec-Driven development.",
  alternates: { canonical: "https://aichitect.dev/stacks" },
};

export default function StacksLayout({ children }: { children: React.ReactNode }) {
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
