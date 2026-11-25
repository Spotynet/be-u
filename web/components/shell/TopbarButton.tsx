"use client";

import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from "react";

/**
 * Shared Topbar / mobile-header control chrome.
 * Radius 999px, h-11 (44px), surface + border tokens, yellow focus ring.
 */
export const TOPBAR_BTN_BASE =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-card-border bg-card text-foreground-secondary outline-none transition-[border-color,background-color,color] duration-150 motion-reduce:transition-none hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export const TOPBAR_BTN_ICON = `${TOPBAR_BTN_BASE} w-11 px-0`;
export const TOPBAR_BTN_PILL = `${TOPBAR_BTN_BASE} px-3.5 text-[13px] font-semibold`;
export const TOPBAR_BTN_ACTIVE = "border-primary/35 bg-primary/10 text-foreground";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "icon" | "pill";
  active?: boolean;
};

export const TopbarButton = forwardRef<HTMLButtonElement, Props>(
  function TopbarButton(
    {
      children,
      variant = "icon",
      active = false,
      className = "",
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={[
          variant === "icon" ? TOPBAR_BTN_ICON : TOPBAR_BTN_PILL,
          active ? TOPBAR_BTN_ACTIVE : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}>
        {children}
      </button>
    );
  },
);
