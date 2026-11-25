"use client";

import type {CSSProperties, ReactNode} from "react";

type Size = "sm" | "md" | "lg" | "content" | "wide" | "full";

const MAX: Record<Size, number | undefined> = {
  sm: 480,
  md: 560,
  lg: 640,
  content: 720,
  wide: 1100,
  full: undefined,
};

type Props = {
  children: ReactNode;
  /**
   * Legacy capped sizes (forms). Omit for the standard page container
   * (`--page-max` + `--page-pad`). Prefer omit on migrated pages.
   * @deprecated Prefer the default (no size) standard container.
   */
  size?: Size;
  style?: CSSProperties;
  className?: string;
};

/**
 * Page width container.
 * Default: standard layout container (token max-width, centered, page pad).
 * With `size`: legacy form/browse caps (kept for unmigrated pages).
 */
export function PageContainer({
  children,
  size,
  style,
  className = "",
}: Props) {
  if (size == null) {
    return (
      <div
        className={["nabbi-page-container", className]
          .filter(Boolean)
          .join(" ")}>
        {children}
      </div>
    );
  }

  const maxWidth = MAX[size];
  return (
    <div
      className={`nabbi-page ${className}`}
      style={{
        width: "100%",
        maxWidth: maxWidth ?? "100%",
        margin: 0,
        minWidth: 0,
        boxSizing: "border-box",
        ...style,
      }}>
      {children}
    </div>
  );
}
