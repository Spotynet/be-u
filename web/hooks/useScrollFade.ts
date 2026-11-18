"use client";

import {useCallback, useEffect, useRef, useState} from "react";

/**
 * Drives premium scroll fades via data-fade-top / data-fade-bottom on the
 * scroll element. RAF-throttled; ResizeObserver + passive scroll.
 */
export function useScrollFade<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const scrollingTimer = useRef<number | null>(null);
  const depsKey = deps.map(String).join("|");

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const {scrollTop, scrollHeight, clientHeight} = el;
    const canScroll = scrollHeight > clientHeight + 1;
    const atTop = scrollTop <= 1;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

    el.dataset.fadeTop = canScroll && !atTop ? "1" : "0";
    el.dataset.fadeBottom = canScroll && !atBottom ? "1" : "0";
    el.dataset.overflowing = canScroll ? "1" : "0";
    setOverflowing(canScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    const onScroll = () => {
      el.dataset.scrolling = "1";
      if (scrollingTimer.current != null) {
        window.clearTimeout(scrollingTimer.current);
      }
      scrollingTimer.current = window.setTimeout(() => {
        el.dataset.scrolling = "0";
        scrollingTimer.current = null;
      }, 180);
      schedule();
    };

    update();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    el.addEventListener("scroll", onScroll, {passive: true});
    window.addEventListener("resize", schedule);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (scrollingTimer.current != null) window.clearTimeout(scrollingTimer.current);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
    };
  }, [update, depsKey]);

  return {ref, overflowing, update};
}

/** Scroll the first invalid / error target into the premium scrollport. */
export function scrollFormFieldIntoView(
  form: HTMLElement | null,
  opts?: {preferName?: string}
) {
  if (!form || typeof window === "undefined") return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduced ? "auto" : "smooth";

  const byName = opts?.preferName
    ? (form.querySelector(
        `[data-nabbi-field="${opts.preferName}"] [role="combobox"], [data-nabbi-field="${opts.preferName}"] .nabbi-field__control, [name="${opts.preferName}"]`
      ) as HTMLElement | null)
    : null;
  const invalid =
    byName ||
    (form.querySelector(
      ":invalid, [aria-invalid='true'], .auth-alert--error"
    ) as HTMLElement | null);

  if (!invalid) return;
  invalid.scrollIntoView({block: "nearest", inline: "nearest", behavior});
  if (typeof invalid.focus === "function") {
    try {
      invalid.focus({preventScroll: true});
    } catch {
      invalid.focus();
    }
  }
}
