"use client";

/**
 * Shared `q` contract with Explorar.
 * - Param name: `q`
 * - Debounce live URL writes on /explore: 300ms
 * - Min length for live sync: 2 (empty clears; 1 char = local only)
 * - replace while typing on /explore; push on Enter from other routes
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

export const EXPLORE_PATH = "/explore";
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_CHARS = 2;

export function normalizeQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function isExplorePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === EXPLORE_PATH || pathname.startsWith(`${EXPLORE_PATH}/`);
}

function buildExploreUrl(q: string, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  const nq = normalizeQuery(q);
  if (nq) params.set("q", nq);
  else params.delete("q");
  const qs = params.toString();
  return qs ? `${EXPLORE_PATH}?${qs}` : EXPLORE_PATH;
}

export type AppSearchQueryApi = {
  value: string;
  setQuery: (next: string, opts?: {immediate?: boolean}) => void;
  clear: () => void;
  submit: () => void;
  setFocused: (f: boolean) => void;
  onExplore: boolean;
  urlQ: string;
  shortHint: boolean;
};

const SearchQueryContext = createContext<AppSearchQueryApi | null>(null);

function useAppSearchQueryImpl(): AppSearchQueryApi {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const onExplore = isExplorePath(pathname);
  const urlQ = searchParams.get("q") || "";

  const [value, setValue] = useState(urlQ);
  const focusedRef = useRef(false);
  const lastWritten = useRef(urlQ);
  const debounceRef = useRef<number | null>(null);

  /* Sync from URL when not focused, or when URL changed externally. */
  useEffect(() => {
    if (focusedRef.current && urlQ === lastWritten.current) return;
    setValue((prev) => (urlQ !== prev ? urlQ : prev));
    lastWritten.current = urlQ;
  }, [urlQ]);

  const writeExploreUrl = useCallback(
    (q: string, mode: "replace" | "push") => {
      const next = buildExploreUrl(q, searchParams.toString());
      lastWritten.current = normalizeQuery(q);
      const cur = `${window.location.pathname}${window.location.search}`;
      if (cur === next) return;
      if (mode === "push") router.push(next, {scroll: false});
      else router.replace(next, {scroll: false});
    },
    [router, searchParams],
  );

  const setQuery = useCallback(
    (next: string, opts?: {immediate?: boolean}) => {
      setValue(next);
      if (!onExplore) return;

      const nq = normalizeQuery(next);
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const apply = () => {
        if (nq.length === 1) return; /* local only */
        writeExploreUrl(nq, "replace");
      };

      if (opts?.immediate || nq.length === 0) apply();
      else {
        debounceRef.current = window.setTimeout(apply, SEARCH_DEBOUNCE_MS);
      }
    },
    [onExplore, writeExploreUrl],
  );

  const clear = useCallback(() => {
    setValue("");
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (onExplore) writeExploreUrl("", "replace");
  }, [onExplore, writeExploreUrl]);

  const submit = useCallback(() => {
    const nq = normalizeQuery(value);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (onExplore) {
      writeExploreUrl(nq.length === 1 ? "" : nq, "replace");
      return;
    }
    writeExploreUrl(nq, "push");
  }, [value, onExplore, writeExploreUrl]);

  const setFocused = useCallback((f: boolean) => {
    focusedRef.current = f;
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    },
    [],
  );

  return useMemo(
    () => ({
      value,
      setQuery,
      clear,
      submit,
      setFocused,
      onExplore,
      urlQ,
      shortHint: normalizeQuery(value).length === 1,
    }),
    [value, setQuery, clear, submit, setFocused, onExplore, urlQ],
  );
}

/** Single shared instance for all SearchBar mounts (desktop + mobile). */
export function SearchQueryProvider({children}: {children: ReactNode}) {
  const api = useAppSearchQueryImpl();
  return (
    <SearchQueryContext.Provider value={api}>
      {children}
    </SearchQueryContext.Provider>
  );
}

export function useAppSearchQuery(): AppSearchQueryApi {
  const ctx = useContext(SearchQueryContext);
  if (!ctx) {
    throw new Error("useAppSearchQuery must be used within SearchQueryProvider");
  }
  return ctx;
}
