"use client";

import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from "react";

type Size = "sm" | "md";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Required for a11y — circular icon-only control. */
  "aria-label": string;
  children: ReactNode;
  size?: Size;
};

const SIZE: Record<Size, string> = {
  sm: "nabbi-icon-btn",
  md: "nabbi-icon-btn nabbi-icon-btn--md",
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  function IconButton(
    {className = "", size = "sm", type = "button", children, ...rest},
    ref,
  ) {
    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        className={[SIZE[size], className].filter(Boolean).join(" ")}>
        {children}
      </button>
    );
  },
);
