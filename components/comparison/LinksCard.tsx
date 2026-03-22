import type { Tool } from "@/lib/types";

interface LinksCardProps {
  tool: Tool;
  color: string;
}

export function LinksCard({ tool, color }: LinksCardProps) {
  const hasAny = tool.website_url || tool.github_url;
  if (!hasAny) return <div />;
  return (
    <div className="flex flex-col gap-1.5">
      {tool.website_url && (
        <a
          href={tool.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-[11px] py-1.5 px-3 rounded-md font-medium transition-colors"
          style={{ background: color + "22", color, border: `1px solid ${color}44` }}
        >
          {tool.name} Website ↗
        </a>
      )}
      {tool.github_url && (
        <a
          href={tool.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-[11px] py-1.5 px-3 rounded-md font-medium border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-2)]"
        >
          GitHub ↗
        </a>
      )}
    </div>
  );
}
