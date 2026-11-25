"use client";

import {useRef, useLayoutEffect, useState} from "react";
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import {
  useTheme,
  type ThemePreference,
} from "@/components/ThemeProvider";

const ICONS: Record<ThemePreference, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
};

/**
 * Apariencia control — elevated active segment + sliding indicator (transform only).
 */
export function ThemeSegmented() {
  const {preference, setPreference, preferenceOptions} = useTheme();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({left: 0, width: 0});

  useLayoutEffect(() => {
    const idx = preferenceOptions.findIndex((o) => o.value === preference);
    const btn = btnRefs.current[idx];
    const track = trackRef.current;
    if (!btn || !track) return;
    const t = track.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setIndicator({left: b.left - t.left, width: b.width});
  }, [preference, preferenceOptions]);

  return (
    <div
      ref={trackRef}
      className="nabbi-theme-segmented relative grid grid-cols-3"
      role="group"
      aria-label="Apariencia">
      <span
        className="nabbi-theme-segmented__indicator pointer-events-none absolute z-0"
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
        }}
        aria-hidden
      />
      {preferenceOptions.map((opt, i) => {
        const Icon = ICONS[opt.value];
        const selected = preference === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            onClick={() => setPreference(opt.value as ThemePreference)}
            className="nabbi-theme-segmented__btn relative z-[1] inline-flex h-full items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary">
            <Icon className="nabbi-theme-segmented__icon shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
