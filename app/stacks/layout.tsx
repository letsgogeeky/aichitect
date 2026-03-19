import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Stacks — 8 Battle-Tested AI Stacks",
  description:
    "Skip the research. Explore 8 proven AI stacks — from Indie Hacker to Enterprise RAG — with every tool connection mapped out.",
  alternates: { canonical: "https://aichitect.dev/stacks" },
};

export default function StacksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
