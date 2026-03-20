import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import MyStackTray from "@/components/ui/MyStackTray";

export const metadata: Metadata = {
  title: "Stacks — 25 Curated AI Stacks",
  description:
    "Skip the research. Explore 25 curated AI stacks organized by mission — from zero-budget OSS to enterprise RAG, fine-tuning, GDPR compliance, and multi-agent DevOps.",
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
