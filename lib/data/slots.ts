import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/db";
import type { Slot } from "@/lib/types";
import slotsJson from "@/data/slots.json";

const fallback = slotsJson as Slot[];

const _getSlots = unstable_cache(
  async (): Promise<Slot[]> => {
    if (!supabase) return fallback;
    const { data, error } = await supabase.from("slots").select("*");
    if (error || !data?.length) return fallback;
    return data as Slot[];
  },
  ["slots-all"],
  { revalidate: 3600, tags: ["slots"] }
);

export async function getSlots(): Promise<Slot[]> {
  return _getSlots();
}

export async function getSlotById(id: string): Promise<Slot | null> {
  if (!supabase) return fallback.find((s) => s.id === id) ?? null;
  const { data, error } = await supabase.from("slots").select("*").eq("id", id).single();
  if (error || !data) return fallback.find((s) => s.id === id) ?? null;
  return data as Slot;
}
