import Navbar from "@/components/ui/Navbar";
import { pageMeta } from "@/lib/metadata";
import { getCounts } from "@/lib/data/counts";

export const metadata = pageMeta({
  title: "Compare Tools",
  description:
    "Pick any two AI tools and get a side-by-side breakdown of pricing, integrations, GitHub stars, and ecosystem connections.",
  path: "/compare",
  ogImageAlt: "AIchitect Compare",
});

export default async function CompareLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar counts={counts} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
