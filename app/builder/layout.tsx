import Navbar from "@/components/ui/Navbar";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Builder — Build Your AI Stack",
  description:
    "Pick one tool per slot and watch your stack wire together with live integration edges. Share your exact stack via URL.",
  path: "/builder",
  ogImage: "/builder/opengraph-image",
  ogImageAlt: "AIchitect Builder — Build Your AI Stack",
});

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
