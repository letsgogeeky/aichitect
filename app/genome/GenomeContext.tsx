"use client";

import { createContext, useContext } from "react";
import { Tool, Slot, Relationship, Stack } from "@/lib/types";

export interface GenomeData {
  allTools: Tool[];
  allSlots: Slot[];
  allRelationships: Relationship[];
  allStacks: Stack[];
}

export const GenomeDataCtx = createContext<GenomeData>({
  allTools: [],
  allSlots: [],
  allRelationships: [],
  allStacks: [],
});

export function useGenomeData() {
  return useContext(GenomeDataCtx);
}
