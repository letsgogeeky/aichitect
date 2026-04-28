import { Suspense } from "react";
import MyStackTray from "@/components/ui/MyStackTray";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Curated Stacks",
  description:
    "Skip the research. 25 curated AI stacks organized by what you're trying to do — Build, Automate, Ship & Harden, Comply, or Understand. Each with a mission brief, explicit rejections, and kill conditions.",
  path: "/stacks",
  ogImage: "/stacks/opengraph-image",
  ogImageAlt: "AIchitect Stacks — 25 mission-driven AI stacks",
});

export default function StacksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <main className="flex-1 overflow-hidden">{children}</main>
      <Suspense fallback={null}>
        <MyStackTray />
      </Suspense>
    </div>
  );
}
