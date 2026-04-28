import type { Metadata } from "next";
import { CategoryMomentumCard } from "./components/CategoryMomentumCard";
import { getCategoryMomentum } from "@/lib/pulse";
import type { CategoryMomentum } from "@/lib/pulse";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Ecosystem Pulse | AIchitect",
  description:
    "30-day momentum heatmap across the AI tool landscape. See which categories are heating up and which are cooling — updated daily.",
  openGraph: {
    title: "Ecosystem Pulse | AIchitect",
    description: "30-day momentum across the AI tool landscape.",
    url: `${SITE_URL}/pulse`,
  },
};

function SummaryBar({ categories }: { categories: CategoryMomentum[] }) {
  const heating = categories.filter((c) => c.momentum != null && c.momentum > 5).length;
  const flat = categories.filter(
    (c) => c.momentum != null && c.momentum >= -5 && c.momentum <= 5
  ).length;
  const cooling = categories.filter((c) => c.momentum != null && c.momentum < -5).length;

  if (heating === 0 && flat === 0 && cooling === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {heating > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="text-emerald-400">↑</span>
          <span className="text-white/70">
            <strong className="text-white">{heating}</strong>{" "}
            {heating === 1 ? "category" : "categories"} heating
          </span>
        </span>
      )}
      {flat > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="text-white/30">→</span>
          <span className="text-white/70">
            <strong className="text-white">{flat}</strong> {flat === 1 ? "category" : "categories"}{" "}
            flat
          </span>
        </span>
      )}
      {cooling > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="text-red-400">↓</span>
          <span className="text-white/70">
            <strong className="text-white">{cooling}</strong>{" "}
            {cooling === 1 ? "category" : "categories"} cooling
          </span>
        </span>
      )}
    </div>
  );
}

export default async function PulsePage() {
  const categories = await getCategoryMomentum();
  const hasData = categories.some((c) => c.avg_health_now != null);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Ecosystem Pulse
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            30-day momentum across the AI tool landscape · updated daily
          </p>
          {hasData && (
            <div className="mt-4">
              <SummaryBar categories={categories} />
            </div>
          )}
        </div>

        {!hasData ? (
          <div
            className="rounded-xl border px-6 py-12 text-center"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Pulse data is being collected. Check back after the next daily sync.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {categories.map((cat) => (
              <CategoryMomentumCard key={cat.category_id} data={cat} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
