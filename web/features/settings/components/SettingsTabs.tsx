"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {ChipRow} from "@/components/ui/ChipRow";
import {FilterChip} from "@/components/ui/FilterChip";
import type {SettingsSectionDef} from "../settingsConfig";

type Props = {
  sections: SettingsSectionDef[];
  active: string;
  dirtyIds?: Set<string>;
  onSelect: (id: string) => void;
  /** desktop fixed tabs vs mid ChipRow */
  variant: "tabs" | "chips";
};

export function SettingsTabs({
  sections,
  active,
  dirtyIds,
  onSelect,
  variant,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({x: 0, w: 0});
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  const measure = useCallback(() => {
    if (variant !== "tabs") return;
    const list = listRef.current;
    const btn = btnRefs.current.get(active);
    if (!list || !btn) {
      setIndicator({x: 0, w: 0});
      return;
    }
    const l = list.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setIndicator({
      x: b.left - l.left + list.scrollLeft,
      w: b.width,
    });
  }, [active, variant]);

  useLayoutEffect(() => {
    measure();
  }, [measure, sections]);

  useEffect(() => {
    if (variant !== "tabs") return;
    const list = listRef.current;
    if (!list) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    btnRefs.current.forEach((btn) => ro.observe(btn));

    let cancelled = false;
    const fonts = document.fonts;
    if (fonts?.ready) {
      void fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }

    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, sections, variant]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || variant === "chips") return;
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting),
      {threshold: [1]},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = sections.findIndex((s) => s.id === active);
    if (idx < 0) return;
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = (idx + 1) % sections.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = (idx - 1 + sections.length) % sections.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = sections.length - 1;
    } else {
      return;
    }
    onSelect(sections[next].id);
    btnRefs.current.get(sections[next].id)?.focus();
  };

  if (variant === "chips") {
    return (
      <div className="nabbi-settings-tabs nabbi-settings-tabs--chips">
        <ChipRow
          aria-label="Secciones de configuración"
          mode="single"
          bleed
          surface="background"
          padInline="16px">
          {sections.map((s) => (
            <span key={s.id} className="relative inline-flex">
              <FilterChip
                label={s.label}
                selected={active === s.id}
                selectionRole="radio"
                onClick={() => onSelect(s.id)}
              />
              {dirtyIds?.has(s.id) ? (
                <span
                  className="nabbi-settings-dirty-dot"
                  aria-label="Cambios sin guardar"
                />
              ) : null}
            </span>
          ))}
        </ChipRow>
      </div>
    );
  }

  const indicatorStyle = {
    "--indicator-x": `${indicator.x}px`,
    "--indicator-w": `${indicator.w}px`,
  } as CSSProperties;

  return (
    <>
      <div ref={sentinelRef} className="nabbi-settings-tabs-sentinel" aria-hidden />
      <div
        className={[
          "nabbi-settings-tabs nabbi-settings-tabs--bar",
          stuck ? "is-stuck" : "",
        ].join(" ")}>
        <div
          ref={listRef}
          role="tablist"
          aria-label="Secciones de configuración"
          className="nabbi-settings-tabs__list"
          onKeyDown={onKeyDown}
          style={indicatorStyle}>
          <span className="nabbi-settings-tabs__indicator" aria-hidden />
          {sections.map((s) => {
            const Icon = s.icon;
            const selected = active === s.id;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  if (el) btnRefs.current.set(s.id, el);
                  else btnRefs.current.delete(s.id);
                }}
                type="button"
                role="tab"
                id={`settings-tab-${s.id}`}
                aria-selected={selected}
                aria-controls={`settings-panel-${s.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelect(s.id)}
                className={[
                  "nabbi-settings-tabs__tab",
                  selected ? "is-active" : "",
                ].join(" ")}>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="nabbi-settings-tabs__label">{s.label}</span>
                {dirtyIds?.has(s.id) ? (
                  <span
                    className="nabbi-settings-dirty-dot"
                    aria-label="Cambios sin guardar"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
