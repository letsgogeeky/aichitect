import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "AI Tool Categories",
  description:
    "Browse AI tools by category — Coding Assistants, Agent Frameworks, Pipelines & RAG, LLM Infrastructure, and more. Find the right tool for every layer of your AI stack.",
  path: "/category",
  ogImageAlt: "AIchitect — AI Tool Categories",
});

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
