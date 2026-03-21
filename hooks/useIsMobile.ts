import { useSyncExternalStore } from "react";

const query = "(max-width: 639px)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * Returns true when viewport width is below 640px (Tailwind's `sm` breakpoint).
 * SSR-safe: returns false on the server, syncs after hydration.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
