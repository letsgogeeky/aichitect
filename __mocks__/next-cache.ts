/**
 * Vitest mock for next/cache.
 * unstable_cache is a transparent passthrough — no Next.js Data Cache in the test environment.
 */
export function unstable_cache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  _keyParts?: string[],
  _options?: { revalidate?: number; tags?: string[] }
): T {
  return fn;
}

export function revalidateTag(_tag: string): void {}
export function revalidatePath(_path: string): void {}
