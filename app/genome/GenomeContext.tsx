"use client";

import { createContext, useContext } from "react";
import { Tool, Slot, Relationship } from "@/lib/types";

export interface GenomeData {
  allTools: Tool[];
  allSlots: Slot[];
  allRelationships: Relationship[];
}

export const GenomeDataCtx = createContext<GenomeData>({
  allTools: [],
  allSlots: [],
  allRelationships: [],
});

export function useGenomeData() {
  return useContext(GenomeDataCtx);
}
