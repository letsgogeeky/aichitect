import Navbar from "@/components/ui/Navbar";
import { pageMeta } from "@/lib/metadata";
import { getCounts } from "@/lib/data/counts";

export const metadata = pageMeta({
  title: "Stack Genome",
  description:
    "Paste your dependency files and get a fitness score for your AI stack. See which slots are covered, which are missing, and what to add next.",
  path: "/genome",
  ogImageAlt: "AIchitect Genome — Score Your AI Stack",
});

export default async function GenomeLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar counts={counts} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
