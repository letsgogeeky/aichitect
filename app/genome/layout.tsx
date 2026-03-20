import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Genome — Score Your AI Stack",
  description:
    "Paste your dependency files and get a fitness score for your AI stack. See which slots are covered, which are missing, and what to add next.",
  alternates: { canonical: "https://aichitect.dev/genome" },
};

export default function GenomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
