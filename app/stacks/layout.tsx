import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import MyStackTray from "@/components/ui/MyStackTray";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Stacks — 25 Mission-Driven AI Stacks",
  description:
    "Skip the research. 25 curated AI stacks organized by what you're trying to do — Build, Automate, Ship & Harden, Comply, or Understand. Each with a mission brief, explicit rejections, and kill conditions.",
  path: "/stacks",
  ogImage: "/stacks/opengraph-image",
  ogImageAlt: "AIchitect Stacks — 25 mission-driven AI stacks",
});

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
