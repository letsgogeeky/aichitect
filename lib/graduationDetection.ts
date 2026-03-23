import type { Stack } from "./types";

export interface GraduationResult {
  currentStack: Stack;
  targetStack: Stack;
  /** Tools in the target stack not already in the user's detected set (up to 4) */
  toolsToAdd: string[];
  overlapCount: number;
  overlapPercent: number;
}

/**
 * Given detected tool IDs, finds the best-matching stack and its graduation target.
 *
 * Returns null if:
 * - No stack has >= 2 tools in common with the detected set
 * - The best-matching stack has no `graduates_to` field
 * - The `graduates_to` target stack can't be found
 */
export function detectGraduation(detectedIds: string[], stacks: Stack[]): GraduationResult | null {
  if (detectedIds.length === 0) return null;

  const detectedSet = new Set(detectedIds);

  let bestStack: Stack | null = null;
  let bestOverlap = 0;
  let bestOverlapPercent = 0;

  for (const stack of stacks) {
    const overlap = stack.tools.filter((id) => detectedSet.has(id)).length;
    const overlapPercent = stack.tools.length > 0 ? overlap / stack.tools.length : 0;

    if (overlap > bestOverlap || (overlap === bestOverlap && overlapPercent > bestOverlapPercent)) {
      bestOverlap = overlap;
      bestOverlapPercent = overlapPercent;
      bestStack = stack;
    }
  }

  if (!bestStack || bestOverlap < 2) return null;
  if (!bestStack.graduates_to) return null;

  const targetStack = stacks.find((s) => s.id === bestStack!.graduates_to);
  if (!targetStack) return null;

  const toolsToAdd = targetStack.tools.filter((id) => !detectedSet.has(id)).slice(0, 4);

  return {
    currentStack: bestStack,
    targetStack,
    toolsToAdd,
    overlapCount: bestOverlap,
    overlapPercent: bestOverlapPercent,
  };
}
