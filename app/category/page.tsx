import Link from "next/link";
import toolsData from "@/data/tools.json";
import { CATEGORIES, getCategoryColor, type CategoryId } from "@/lib/types";
import type { Tool } from "@/lib/types";

const allTools = toolsData as Tool[];

export default function CategoryIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-xs mb-6"
        style={{ color: "var(--text-muted)" }}
      >
        <Link href="/" className="hover:underline">
          AIchitect
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>Categories</span>
      </nav>

      <h1
        className="text-3xl font-bold mb-2 leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        AI Tool Categories
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        {allTools.length} tools across {CATEGORIES.length} categories — find the right tool for
        every layer of your stack.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const color = getCategoryColor(cat.id as CategoryId);
          const tools = allTools.filter((t) => t.category === cat.id);
          const prominent = tools.filter((t) => t.prominent).slice(0, 3);

          return (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="block rounded-xl p-5 transition-colors group"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderTop: `3px solid ${color}`,
                textDecoration: "none",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold group-hover:underline" style={{ color }}>
                  {cat.label}
                </h2>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: color + "14", color, border: `1px solid ${color}30` }}
                >
                  {tools.length}
                </span>
              </div>

              {prominent.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {prominent.map((t) => (
                    <span
                      key={t.id}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: color + "10",
                        color: "var(--text-muted)",
                        border: `1px solid ${color}20`,
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                  {tools.length > 3 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: "var(--text-muted)" }}
                    >
                      +{tools.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
