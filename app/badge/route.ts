import { NextRequest, NextResponse } from "next/server";
import toolsData from "@/data/tools.json";

export const runtime = "edge";

export function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams.get("s") ?? "";
  const toolIds = s.split(",").filter(Boolean);
  const tools = toolIds
    .map((id) => (toolsData as any[]).find((t: any) => t.id === id))
    .filter(Boolean)
    .slice(0, 5);

  const label = "AI Stack";
  const names = tools.length > 0 ? tools.map((t: any) => t.name).join(" · ") : "aichitect.dev";

  // Approximate text widths (7px per char at 11px font)
  const labelW = label.length * 6.5 + 16;
  const namesW = names.length * 6.5 + 16;
  const totalW = Math.round(labelW + namesW);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="${label}: ${names}">
  <title>${label}: ${names}</title>
  <defs>
    <linearGradient id="s" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r"><rect width="${totalW}" height="20" rx="3"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${Math.round(labelW)}" height="20" fill="#7c6bff"/>
    <rect x="${Math.round(labelW)}" width="${Math.round(namesW)}" height="20" fill="#111118"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${Math.round(labelW / 2)}" y="15" fill="#000" fill-opacity=".2">${label}</text>
    <text x="${Math.round(labelW / 2)}" y="14">${label}</text>
    <text x="${Math.round(labelW + namesW / 2)}" y="15" fill="#000" fill-opacity=".2">${names}</text>
    <text x="${Math.round(labelW + namesW / 2)}" y="14" fill="#e0e0f0">${names}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
