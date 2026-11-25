"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {createPortal} from "react-dom";
import {isCoarseOrNarrowViewport} from "@/components/ui/dropdown";
import {getOverlayRoot} from "./overlay/overlayRoot";

type Placement = "bottom" | "top" | "right";

type PosState = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  transformOrigin: string;
  side: Placement | "left";
};

type Props = {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  /**
   * Optional positioning anchor (e.g. Topbar cluster). Defaults to triggerRef.
   * Outside-click and focus restore still use triggerRef.
   */
  anchorRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** Desktop panel width */
  width?: number;
  align?: "left" | "right";
  /**
   * Preferred placement relative to the trigger (desktop).
   * Flips when the preferred side lacks space.
   */
  placement?: Placement;
  /** Gap from trigger in px (desktop). Default 8. */
  offset?: number;
  /** Collision padding from viewport edges. Default 8. */
  edgePadding?: number;
  labelledBy?: string;
  className?: string;
  /** Extra classes on the mobile bottom sheet panel only. */
  sheetClassName?: string;
  /**
   * When false, children own scrolling (fixed header/footer layouts).
   * Default true wraps children in an overflow-y-auto region.
   */
  bodyScroll?: boolean;
  /** Max height of the mobile sheet. Default 85dvh. */
  sheetMaxHeight?: string;
  /** Hide the default sheet drag handle (when children render their own). */
  hideSheetHandle?: boolean;
  /**
   * `container` — focus the dialog (no ring; pointer opens).
   * `first` — focus first focusable (legacy).
   * Default `container`.
   */
  initialFocus?: "container" | "first" | "none";
  /**
   * Override sheet detection. Default = `isCoarseOrNarrowViewport`.
   * Return true to use the bottom sheet instead of the fixed popover.
   */
  shouldUseSheet?: () => boolean;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

function isAnchorRenderable(el: HTMLElement | null): boolean {
  if (!el || !el.isConnected) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function viewportBox() {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
    offsetTop: vv?.offsetTop ?? 0,
    offsetLeft: vv?.offsetLeft ?? 0,
  };
}

function computePos({
  rect,
  preferred,
  align,
  offset,
  margin,
  panelW,
  naturalH,
}: {
  rect: DOMRect;
  preferred: Placement;
  align: "left" | "right";
  offset: number;
  margin: number;
  panelW: number;
  naturalH: number;
}): PosState {
  const vp = viewportBox();
  const spaceAbove = rect.top - vp.offsetTop - margin;
  const spaceBelow = vp.offsetTop + vp.height - rect.bottom - margin;
  const spaceRight = vp.offsetLeft + vp.width - rect.right - margin;
  const spaceLeft = rect.left - vp.offsetLeft - margin;

  let side: Placement | "left" = preferred;

  if (preferred === "top" || preferred === "bottom") {
    const preferTop = preferred === "top";
    const primary = preferTop ? spaceAbove : spaceBelow;
    const secondary = preferTop ? spaceBelow : spaceAbove;
    if (primary < 160 && secondary > primary) {
      side = preferTop ? "bottom" : "top";
    } else {
      side = preferred;
    }
  } else {
    /* right — flip to left when needed */
    if (spaceRight < panelW + offset && spaceLeft > spaceRight) {
      side = "left";
    } else {
      side = "right";
    }
  }

  const available =
    side === "top"
      ? spaceAbove
      : side === "bottom"
        ? spaceBelow
        : vp.height - margin * 2;

  const maxHeight = Math.max(
    120,
    Math.min(naturalH, available - (side === "top" || side === "bottom" ? offset : 0), vp.height - margin * 2),
  );

  let left: number;
  let top: number;
  let transformOrigin: string;

  if (side === "right" || side === "left") {
    left =
      side === "right"
        ? rect.right + offset
        : rect.left - panelW - offset;
    top = rect.bottom - maxHeight;
    top = Math.max(
      vp.offsetTop + margin,
      Math.min(top, vp.offsetTop + vp.height - maxHeight - margin),
    );
    transformOrigin = side === "right" ? "bottom left" : "bottom right";
  } else if (side === "top") {
    left = align === "right" ? rect.right - panelW : rect.left;
    top = rect.top - offset - maxHeight;
    top = Math.max(vp.offsetTop + margin, top);
    /* If still overflowing bottom after clamp, shrink is already in maxHeight */
    if (top + maxHeight > vp.offsetTop + vp.height - margin) {
      top = Math.max(
        vp.offsetTop + margin,
        vp.offsetTop + vp.height - margin - maxHeight,
      );
    }
    transformOrigin = align === "left" ? "bottom left" : "bottom right";
  } else {
    left = align === "right" ? rect.right - panelW : rect.left;
    top = rect.bottom + offset;
    if (top + maxHeight > vp.offsetTop + vp.height - margin) {
      top = Math.max(
        vp.offsetTop + margin,
        vp.offsetTop + vp.height - margin - maxHeight,
      );
    }
    transformOrigin = align === "left" ? "top left" : "top right";
  }

  left = Math.max(
    vp.offsetLeft + margin,
    Math.min(left, vp.offsetLeft + vp.width - panelW - margin),
  );

  return {top, left, width: panelW, maxHeight, transformOrigin, side};
}

/**
 * Header popover: portal + collision-aware fixed panel on desktop;
 * bottom sheet on coarse/narrow viewports (same rule as CustomDropdown).
 */
export function HeaderPopover({
  open,
  onClose,
  triggerRef,
  anchorRef,
  children,
  width = 320,
  align = "right",
  placement = "bottom",
  offset = 8,
  edgePadding = 8,
  labelledBy,
  className = "",
  sheetClassName = "",
  bodyScroll = true,
  sheetMaxHeight = "85dvh",
  hideSheetHandle = false,
  initialFocus = "container",
  shouldUseSheet,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const naturalHRef = useRef(200);
  const [sheet, setSheet] = useState(false);
  const [pos, setPos] = useState<PosState | null>(null);
  const [ready, setReady] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closedInvalid = useRef(false);

  useLayoutEffect(() => {
    setPortalEl(getOverlayRoot());
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      setReady(false);
      naturalHRef.current = 200;
      closedInvalid.current = false;
      setSheet(false);
      return;
    }
    /* Sync sheet flag before paint to avoid a desktop flash on mobile. */
    const useSheet = shouldUseSheet
      ? shouldUseSheet()
      : isCoarseOrNarrowViewport();
    setSheet(useSheet);
  }, [open, shouldUseSheet]);

  useLayoutEffect(() => {
    if (!open || sheet) return;

    const measure = (captureNatural: boolean) => {
      const anchor = anchorRef?.current ?? triggerRef.current;
      if (!isAnchorRenderable(anchor)) {
        setPos(null);
        setReady(false);
        if (!closedInvalid.current) {
          closedInvalid.current = true;
          onClose();
        }
        return;
      }
      closedInvalid.current = false;
      const rect = anchor!.getBoundingClientRect();
      const vp = viewportBox();
      const panelW = Math.min(width, vp.width - edgePadding * 2);
      const panel = panelRef.current;
      if (captureNatural && panel) {
        /* Temporarily clear max-height so scrollHeight is unconstrained. */
        const prevMax = panel.style.maxHeight;
        panel.style.maxHeight = "none";
        naturalHRef.current = Math.max(
          panel.scrollHeight,
          panel.offsetHeight,
          200,
        );
        panel.style.maxHeight = prevMax;
      }
      const next = computePos({
        rect,
        preferred: placement,
        align,
        offset,
        margin: edgePadding,
        panelW,
        naturalH: naturalHRef.current,
      });
      setPos(next);
      setReady(true);
    };

    measure(true);
    /* Second pass after children paint so natural height is accurate. */
    const raf = window.requestAnimationFrame(() => measure(true));

    const onScrollOrResize = () => measure(false);
    const onOrientation = () => measure(true);
    window.addEventListener("resize", onScrollOrResize, {passive: true});
    window.addEventListener("scroll", onScrollOrResize, {
      passive: true,
      capture: true,
    });
    window.addEventListener("orientationchange", onOrientation, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", onScrollOrResize);
    window.visualViewport?.addEventListener("scroll", onScrollOrResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("orientationchange", onOrientation);
      window.visualViewport?.removeEventListener("resize", onScrollOrResize);
      window.visualViewport?.removeEventListener("scroll", onScrollOrResize);
    };
  }, [
    open,
    sheet,
    triggerRef,
    anchorRef,
    width,
    align,
    placement,
    offset,
    edgePadding,
    onClose,
  ]);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    if (sheet) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    const panel = panelRef.current;
    if (initialFocus === "first") {
      const nodes = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
      nodes?.[0]?.focus();
    } else if (initialFocus === "container") {
      panel?.focus({preventScroll: true});
    }

    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [open, sheet, onClose, triggerRef, initialFocus]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open || typeof document === "undefined" || !portalEl) return null;

  if (sheet) {
    return createPortal(
      <div className="z-shell-overlay fixed inset-0" role="presentation">
        <button
          type="button"
          className="absolute inset-0"
          style={{background: "var(--color-scrim)"}}
          aria-label="Cerrar"
          onClick={onClose}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy || titleId}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className={[
            "nabbi-header-sheet absolute bottom-0 left-0 right-0 flex flex-col overflow-x-hidden overflow-hidden rounded-t-[24px] border border-card-border bg-card shadow-card outline-none",
            "pb-[env(safe-area-inset-bottom)]",
            className,
            sheetClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{maxHeight: sheetMaxHeight}}>
          {!hideSheetHandle ? (
            <div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground-muted/25"
              aria-hidden
            />
          ) : null}
          {bodyScroll ? (
            <div
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
              style={{maxHeight: `calc(${sheetMaxHeight} - 12px)`}}>
              {children}
            </div>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          )}
        </div>
      </div>,
      portalEl,
    );
  }

  /* Hidden until measured — avoid a jump at (0,0). */
  if (!pos || !ready) {
    return createPortal(
      <div
        ref={panelRef}
        aria-hidden
        className={[
          "nabbi-header-popover z-shell-overlay fixed flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card",
          className,
        ].join(" ")}
        style={{
          visibility: "hidden",
          pointerEvents: "none",
          top: 0,
          left: 0,
          width: Math.min(width, viewportBox().width - edgePadding * 2),
        }}>
        {bodyScroll ? children : (
          <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
        )}
      </div>,
      portalEl,
    );
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy || titleId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={[
        "nabbi-header-popover z-shell-overlay fixed flex flex-col overflow-x-hidden overflow-hidden rounded-2xl border border-card-border bg-card text-foreground shadow-dropdown outline-none",
        className,
      ].join(" ")}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxWidth: `min(${width}px, calc(100vw - ${edgePadding * 2}px))`,
        maxHeight: `min(calc(100dvh - ${edgePadding * 2}px), var(--menu-max-h))`,
        ["--menu-max-h" as string]: `${pos.maxHeight}px`,
        ["--menu-natural-height" as string]: `${naturalHRef.current}px`,
        transformOrigin: pos.transformOrigin,
      }}>
      {bodyScroll ? (
        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
          style={{maxHeight: "inherit"}}>
          {children}
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      )}
    </div>,
    portalEl,
  );
}
