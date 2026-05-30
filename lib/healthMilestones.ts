/**
 * Star-count thresholds that fire a `star_milestone` event when crossed.
 * Lives outside the cron route so the crossing logic can be unit-tested
 * without spinning up the Supabase client.
 */
export const STAR_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000] as const;

/**
 * Returns the subset of `milestones` strictly crossed between `prev` and `curr`.
 * "Crossed" means `prev < milestone <= curr`. A drop in stars never fires.
 *
 * `prev === null` is treated as 0 — a brand-new tool that already has 10k+
 * stars on first sight will fire every milestone at or below its current
 * count. That's intentional: it's the first time we've measured the tool,
 * so we want the historical milestones banked in the event timeline.
 */
export function selectCrossedMilestones(
  prev: number | null | undefined,
  curr: number,
  milestones: readonly number[] = STAR_MILESTONES
): number[] {
  const baseline = prev ?? 0;
  if (curr <= baseline) return [];
  return milestones.filter((m) => baseline < m && curr >= m);
}
