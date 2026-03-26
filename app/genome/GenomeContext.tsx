"use client";

import { createContext, useContext } from "react";
import { Tool, Slot, Stack } from "@/lib/types";

export interface GenomeData {
  allTools: Tool[];
  allSlots: Slot[];
  allStacks: Stack[];
}

export const GenomeDataCtx = createContext<GenomeData>({
  allTools: [],
  allSlots: [],
  allStacks: [],
});

export function useGenomeData() {
  return useContext(GenomeDataCtx);
}
