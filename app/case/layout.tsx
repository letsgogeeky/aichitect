import Navbar from "@/components/ui/Navbar";
import { getCounts } from "@/lib/data/counts";

export default async function CaseLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar counts={counts} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
