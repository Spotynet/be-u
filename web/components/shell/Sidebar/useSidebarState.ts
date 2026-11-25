"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {
  SIDEBAR_COOKIE,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_LS_PREFIX,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_RAIL,
  SHELL_LG_PX,
  parseSidebarCookieValue,
} from "@/components/shell/shell-config";

export type SidebarPinnedPreference = boolean | null;
export {parseSidebarCookieValue};

function preferPinnedByViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(`(min-width: 1280px)`).matches;
}

function readCookie(): SidebarPinnedPreference {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SIDEBAR_COOKIE}=`));
  if (!match) return null;
  return parseSidebarCookieValue(match.split("=")[1]);
}

function writeCookie(pinned: boolean) {
  if (typeof document === "undefined") return;
  const value = pinned ? "pinned" : "unpinned";
  document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function migrateLegacyLocalStorage(
  userId?: number | string | null,
): SidebarPinnedPreference {
  if (typeof window === "undefined" || userId == null) return null;
  const key = `${SIDEBAR_LS_PREFIX}${userId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    /* Legacy: "1" = collapsed = unpinned */
    const pinned = stored !== "1";
    writeCookie(pinned);
    localStorage.removeItem(key);
    return pinned;
  } catch {
    return null;
  }
}

/**
 * Sidebar pin state (docked vs rail).
 * - SSR: `initialPinned` from server cookie (no flash).
 * - Cookie values: `pinned` | `unpinned`; legacy `expanded`/`collapsed` mapped once.
 * - Default when unset: pinned at xl+, unpinned (rail) at lg–xl.
 * - Peek is NOT here — lives in Sidebar only so the panel never re-renders on hover.
 */
export function useSidebarState(
  userId?: number | string | null,
  initialPinned?: boolean | null,
) {
  const [pinned, setPinnedState] = useState(() =>
    typeof initialPinned === "boolean" ? initialPinned : true,
  );
  const [ready, setReady] = useState(
    () => typeof initialPinned === "boolean",
  );
  const liveRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((next: boolean) => {
    const el = liveRef.current;
    if (!el) return;
    el.textContent = next ? "Menú fijado" : "Menú sin fijar";
  }, []);

  useEffect(() => {
    const fromCookie = readCookie();
    if (fromCookie !== null) {
      setPinnedState(fromCookie);
      /* Rewrite legacy cookie values to pinned|unpinned */
      writeCookie(fromCookie);
      setReady(true);
      return;
    }
    const migrated = migrateLegacyLocalStorage(userId);
    if (migrated !== null) {
      setPinnedState(migrated);
      setReady(true);
      return;
    }
    if (typeof initialPinned === "boolean") {
      setPinnedState(initialPinned);
      setReady(true);
      return;
    }
    setPinnedState(preferPinnedByViewport());
    setReady(true);
  }, [userId, initialPinned]);

  const setPinned = useCallback(
    (value: boolean) => {
      setPinnedState(value);
      writeCookie(value);
      announce(value);
    },
    [announce],
  );

  const togglePin = useCallback(() => {
    setPinnedState((prev) => {
      const next = !prev;
      writeCookie(next);
      announce(next);
      return next;
    });
  }, [announce]);

  /** Keyboard "[" when focus is not in an editable field (lg+ only). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (typeof window !== "undefined") {
        if (!window.matchMedia(`(min-width: ${SHELL_LG_PX}px)`).matches) return;
      }
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      togglePin();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePin]);

  /** Panel inset width — never changes on peek. */
  const width = pinned ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_RAIL;

  return {
    pinned,
    setPinned,
    togglePin,
    ready,
    width,
    liveRef,
  };
}
