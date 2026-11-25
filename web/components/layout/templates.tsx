"use client";

import type {ReactNode} from "react";
import {PageContainer} from "./PageContainer";

type Common = {
  children: ReactNode;
  className?: string;
  /** When false, skip PageContainer (caller already wrapped). Default true. */
  container?: boolean;
};

function wrap(container: boolean | undefined, node: ReactNode) {
  if (container === false) return node;
  return <PageContainer>{node}</PageContainer>;
}

/** T1 — header + full-width stacked cards. */
export function StackLayout({children, className = "", container}: Common) {
  return wrap(
    container,
    <div className={["nabbi-tpl-stack", className].filter(Boolean).join(" ")}>
      {children}
    </div>,
  );
}

/** T2 — main column + right rail (>=1280 container). */
export function MainRailLayout({
  main,
  rail,
  className = "",
  container,
}: {
  main: ReactNode;
  rail: ReactNode;
  className?: string;
  container?: boolean;
}) {
  return wrap(
    container,
    <div
      className={["nabbi-tpl-main-rail", className].filter(Boolean).join(" ")}>
      <div className="nabbi-tpl-main-rail__main">{main}</div>
      <aside className="nabbi-tpl-main-rail__rail">{rail}</aside>
    </div>,
  );
}

export type BentoSpan = 3 | 4 | 6 | 8 | 12;

/** T3 — 12-col bento with container queries. */
export function BentoGrid({children, className = "", container}: Common) {
  return wrap(
    container,
    <div className={["nabbi-tpl-bento", className].filter(Boolean).join(" ")}>
      {children}
    </div>,
  );
}

export function BentoItem({
  span = 12,
  children,
  className = "",
}: {
  span?: BentoSpan;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-span={String(span)}
      className={["min-w-0", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/** T4 — toolbar + chips + list/grid body inside one card. */
export function ToolbarListCard({
  toolbar,
  chips,
  children,
  className = "",
}: {
  toolbar: ReactNode;
  chips?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={["nabbi-tpl-toolbar-list", className]
        .filter(Boolean)
        .join(" ")}>
      <div className="nabbi-tpl-toolbar-list__toolbar">{toolbar}</div>
      {chips ? (
        <div className="nabbi-tpl-toolbar-list__chips">{chips}</div>
      ) : null}
      <div className="nabbi-tpl-toolbar-list__body">{children}</div>
    </section>
  );
}

/** T5 — tabs + grid (Configuración). */
export function TabsGridLayout({children, className = "", container}: Common) {
  return wrap(
    container,
    <div
      className={["nabbi-tpl-tabs-grid", className].filter(Boolean).join(" ")}>
      {children}
    </div>,
  );
}

/** Sticky rail card shell. */
export function RailCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["nabbi-rail-card", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
