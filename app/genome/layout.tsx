import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Stack Genome",
  description:
    "Paste your dependency files and get a fitness score for your AI stack. See which slots are covered, which are missing, and what to add next.",
  path: "/genome",
  ogImageAlt: "AIchitect Genome — Score Your AI Stack",
});

export default function GenomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
