export function formatRelativeTime(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const years = Math.round(days / 365);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export function formatStarDelta(delta: number): { text: string; color: string } {
  const abs = Math.abs(delta);
  const formatted = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : String(abs);
  if (delta > 0) return { text: `↑ +${formatted}★ (30d)`, color: "#26de81" };
  if (delta < 0) return { text: `↓ -${formatted}★ (30d)`, color: "#ff6b6b" };
  return { text: "= no change (30d)", color: "var(--text-muted)" };
}
