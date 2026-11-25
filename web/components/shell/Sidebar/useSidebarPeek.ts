"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";
import {
  SIDEBAR_PEEK_CLOSE_DELAY_MS,
  SIDEBAR_PEEK_OPEN_DELAY_MS,
} from "@/components/shell/shell-config";
import {useShellOverlay} from "@/components/shell/overlay";

type Options = {
  /** Peek only when unpinned on desktop. */
  enabled: boolean;
};

/**
 * Transient hover/focus expansion for the unpinned rail.
 * Isolated from pin state so the panel (--sidebar-w) never shifts.
 * Single timer ref for open/close intent; float card stays mounted (data-open).
 */
export function useSidebarPeek({enabled}: Options) {
  const [peek, setPeek] = useState(false);
  const timerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const {activeId} = useShellOverlay();

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const closePeek = useCallback(
    (opts?: {restoreFocus?: boolean; immediate?: boolean}) => {
      clearTimer();
      setPeek(false);
      if (opts?.restoreFocus && restoreFocusRef.current) {
        restoreFocusRef.current.focus?.();
        restoreFocusRef.current = null;
      }
    },
    [clearTimer],
  );

  const openPeek = useCallback(
    (immediate = false) => {
      if (!enabled) return;
      clearTimer();
      if (immediate) {
        setPeek(true);
        return;
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setPeek(true);
      }, SIDEBAR_PEEK_OPEN_DELAY_MS);
    },
    [clearTimer, enabled],
  );

  const scheduleClose = useCallback(() => {
    if (!enabled) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setPeek(false);
    }, SIDEBAR_PEEK_CLOSE_DELAY_MS);
  }, [clearTimer, enabled]);

  /* Disable peek when pinned — immediate, no float exit anim (CSS keys off pinned). */
  useEffect(() => {
    if (!enabled) {
      clearTimer();
      setPeek(false);
    }
  }, [enabled, clearTimer]);

  /* Close when another shell overlay opens. */
  useEffect(() => {
    if (activeId) closePeek();
  }, [activeId, closePeek]);

  /* Esc closes peek. */
  useEffect(() => {
    if (!peek) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      closePeek({restoreFocus: true});
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [peek, closePeek]);

  /* Pointer enter/leave on the sidebar root. Touch never peeks. */
  const onPointerEnter = useCallback(
    (e: PointerEvent) => {
      if (!enabled) return;
      if (e.pointerType === "touch") return;
      clearTimer();
      if (!peek) openPeek(false);
    },
    [enabled, openPeek, peek, clearTimer],
  );

  const onPointerLeave = useCallback(
    (e: PointerEvent) => {
      if (!enabled) return;
      if (e.pointerType === "touch") return;
      scheduleClose();
    },
    [enabled, scheduleClose],
  );

  const onFocusCapture = useCallback(
    (e: FocusEvent) => {
      if (!enabled) return;
      const t = e.target as HTMLElement;
      if (!rootRef.current?.contains(t)) return;
      /* Ignore focus inside a closed float card (inert should prevent this). */
      if (!restoreFocusRef.current && e.relatedTarget instanceof HTMLElement) {
        restoreFocusRef.current = e.relatedTarget;
      }
      openPeek(true);
    },
    [enabled, openPeek],
  );

  const onBlurCapture = useCallback(
    (e: FocusEvent) => {
      if (!enabled) return;
      const next = e.relatedTarget as Node | null;
      if (next && rootRef.current?.contains(next)) return;
      scheduleClose();
    },
    [enabled, scheduleClose],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    peek,
    rootRef,
    openPeek,
    closePeek,
    onPointerEnter,
    onPointerLeave,
    onFocusCapture,
    onBlurCapture,
  };
}
