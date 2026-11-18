"use client";

import {useCallback, useLayoutEffect, useState, type RefObject} from "react";
import type {PopoverPlacement, PopoverPos} from "./types";

type Args = {
  open: boolean;
  sheet: boolean;
  placement?: PopoverPlacement;
  triggerRef: RefObject<HTMLElement | null>;
  onScrolledAway?: () => void;
};

export function usePopoverPosition({
  open,
  sheet,
  placement = "auto",
  triggerRef,
  onScrolledAway,
}: Args) {
  const [pos, setPos] = useState<PopoverPos | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    let side: "top" | "bottom" = "bottom";
    if (placement === "top") side = "top";
    else if (placement === "bottom") side = "bottom";
    else side = spaceBelow < 160 && spaceAbove > spaceBelow ? "top" : "bottom";

    const available = side === "bottom" ? spaceBelow : spaceAbove;
    const maxHeight = Math.max(120, Math.min(320, available));
    const width = Math.max(rect.width, 220);

    setPos({
      top: side === "bottom" ? rect.bottom + 6 : rect.top - 6,
      left: rect.left,
      width,
      maxHeight,
      side,
    });

    if (
      rect.bottom < 0 ||
      rect.top > viewportH ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      onScrolledAway?.();
    }
  }, [placement, triggerRef, onScrolledAway]);

  useLayoutEffect(() => {
    if (!open || sheet) return;
    updatePosition();
    let raf = 0;
    const onScrollOrResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        updatePosition();
      });
    };
    window.addEventListener("resize", onScrollOrResize, {passive: true});
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, sheet, updatePosition]);

  return {pos, updatePosition};
}
