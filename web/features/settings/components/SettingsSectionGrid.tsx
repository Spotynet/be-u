"use client";

import type {ReactNode} from "react";

export type SettingsGridLayout = "stack" | "grid";

type Props = {
  /** stack = always 1 col full-width; grid = CQ 1/2/3 + orphan rules */
  layout: SettingsGridLayout;
  children: ReactNode;
  className?: string;
};

const LAYOUT_CLASS: Record<SettingsGridLayout, string> = {
  stack: "nabbi-settings-grid nabbi-settings-grid--stack",
  grid: "nabbi-settings-grid nabbi-settings-grid--cols",
};

/**
 * Shared settings section wrapper. R1–R4 live here (and in globals.css).
 * Do not add max-w / mx-auto on this wrapper or its cards.
 */
export function SettingsSectionGrid({layout, children, className = ""}: Props) {
  return (
    <div className={[LAYOUT_CLASS[layout], className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/** Inner peer grid for auto-span cards under a span-full sibling (e.g. channels). */
export function SettingsPeersGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "nabbi-settings-grid__peers",
        className,
      ]
        .filter(Boolean)
        .join(" ")}>
      {children}
    </div>
  );
}
