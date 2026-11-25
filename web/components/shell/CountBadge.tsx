"use client";

import {useEffect, useRef, useState} from "react";

export type CountBadgeProps = {
  count: number;
  /**
   * `pill` — numeric (1–99 / 99+). `dot` — corner indicator (compact / rail).
   */
  variant?: "pill" | "dot";
  /**
   * `corner` (default) — sibling of the control, hangs off top-right via
   * `.nabbi-badge-corner` CSS vars. `inset` — legacy inside-button anchor.
   */
  placement?: "corner" | "inset";
  /** Ring / surface separation token class, e.g. `ring-card`. */
  ringClassName?: string;
  className?: string;
  /** Animate pop when count increases while mounted. */
  animateOnIncrease?: boolean;
};

function formatCount(n: number): string {
  if (n >= 100) return "99+";
  return String(n);
}

/**
 * Count badge for NotificationsBell / nav.
 * Prefer `placement="corner"` as a sibling of the button inside `.nabbi-badge-anchor`
 * so the glyph is never covered and button overflow cannot clip the badge.
 */
export function CountBadge({
  count,
  variant = "pill",
  placement = "corner",
  ringClassName = "ring-card",
  className = "",
  animateOnIncrease = true,
}: CountBadgeProps) {
  const prev = useRef(count);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!animateOnIncrease) {
      prev.current = count;
      return;
    }
    if (count > prev.current && count > 0) {
      setPop(true);
      const t = window.setTimeout(() => setPop(false), 220);
      prev.current = count;
      return () => window.clearTimeout(t);
    }
    prev.current = count;
  }, [count, animateOnIncrease]);

  if (count <= 0) return null;

  const corner = placement === "corner";
  const popCls = pop ? "nabbi-count-badge--pop" : "";

  if (variant === "dot") {
    return (
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none select-none rounded-full bg-error ring-2",
          corner
            ? "nabbi-badge-corner nabbi-badge-corner--dot"
            : "absolute right-1.5 top-1.5 h-2 w-2",
          ringClassName,
          popCls,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={[
        "pointer-events-none select-none inline-flex items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold leading-none tabular-nums text-error-foreground ring-2",
        corner
          ? "nabbi-badge-corner nabbi-badge-corner--pill"
          : "absolute right-1.5 top-1.5 h-[18px] min-w-[18px]",
        ringClassName,
        popCls,
        className,
      ]
        .filter(Boolean)
        .join(" ")}>
      {formatCount(count)}
    </span>
  );
}
