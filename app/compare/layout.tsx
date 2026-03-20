import Navbar from "@/components/ui/Navbar";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Compare — AI Tool Head-to-Head",
  description:
    "Pick any two AI tools and get a side-by-side breakdown of pricing, integrations, GitHub stars, and ecosystem connections.",
  path: "/compare",
  ogImageAlt: "AIchitect Compare",
});

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
