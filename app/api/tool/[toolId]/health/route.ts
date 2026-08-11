import { NextRequest, NextResponse } from "next/server";
import { getToolHealthDetails } from "@/lib/data/tools";

export async function GET(req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const starsParam = req.nextUrl.searchParams.get("stars");
  const currentStars =
    starsParam !== null && !Number.isNaN(Number(starsParam)) ? Number(starsParam) : null;
  const details = await getToolHealthDetails(toolId, currentStars);
  return NextResponse.json(details);
}
