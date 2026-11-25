"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {ChevronLeftIcon, ChevronRightIcon} from "@heroicons/react/24/outline";

type Mode = "single" | "multi";

type Props = {
  children: ReactNode;
  /** Accessible name for the row. */
  "aria-label": string;
  /**
   * `single` → radiogroup + radio semantics expected on chips.
   * `multi` → group + aria-pressed toggle chips.
   */
  mode?: Mode;
  className?: string;
  /**
   * Horizontal bleed padding (content edge). Scroll area uses negative
   * margin so chips can scroll under the panel edge.
   * Defaults to CSS `--chip-row-pad` (16px).
   */
  padInline?: string;
  /** Surface token for edge masks. */
  surface?: "card" | "background";
  /** Disable edge bleed (when already flush). */
  bleed?: boolean;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isFinePointer(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function chipButtons(scroller: HTMLElement): HTMLElement[] {
  return Array.from(
    scroller.querySelectorAll<HTMLElement>(
      'button[role="radio"], button[role="button"], button[aria-pressed], button[aria-checked]',
    ),
  ).filter((b) => !(b as HTMLButtonElement).disabled);
}

/**
 * Horizontal chip scroller for narrow containers (&lt;640).
 * Wide containers wrap. Edge fades only when overflow exists.
 */
export function ChipRow({
  children,
  "aria-label": ariaLabel,
  mode = "multi",
  className = "",
  padInline,
  surface = "card",
  bleed = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canStart, setCanStart] = useState(false);
  const [canEnd, setCanEnd] = useState(false);
  const [narrow, setNarrow] = useState(true);
  const [showArrows, setShowArrows] = useState(false);
  const didMountScroll = useRef(false);
  const rafRef = useRef(0);

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const {scrollLeft, scrollWidth, clientWidth} = el;
    const max = scrollWidth - clientWidth;
    const overflowing = max > 2;
    setCanStart(overflowing && scrollLeft > 2);
    setCanEnd(overflowing && scrollLeft < max - 2);
    setShowArrows(overflowing && isFinePointer() && narrow);
  }, [narrow]);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      updateOverflow();
    });
  }, [updateOverflow]);

  const scrollChipIntoView = useCallback(
    (chip: HTMLElement, smooth: boolean) => {
      const scroller = scrollerRef.current;
      if (!scroller || !narrow) return;
      const sRect = scroller.getBoundingClientRect();
      const cRect = chip.getBoundingClientRect();
      const delta =
        cRect.left + cRect.width / 2 - (sRect.left + sRect.width / 2);
      const next = scroller.scrollLeft + delta;
      scroller.scrollTo({
        left: Math.max(0, next),
        behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
      });
    },
    [narrow],
  );

  const centerSelected = useCallback(
    (smooth: boolean) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const selected = scroller.querySelector(
        '[aria-checked="true"], [aria-pressed="true"]',
      ) as HTMLElement | null;
      if (selected) scrollChipIntoView(selected, smooth);
    },
    [scrollChipIntoView],
  );

  const syncRovingTabIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const chips = chipButtons(scroller);
    if (!chips.length) return;
    const focused = document.activeElement as HTMLElement | null;
    const focusInRow = chips.some((c) => c === focused);
    let activeIdx = chips.findIndex(
      (c) =>
        c.getAttribute("aria-checked") === "true" ||
        c.getAttribute("aria-pressed") === "true",
    );
    if (focusInRow && focused) {
      activeIdx = chips.indexOf(focused);
    }
    if (activeIdx < 0) activeIdx = 0;
    chips.forEach((c, i) => {
      c.tabIndex = i === activeIdx ? 0 : -1;
    });
  }, []);

  /* Container width → narrow/wide */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? root.clientWidth;
      setNarrow(w < 640);
      scheduleUpdate();
    });
    ro.observe(root);
    setNarrow(root.clientWidth < 640);
    return () => ro.disconnect();
  }, [scheduleUpdate]);

  /* Scroll + size observers */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    scheduleUpdate();
    syncRovingTabIndex();
    const ro = new ResizeObserver(scheduleUpdate);
    ro.observe(el);
    el.addEventListener("scroll", scheduleUpdate, {passive: true});
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      el.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [scheduleUpdate, syncRovingTabIndex, children]);

  /* Center selected on mount (no anim) and when selection attrs change */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const run = (smooth: boolean) => {
      const id = window.requestAnimationFrame(() => {
        centerSelected(smooth);
        syncRovingTabIndex();
        scheduleUpdate();
      });
      return id;
    };

    let pending = run(false);
    didMountScroll.current = true;

    const mo = new MutationObserver(() => {
      if (!didMountScroll.current) return;
      window.cancelAnimationFrame(pending);
      pending = run(true);
    });
    mo.observe(el, {
      attributes: true,
      subtree: true,
      attributeFilter: ["aria-checked", "aria-pressed"],
    });

    return () => {
      mo.disconnect();
      window.cancelAnimationFrame(pending);
    };
  }, [centerSelected, scheduleUpdate, syncRovingTabIndex, children]);

  /* Vertical wheel → horizontal when narrow + scrollable */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !narrow) return;

    const onWheel = (e: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 2) return;
      const mostlyVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      if (!mostlyVertical) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, {passive: false});
    return () => el.removeEventListener("wheel", onWheel);
  }, [narrow]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const chips = chipButtons(scroller);
    if (!chips.length) return;

    const active = document.activeElement as HTMLElement | null;
    let idx = chips.findIndex((c) => c === active || c.contains(active));
    if (idx < 0) {
      idx = chips.findIndex(
        (c) =>
          c.getAttribute("aria-checked") === "true" ||
          c.getAttribute("aria-pressed") === "true",
      );
    }
    if (idx < 0) idx = 0;

    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = (idx + 1) % chips.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = (idx - 1 + chips.length) % chips.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = chips.length - 1;
    } else {
      return;
    }
    chips[next]?.focus();
    chips.forEach((c, i) => {
      c.tabIndex = i === next ? 0 : -1;
    });
    scrollChipIntoView(chips[next], true);
  };

  const scrollByPage = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6 * dir;
    el.scrollBy({
      left: amount,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const style: CSSProperties = {
    ["--chip-row-surface" as string]:
      surface === "background"
        ? "var(--color-background)"
        : "var(--color-card)",
    ["--chip-row-pad" as string]: bleed
      ? padInline ?? "16px"
      : padInline ?? "0px",
  };

  return (
    <div
      ref={rootRef}
      className={[
        "nabbi-chip-row",
        bleed ? "nabbi-chip-row--bleed" : "",
        narrow ? "nabbi-chip-row--scroll" : "nabbi-chip-row--wrap",
        className,
      ].join(" ")}
      style={style}
      data-can-scroll-start={canStart ? "1" : "0"}
      data-can-scroll-end={canEnd ? "1" : "0"}>
      {showArrows ? (
        <button
          type="button"
          className="nabbi-chip-row__arrow nabbi-chip-row__arrow--start"
          aria-hidden
          tabIndex={-1}
          onClick={() => scrollByPage(-1)}>
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        role={mode === "single" ? "radiogroup" : "group"}
        aria-label={ariaLabel}
        className="nabbi-chip-row__scroller"
        onKeyDown={onKeyDown}>
        {children}
      </div>

      {showArrows ? (
        <button
          type="button"
          className="nabbi-chip-row__arrow nabbi-chip-row__arrow--end"
          aria-hidden
          tabIndex={-1}
          onClick={() => scrollByPage(1)}>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
