"use client";

import {useCallback, useEffect, useRef, type RefObject} from "react";

type Props = {
  /** Nav element that owns the sliding indicator. */
  navRef: RefObject<HTMLElement | null>;
  /** Re-measure when mode / pathname / pin changes. */
  depsKey: string;
};

/**
 * Shared yellow edge indicator that slides between active sidebar items.
 * Sets `--indicator-y` / `--indicator-h` on the nav; CSS owns the paint.
 * SSR fallback: `.nabbi-sidebar-item__indicator-fallback` on the active item.
 */
export function SidebarNavIndicator({navRef, depsKey}: Props) {
  const mounted = useRef(false);

  const measure = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>(
      '.nabbi-sidebar-item[aria-current="page"]',
    );
    if (!active) {
      nav.style.setProperty("--indicator-opacity", "0");
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const itemRect = active.getBoundingClientRect();
    const h = 20;
    const y = itemRect.top - navRect.top + (itemRect.height - h) / 2;
    nav.style.setProperty("--indicator-y", `${Math.round(y)}px`);
    nav.style.setProperty("--indicator-h", `${h}px`);
    nav.style.setProperty("--indicator-opacity", "1");
    nav.dataset.indicatorReady = "true";
    mounted.current = true;
  }, [navRef]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(nav);
    const active = nav.querySelector(".nabbi-sidebar-item[aria-current='page']");
    if (active) ro.observe(active);

    const onFonts = () => measure();
    if (document.fonts?.ready) {
      void document.fonts.ready.then(onFonts);
    }

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [navRef, depsKey, measure]);

  return (
    <span
      className="nabbi-sidebar-nav-indicator"
      aria-hidden
    />
  );
}
