import Navbar from "@/components/ui/Navbar";

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
