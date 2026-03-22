import Navbar from "@/components/ui/Navbar";
import { getCounts } from "@/lib/data/counts";

export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar counts={counts} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
