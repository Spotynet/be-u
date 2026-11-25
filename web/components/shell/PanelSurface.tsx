"use client";

import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type Radius = "panel" | "drawer-start" | "drawer-end" | "none";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  /** Semantic element. Default `div`. */
  as?: "div" | "aside" | "section";
  /** Corner radius variant. */
  radius?: Radius;
  /** Extra classes on the scroll/body slot. */
  bodyClassName?: string;
  /** When false, children fill the root (no scroll wrapper). */
  scroll?: boolean;
  /** Optional sticky header (rendered above the scroll body). */
  header?: ReactNode;
};

const RADIUS: Record<Radius, string> = {
  panel: "nabbi-panel-surface--r-panel",
  "drawer-start": "nabbi-panel-surface--r-drawer-start",
  "drawer-end": "nabbi-panel-surface--r-drawer-end",
  none: "nabbi-panel-surface--r-none",
};

/**
 * Shared floating panel chrome: clipped radius + overlay hairline border
 * that children cannot paint over. Used by center panel, Centro social
 * (docked / mini / overlay / drawer).
 */
export const PanelSurface = forwardRef<HTMLElement, Props>(function PanelSurface(
  {
    children,
    as: Tag = "div",
    radius = "panel",
    className = "",
    bodyClassName = "",
    scroll = true,
    header,
    style,
    ...rest
  },
  ref,
) {
  const rootClass = [
    "nabbi-panel-surface",
    RADIUS[radius],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref as never}
      className={rootClass}
      style={style as CSSProperties}
      {...rest}>
      <span className="nabbi-panel-surface__border" aria-hidden />
      {header ? (
        <div className="nabbi-panel-surface__header">{header}</div>
      ) : null}
      {scroll ? (
        <div
          className={[
            "nabbi-panel-surface__body scroll-premium",
            bodyClassName,
          ]
            .filter(Boolean)
            .join(" ")}>
          {children}
        </div>
      ) : (
        children
      )}
    </Tag>
  );
});
