import { NextRequest, NextResponse } from "next/server";
import { getCategoryTools } from "@/lib/pulse";
import { CATEGORIES } from "@/lib/types";
import type { CategoryId } from "@/lib/types";

export const revalidate = 3600;

const validCategoryIds = new Set(CATEGORIES.map((c) => c.id));

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;

  if (!validCategoryIds.has(categoryId as CategoryId)) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const tools = await getCategoryTools(categoryId as CategoryId);
  return NextResponse.json({ tools });
}
