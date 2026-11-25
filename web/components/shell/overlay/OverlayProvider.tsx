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
import {SHELL_LG_MQ} from "../shell-config";
import {OVERLAY_ROOT_ID} from "./overlayRoot";

export type ShellOverlayId =
  | "location"
  | "notifications"
  | "user-menu"
  | "drawer";

type OverlayCtx = {
  activeId: ShellOverlayId | null;
  open: (id: ShellOverlayId) => void;
  close: (id?: ShellOverlayId) => void;
  closeAll: () => void;
  isOpen: (id: ShellOverlayId) => boolean;
  /** Register as sole owner for this id. Returns false if a different owner already holds it. */
  claimOwner: (id: ShellOverlayId, ownerKey: string) => boolean;
  releaseOwner: (id: ShellOverlayId, ownerKey: string) => void;
};

const OverlayContext = createContext<OverlayCtx | null>(null);

/** Module-level owner map — StrictMode remount re-claims the same key. */
const owners = new Map<ShellOverlayId, string>();

export function OverlayProvider({children}: {children: ReactNode}) {
  const [activeId, setActiveId] = useState<ShellOverlayId | null>(null);

  const open = useCallback((id: ShellOverlayId) => {
    setActiveId(id);
  }, []);

  const close = useCallback((id?: ShellOverlayId) => {
    setActiveId((cur) => {
      if (!id) return null;
      return cur === id ? null : cur;
    });
  }, []);

  const closeAll = useCallback(() => setActiveId(null), []);

  const isOpen = useCallback(
    (id: ShellOverlayId) => activeId === id,
    [activeId],
  );

  const claimOwner = useCallback((id: ShellOverlayId, ownerKey: string) => {
    const existing = owners.get(id);
    if (existing && existing !== ownerKey) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Duplicate overlay owner: ${id}`);
      }
      return false;
    }
    owners.set(id, ownerKey);
    return true;
  }, []);

  const releaseOwner = useCallback((id: ShellOverlayId, ownerKey: string) => {
    if (owners.get(id) === ownerKey) {
      owners.delete(id);
    }
  }, []);

  /* Close all overlays when crossing the shell lg boundary. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(SHELL_LG_MQ);
    const onChange = () => closeAll();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [closeAll]);

  /* Ensure the portal root exists once (StrictMode-safe). */
  useEffect(() => {
    if (typeof document === "undefined") return;
    let el = document.getElementById(OVERLAY_ROOT_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = OVERLAY_ROOT_ID;
      el.setAttribute("data-nabbi-overlay-root", "1");
      document.body.appendChild(el);
    }
  }, []);

  const value = useMemo(
    () => ({
      activeId,
      open,
      close,
      closeAll,
      isOpen,
      claimOwner,
      releaseOwner,
    }),
    [activeId, open, close, closeAll, isOpen, claimOwner, releaseOwner],
  );

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}

export function useShellOverlay(): OverlayCtx {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    return {
      activeId: null,
      open: () => {},
      close: () => {},
      closeAll: () => {},
      isOpen: () => false,
      claimOwner: () => false,
      releaseOwner: () => {},
    };
  }
  return ctx;
}

export type UseOverlayResult = {
  open: boolean;
  setOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  /** True only for the registered owner — render the portal only when true. */
  isOwner: boolean;
  ownerKey: string;
};

let ownerSeq = 0;

/**
 * Shell overlay hook: mutual exclusion by id + single-owner registration.
 * Pass `{ claim: false }` for trigger-only twins that must not own the portal.
 */
export function useOverlay(
  id: ShellOverlayId,
  opts?: {claim?: boolean},
): UseOverlayResult {
  const claim = opts?.claim !== false;
  const {isOpen, open, close, claimOwner, releaseOwner} = useShellOverlay();
  const openState = isOpen(id);
  const anchorRef = useRef<HTMLElement | null>(null);
  const ownerKeyRef = useRef<string>("");
  if (!ownerKeyRef.current) {
    ownerKeyRef.current = `ov-${id}-${++ownerSeq}`;
  }
  const ownerKey = ownerKeyRef.current;
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!claim) {
      setIsOwner(false);
      return;
    }
    const ok = claimOwner(id, ownerKey);
    setIsOwner(ok);
    return () => {
      releaseOwner(id, ownerKey);
      setIsOwner(false);
    };
  }, [id, ownerKey, claimOwner, releaseOwner, claim]);

  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof next === "function" ? next(openState) : next;
      if (resolved) open(id);
      else close(id);
    },
    [openState, open, close, id],
  );

  return {
    open: openState,
    setOpen,
    onClose: () => close(id),
    anchorRef,
    isOwner,
    ownerKey,
  };
}

/** @deprecated Prefer useOverlay — kept for call-site compatibility. */
export function useManagedOverlay(id: ShellOverlayId) {
  const {open, setOpen, onClose, isOwner, anchorRef} = useOverlay(id);
  return {open, setOpen, onClose, isOwner, anchorRef};
}

/** Alias used by AppShell. */
export {OverlayProvider as ShellOverlayProvider};
