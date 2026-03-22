import Navbar from "@/components/ui/Navbar";
import { pageMeta } from "@/lib/metadata";
import { getCounts } from "@/lib/data/counts";

export const metadata = pageMeta({
  title: "Builder — Build Your AI Stack",
  description:
    "Pick one tool per slot and watch your stack wire together with live integration edges. Share your exact stack via URL.",
  path: "/builder",
  ogImage: "/builder/opengraph-image",
  ogImageAlt: "AIchitect Builder — Build Your AI Stack",
});

export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar counts={counts} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
