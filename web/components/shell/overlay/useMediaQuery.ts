"use client";

import {useCallback, useSyncExternalStore} from "react";

/**
 * SSR-safe matchMedia hook.
 * Returns `null` until the client has measured (no overlay owners should
 * mount while null). Then `true` / `false` for the query.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      const handler = () => onStoreChange();
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
