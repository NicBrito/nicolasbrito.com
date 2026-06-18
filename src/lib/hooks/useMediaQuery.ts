"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * SSR-safe `matchMedia` subscription. Returns `false` during server render and
 * the first client paint, then syncs to the live media-query state. Built on
 * `useSyncExternalStore` so it never causes a hydration mismatch.
 */
export function useMediaQuery(query: string): boolean {
  // `getSnapshot` runs on every render, so reuse one `MediaQueryList` per query
  // instead of allocating a fresh `window.matchMedia(query)` each call (this
  // hook feeds hot paths like the carousel). Keyed by the query string so it
  // re-resolves if the query changes. Created on the client only — `window` is
  // never touched on the server, where `getServerSnapshot` short-circuits.
  const cacheRef = useRef<{ query: string; mql: MediaQueryList } | null>(null);
  const getMql = useCallback(() => {
    if (cacheRef.current?.query !== query) {
      cacheRef.current = { query, mql: window.matchMedia(query) };
    }
    return cacheRef.current.mql;
  }, [query]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = getMql();
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [getMql],
  );

  const getSnapshot = useCallback(() => getMql().matches, [getMql]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
