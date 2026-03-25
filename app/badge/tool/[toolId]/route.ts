import { NextRequest, NextResponse } from "next/server";
import toolsData from "@/data/tools.json";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";

export const runtime = "edge";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = (toolsData as Tool[]).find((t) => t.id === toolId);

  if (!tool) {
    return new NextResponse("Not found", { status: 404 });
  }

  const color = getCategoryColor(tool.category);
  const label = tool.name;
  const value = "on AIchitect";

  // Approximate text widths (6.5px per char at 11px font)
  const labelW = label.length * 6.5 + 16;
  const valueW = value.length * 6.5 + 16;
  const totalW = Math.round(labelW + valueW);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <defs>
    <linearGradient id="s" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r"><rect width="${totalW}" height="20" rx="3"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${Math.round(labelW)}" height="20" fill="${color}"/>
    <rect x="${Math.round(labelW)}" width="${Math.round(valueW)}" height="20" fill="#111118"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${Math.round(labelW / 2)}" y="15" fill="#000" fill-opacity=".2">${label}</text>
    <text x="${Math.round(labelW / 2)}" y="14">${label}</text>
    <text x="${Math.round(labelW + valueW / 2)}" y="15" fill="#000" fill-opacity=".2">${value}</text>
    <text x="${Math.round(labelW + valueW / 2)}" y="14" fill="#e0e0f0">${value}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
