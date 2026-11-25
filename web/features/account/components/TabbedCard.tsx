"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {Card} from "@/components/ui/Card";

type TabDef = {
  id: string;
  label: string;
  content: ReactNode;
  toolbar?: ReactNode;
  /** Tiny count pill — real counts only. */
  count?: number | null;
  disabled?: boolean;
  /** No horizontal padding on the panel (list owns 16px). */
  flush?: boolean;
};

type Props = {
  tabs: TabDef[];
  param?: string;
  defaultTab?: string;
  className?: string;
};

function useHScrollFade(ref: RefObject<HTMLElement | null>) {
  const [fade, setFade] = useState({start: false, end: false});

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) {
      setFade({start: false, end: false});
      return;
    }
    const {scrollLeft, scrollWidth, clientWidth} = el;
    const max = scrollWidth - clientWidth;
    setFade({
      start: scrollLeft > 2,
      end: max > 2 && scrollLeft < max - 2,
    });
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, {passive: true});
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref, update]);

  return fade;
}

/**
 * Premium underline tabs + optional toolbar.
 * Mobile: horizontal snap scroll, edge fades, scrollIntoView on active.
 */
export function TabbedCard({
  tabs,
  param = "tab",
  defaultTab,
  className = "",
}: Props) {
  const reactId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({left: 0, width: 0});
  const tabsFade = useHScrollFade(listRef);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fallback = defaultTab ?? tabs[0]?.id ?? "";
  const fromUrl = searchParams.get(param);
  const active =
    fromUrl && tabs.some((t) => t.id === fromUrl && !t.disabled)
      ? fromUrl
      : fallback;

  const setTab = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(param, id);
      router.replace(`${pathname}?${next.toString()}`, {scroll: false});
    },
    [pathname, param, router, searchParams],
  );

  const enabled = useMemo(() => tabs.filter((t) => !t.disabled), [tabs]);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const measure = useCallback(() => {
    const list = listRef.current;
    const btn = btnRefs.current.get(active);
    if (!list || !btn) {
      setIndicator({left: 0, width: 0});
      return;
    }
    const listBox = list.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();
    setIndicator({
      left: btnBox.left - listBox.left + list.scrollLeft,
      width: btnBox.width,
    });
  }, [active]);

  useLayoutEffect(() => {
    measure();
    const btn = btnRefs.current.get(active);
    btn?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [measure, tabs, active]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    list.addEventListener("scroll", measure, {passive: true});
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      list.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = enabled.findIndex((t) => t.id === active);
    if (idx < 0) return;
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = (idx + 1) % enabled.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = (idx - 1 + enabled.length) % enabled.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = enabled.length - 1;
    } else {
      return;
    }
    const id = enabled[next].id;
    setTab(id);
    btnRefs.current.get(id)?.focus();
  };

  return (
    <Card
      padding="none"
      className={`nabbi-tabbed-card min-w-0 overflow-hidden rounded-[20px] border-card-border shadow-card ${className}`}>
      <div
        className={[
          "flex flex-col gap-2 border-b border-card-border px-4 pt-1",
          "@min-[900px]:flex-row @min-[900px]:items-center @min-[900px]:justify-between @min-[900px]:gap-4 @min-[900px]:px-6 @min-[900px]:pt-0",
        ].join(" ")}>
        <div
          className="nabbi-hscroll-fade min-w-0 flex-1"
          data-fade-start={tabsFade.start ? "1" : "0"}
          data-fade-end={tabsFade.end ? "1" : "0"}>
          <div
            ref={listRef}
            role="tablist"
            aria-orientation="horizontal"
            className="nabbi-hscroll nabbi-tabbed-card__tabs relative gap-0.5"
            onKeyDown={onKeyDown}>
            {tabs.map((tab) => {
              const isActive = tab.id === active;
              const showCount =
                typeof tab.count === "number" && tab.count >= 0;
              return (
                <button
                  key={tab.id}
                  id={`${reactId}-${tab.id}`}
                  ref={(el) => {
                    if (el) btnRefs.current.set(tab.id, el);
                    else btnRefs.current.delete(tab.id);
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${reactId}-panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  disabled={tab.disabled}
                  onClick={() => setTab(tab.id)}
                  className={[
                    "nabbi-tabbed-card__tab relative z-10 shrink-0 rounded-[10px] px-3 text-[14px] font-semibold outline-none transition-colors duration-[140ms]",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-45",
                    isActive
                      ? "text-foreground"
                      : "text-foreground-secondary hover:bg-foreground-muted/[0.06] hover:text-foreground",
                  ].join(" ")}>
                  <span className="inline-flex items-center gap-1.5">
                    {tab.label}
                    {showCount ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground-muted/15 px-1.5 text-[11px] font-semibold tabular-nums text-foreground-secondary">
                        {tab.count! > 99 ? "99+" : tab.count}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            <span
              className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-[transform,width] duration-[240ms] ease-out motion-reduce:transition-none"
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.left}px)`,
              }}
              aria-hidden
            />
          </div>
        </div>

        {current?.toolbar ? (
          <div className="nabbi-tabbed-card__chips min-w-0 shrink-0 pb-2 @min-[900px]:pb-0">
            {current.toolbar}
          </div>
        ) : null}
      </div>

      {current ? (
        <div
          id={`${reactId}-panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`${reactId}-${current.id}`}
          className={[
            current.flush
              ? "nabbi-tabbed-card__panel--flush py-4"
              : "px-4 py-4 @min-[480px]:px-6 @min-[480px]:py-6",
          ].join(" ")}
          tabIndex={0}>
          {current.content}
        </div>
      ) : null}
    </Card>
  );
}
