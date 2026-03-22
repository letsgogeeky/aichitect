export function healthColor(score: number): string {
  if (score >= 70) return "#26de81";
  if (score >= 40) return "#fdcb6e";
  return "#ff6b6b";
}

export function healthLabel(score: number): string {
  if (score >= 70) return "Active";
  if (score >= 40) return "Slowing";
  return "Low activity";
}

export function relLabel(type: string): string {
  if (type === "integrates-with") return "integrates with";
  if (type === "commonly-paired-with") return "often paired with";
  return "competes with";
}

export function relBadgeStyle(type: string): { background: string; color: string } {
  if (type === "integrates-with") return { background: "#7c6bff22", color: "#7c6bff" };
  if (type === "commonly-paired-with") return { background: "#4a4a7a44", color: "#8888aa" };
  return { background: "#ff6b6b22", color: "#ff6b6b" };
}
