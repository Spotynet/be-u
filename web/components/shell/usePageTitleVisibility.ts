"use client";

import {useCallback, useEffect, useRef, useState} from "react";

const SCROLL_ROOT_SELECTOR = ".nabbi-shell-panel__scroll";
const TOPBAR_OFFSET_PX = 72;

/**
 * Observes the page header against the shell scrollport.
 * When the header leaves the visible area below the sticky topbar,
 * `headerInView` becomes false (condensed topbar title should show).
 */
export function usePageTitleVisibility() {
  const [headerInView, setHeaderInView] = useState(true);
  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const registerHeaderEl = useCallback((el: HTMLElement | null) => {
    setHeaderEl(el);
    if (!el) setHeaderInView(true);
  }, []);

  useEffect(() => {
    ioRef.current?.disconnect();
    ioRef.current = null;

    if (!headerEl) {
      setHeaderInView(true);
      return;
    }

    const root =
      headerEl.closest(SCROLL_ROOT_SELECTOR) ||
      document.querySelector(SCROLL_ROOT_SELECTOR);

    const io = new IntersectionObserver(
      ([entry]) => {
        setHeaderInView(entry.isIntersecting);
      },
      {
        root: root instanceof Element ? root : null,
        rootMargin: `-${TOPBAR_OFFSET_PX}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    io.observe(headerEl);
    ioRef.current = io;

    return () => {
      io.disconnect();
      if (ioRef.current === io) ioRef.current = null;
    };
  }, [headerEl]);

  return {headerInView, registerHeaderEl};
}
