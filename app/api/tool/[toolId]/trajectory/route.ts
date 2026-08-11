import { NextRequest, NextResponse } from "next/server";
import { getToolTrajectory } from "@/lib/data/tools";

export async function GET(req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 6)) : 6;
  const trajectory = await getToolTrajectory(toolId, limit);
  return NextResponse.json(trajectory);
}
