import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Builder — Build Your AI Stack",
  description:
    "Pick one tool per slot and see how your stack wires together. No bloat, no noise — just your custom AI stack with every integration mapped.",
  alternates: { canonical: "https://aichitect.dev/builder" },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
