"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type {DropdownOption, LoadOptionsFn} from "./types";
import {DEFAULT_PAGE_SIZE, matchesQuery} from "./utils";

type Args<T extends string | number> = {
  open: boolean;
  options?: DropdownOption<T>[];
  loadOptions?: LoadOptionsFn<T>;
  pageSize?: number;
  query: string;
  scrollRootRef: RefObject<HTMLElement | null>;
  sentinelRef: RefObject<HTMLElement | null>;
  onFadeUpdate?: () => void;
};

export function useLazyOptions<T extends string | number>({
  open,
  options: staticOptions,
  loadOptions,
  pageSize = DEFAULT_PAGE_SIZE,
  query,
  scrollRootRef,
  sentinelRef,
  onFadeUpdate,
}: Args<T>) {
  const mountedRef = useRef(true);
  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [asyncOpts, setAsyncOpts] = useState<DropdownOption<T>[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const isAsync = Boolean(loadOptions);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (open) setVisibleCount(pageSize);
  }, [open, pageSize, debouncedQuery]);

  const filteredStatic = useMemo(() => {
    const src = staticOptions ?? [];
    if (!debouncedQuery) return src;
    return src.filter((o) => matchesQuery(o, debouncedQuery));
  }, [staticOptions, debouncedQuery]);

  const allOptions = isAsync ? asyncOpts : filteredStatic;

  const renderedOptions = useMemo(() => {
    if (isAsync) return allOptions;
    return allOptions.slice(0, visibleCount);
  }, [isAsync, allOptions, visibleCount]);

  const fetchPage = useCallback(
    async (pageNum: number, q: string, append: boolean) => {
      if (!loadOptions) return;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const id = ++reqIdRef.current;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setLoadError(false);
      }
      try {
        const res = await loadOptions({
          query: q,
          page: pageNum,
          pageSize,
          signal: ac.signal,
        });
        if (!mountedRef.current || id !== reqIdRef.current) return;
        setAsyncOpts((prev) => (append ? [...prev, ...res.options] : res.options));
        setHasMore(res.hasMore);
        setPage(pageNum);
        setLoadError(false);
      } catch (err) {
        if ((err as {name?: string})?.name === "AbortError") return;
        if (!mountedRef.current || id !== reqIdRef.current) return;
        setLoadError(true);
      } finally {
        if (mountedRef.current && id === reqIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [loadOptions, pageSize]
  );

  const resetAsync = useCallback(() => {
    setAsyncOpts([]);
    setPage(1);
    setHasMore(false);
    setLoadError(false);
  }, []);

  useEffect(() => {
    if (!open || !isAsync) return;
    void fetchPage(1, debouncedQuery, false);
  }, [open, isAsync, debouncedQuery, fetchPage]);

  useEffect(() => {
    if (!open) return;
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (isAsync) {
          if (hasMore && !loading && !loadingMore) {
            void fetchPage(page + 1, debouncedQuery, true);
          }
        } else if (visibleCount < allOptions.length) {
          setVisibleCount((c) => Math.min(c + pageSize, allOptions.length));
        }
        onFadeUpdate?.();
      },
      {root, rootMargin: "120px", threshold: 0}
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [
    open,
    isAsync,
    hasMore,
    loading,
    loadingMore,
    page,
    debouncedQuery,
    visibleCount,
    allOptions.length,
    pageSize,
    fetchPage,
    scrollRootRef,
    sentinelRef,
    onFadeUpdate,
  ]);

  return {
    isAsync,
    debouncedQuery,
    allOptions,
    renderedOptions,
    loading,
    loadingMore,
    loadError,
    hasMore,
    fetchPage,
    resetAsync,
    setVisibleCount,
  };
}
