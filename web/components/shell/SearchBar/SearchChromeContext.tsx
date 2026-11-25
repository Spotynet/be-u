"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type SearchChromeCtx = {
  /** True while the desktop SearchBar is focused (title/nav fade; bar expands left). */
  searchActive: boolean;
  setSearchActive: (v: boolean) => void;
  /** Mobile header morph: inline search row replaces chrome. */
  mobileSearchOpen: boolean;
  setMobileSearchOpen: (v: boolean) => void;
  /** Register the desktop input so Ctrl/Cmd+K can focus it. */
  registerDesktopInput: (el: HTMLInputElement | null) => void;
  /** Register the mobile icon button (focus return) and open callback. */
  registerMobileOpen: (open: () => void) => void;
  focusSearch: () => void;
};

const SearchChromeContext = createContext<SearchChromeCtx | null>(null);

const RECENTS_PREFIXES = ["nabbi-search-recents-v1-", "nabbi-search-recents-"];

/** One-time cleanup of obsolete command-palette recents keys. */
function clearLegacySearchRecents() {
  if (typeof window === "undefined") return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (RECENTS_PREFIXES.some((p) => k.startsWith(p))) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function SearchChromeProvider({children}: {children: ReactNode}) {
  const [searchActive, setSearchActiveState] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpenState] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileOpenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    clearLegacySearchRecents();
  }, []);

  const setSearchActive = useCallback((v: boolean) => {
    setSearchActiveState(v);
  }, []);

  const setMobileSearchOpen = useCallback((v: boolean) => {
    setMobileSearchOpenState(v);
  }, []);

  const registerDesktopInput = useCallback((el: HTMLInputElement | null) => {
    desktopInputRef.current = el;
  }, []);

  const registerMobileOpen = useCallback((open: () => void) => {
    mobileOpenRef.current = open;
  }, []);

  const focusSearch = useCallback(() => {
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) {
      mobileOpenRef.current?.();
      return;
    }
    const el = desktopInputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  /* Exactly ONE global Ctrl/Cmd+K and "/" handler. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const typing = isTypingTarget(e.target);
      const isToggle =
        (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash =
        e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing;

      if (!isToggle && !isSlash) return;
      if (typing && isToggle) {
        /* Already in our search input → select; otherwise ignore. */
        if (e.target === desktopInputRef.current) {
          e.preventDefault();
          desktopInputRef.current?.select();
        }
        return;
      }
      if (typing && !isToggle) return;

      e.preventDefault();
      focusSearch();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusSearch]);

  const value = useMemo(
    () => ({
      searchActive,
      setSearchActive,
      mobileSearchOpen,
      setMobileSearchOpen,
      registerDesktopInput,
      registerMobileOpen,
      focusSearch,
    }),
    [
      searchActive,
      setSearchActive,
      mobileSearchOpen,
      setMobileSearchOpen,
      registerDesktopInput,
      registerMobileOpen,
      focusSearch,
    ],
  );

  return (
    <SearchChromeContext.Provider value={value}>
      {children}
    </SearchChromeContext.Provider>
  );
}

export function useSearchChrome(): SearchChromeCtx {
  const ctx = useContext(SearchChromeContext);
  if (!ctx) {
    return {
      searchActive: false,
      setSearchActive: () => {},
      mobileSearchOpen: false,
      setMobileSearchOpen: () => {},
      registerDesktopInput: () => {},
      registerMobileOpen: () => {},
      focusSearch: () => {},
    };
  }
  return ctx;
}

/** Optional typed helper for consumers that only need the flag. */
export type {SearchChromeCtx};
export type SearchInputRef = RefObject<HTMLInputElement | null>;
