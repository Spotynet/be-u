"use client";

import Link from "next/link";
import type {NavItemConfig} from "./nav-config";
import {isNavActive} from "./nav-config";

type Variant = "top" | "sidebar" | "rail" | "bottom";

type Props = {
  item: NavItemConfig;
  pathname: string;
  variant: Variant;
  badgeCount?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Soft pill nav on dark frame (CLIENT). */
  tone?: "on-dark" | "on-panel";
};

function formatBadge(n: number): string {
  return n > 9 ? "9+" : String(n);
}

export function NavItem({
  item,
  pathname,
  variant,
  badgeCount = 0,
  collapsed = false,
  onNavigate,
}: Props) {
  const active = !item.comingSoon && isNavActive(pathname, item);
  const Icon = active && item.iconActive ? item.iconActive : item.icon;
  const showBadge = badgeCount > 0;
  const label =
    item.shortLabel && (variant === "bottom" || collapsed)
      ? item.shortLabel
      : item.label;

  const badgeInline = showBadge ? (
    <span
      className={[
        "inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-error-foreground",
        variant === "sidebar" || variant === "rail" ? "ml-auto" : "",
      ]
        .filter(Boolean)
        .join(" ")}>
      {formatBadge(badgeCount)}
    </span>
  ) : null;

  /** Corner dot/pill on the icon tile — never overlaps the glyph. */
  const badgeCorner =
    showBadge && variant === "bottom" ? (
      <span
        aria-hidden
        className="nabbi-badge-corner nabbi-badge-corner--pill pointer-events-none inline-flex min-w-[var(--badge-pill-size)] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-error-foreground ring-2 ring-card">
        {formatBadge(badgeCount)}
      </span>
    ) : null;

  const pronto =
    item.comingSoon && variant !== "bottom" ? (
      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
        Pronto
      </span>
    ) : null;

  if (item.comingSoon) {
    return (
      <span
        aria-disabled="true"
        title="Próximamente"
        className={[
          "nav-item nav-item--soon relative flex cursor-not-allowed items-center gap-2.5",
          variant === "top" &&
            "h-10 rounded-full px-4 text-[14px] font-medium text-white/40",
          variant === "sidebar" &&
            "h-11 rounded-[14px] px-3 text-[14px] font-medium text-white/40",
          variant === "rail" &&
            "h-11 justify-center rounded-[14px] text-white/40",
          variant === "bottom" &&
            "flex-col justify-center gap-0.5 px-0.5 py-2 text-[10px] font-semibold text-foreground-muted opacity-55",
        ]
          .filter(Boolean)
          .join(" ")}>
        {variant === "sidebar" || variant === "rail" ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/5">
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
        ) : (
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        )}
        {variant !== "rail" ? <span className="truncate">{label}</span> : null}
        {pronto}
      </span>
    );
  }

  if (variant === "top") {
    return (
      <Link
        href={item.href}
        className={[
          "nav-item relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium no-underline outline-none transition-[background-color,color] duration-150",
          "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]",
          "motion-reduce:transition-none",
          active
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        ].join(" ")}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}>
        <span className="relative inline-flex">
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {active ? (
            <span
              className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-secondary"
              aria-hidden
            />
          ) : null}
        </span>
        <span className="truncate">{label}</span>
        {badgeInline}
      </Link>
    );
  }

  if (variant === "sidebar" || variant === "rail") {
    const rail = variant === "rail";
    return (
      <Link
        href={item.href}
        className={[
          "nav-item relative inline-flex h-11 w-full items-center gap-2.5 rounded-[14px] no-underline outline-none transition-[background-color,color] duration-150",
          "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]",
          "motion-reduce:transition-none",
          rail ? "justify-center px-0" : "px-2.5",
          active
            ? "border border-white/10 bg-white/15 text-white"
            : "border border-transparent text-white/80 hover:bg-white/10 hover:text-white",
        ].join(" ")}
        aria-current={active ? "page" : undefined}
        aria-label={
          rail
            ? showBadge
              ? `${item.label}, ${formatBadge(badgeCount)} sin leer`
              : item.label
            : undefined
        }
        title={rail ? item.label : undefined}
        onClick={onNavigate}>
        <span
          className={[
            "nabbi-badge-anchor nabbi-badge-anchor--nav-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
            active ? "bg-secondary/20 text-secondary" : "bg-white/5 text-white/80",
          ].join(" ")}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
          {rail && showBadge ? (
            <span
              aria-hidden
              className="nabbi-badge-corner nabbi-badge-corner--dot rounded-full bg-error ring-2 ring-[var(--shell-frame-mid)]"
            />
          ) : null}
        </span>
        {!rail ? <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{label}</span> : null}
        {!rail ? badgeInline : null}
      </Link>
    );
  }

  /* bottom — corner pill on icon, sibling structure via anchor */
  return (
    <Link
      href={item.href}
      className={[
        "nav-item relative inline-flex min-h-11 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] no-underline outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
        "motion-reduce:transition-none",
        active
          ? "font-bold text-secondary"
          : "font-semibold text-foreground-secondary",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
      aria-label={
        showBadge ? `${label}, ${formatBadge(badgeCount)} sin leer` : undefined
      }
      onClick={onNavigate}>
      <span className="nabbi-badge-anchor nabbi-badge-anchor--icon-flush inline-flex">
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        {badgeCorner}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
