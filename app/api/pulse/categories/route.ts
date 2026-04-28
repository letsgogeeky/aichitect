import { NextResponse } from "next/server";
import { getCategoryMomentum } from "@/lib/pulse";

export { type CategoryMomentum } from "@/lib/pulse";

export const revalidate = 3600;

export async function GET() {
  const categories = await getCategoryMomentum();
  return NextResponse.json({ categories });
}
