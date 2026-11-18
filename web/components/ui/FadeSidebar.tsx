"use client";

import {ReactNode} from "react";
import {useTheme} from "@/components/ThemeProvider";
import {getSurfaces} from "@/constants/brand";

export type FadeSidebarVariant = "forest" | "surface" | "soft";

interface FadeSidebarProps {
  children: ReactNode;
  /** Changing this key retriggers the fade-in */
  contentKey?: string | number;
  variant?: FadeSidebarVariant;
  className?: string;
  /** Desktop width */
  width?: number | string;
  sticky?: boolean;
  /** Extra class on the fading body */
  bodyClassName?: string;
}

/**
 * Subtle modern sidebar shell with soft gradient + fade-in.
 * Reuse for auth brand panels, dashboard nav, drawers, etc.
 */
export function FadeSidebar({
  children,
  contentKey = "default",
  variant = "forest",
  className = "",
  width = 280,
  sticky = true,
  bodyClassName = "",
}: FadeSidebarProps) {
  const {theme} = useTheme();
  const surf = getSurfaces(theme === "dark" ? "dark" : "light");

  const backgrounds: Record<FadeSidebarVariant, string> = {
    forest: `linear-gradient(165deg, ${surf.forestMid} 0%, ${surf.forest} 55%, ${surf.mode === "dark" ? "#07110c" : "#101f18"} 100%)`,
    surface: surf.elevated,
    soft: `linear-gradient(180deg, ${surf.bgAlt} 0%, ${surf.bg} 100%)`,
  };

  const isDarkPanel = variant === "forest" || (variant === "surface" && surf.mode === "dark");

  return (
    <aside
      className={`fade-sidebar fade-sidebar--${variant} ${sticky ? "fade-sidebar--sticky" : ""} ${className}`}
      style={{
        width,
        background: backgrounds[variant],
        color: isDarkPanel ? "#fff" : surf.text,
        borderColor: isDarkPanel ? "rgba(255,255,255,0.08)" : surf.border,
      }}>
      <div className="fade-sidebar__glow" aria-hidden="true" />
      <div key={contentKey} className={`fade-sidebar__body ${bodyClassName}`.trim()}>
        {children}
      </div>
    </aside>
  );
}
