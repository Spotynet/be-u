"use client";

import Link from "next/link";
import {Tooltip} from "@/components/ui/Tooltip";
import type {NavItemConfig} from "@/components/shell/nav-config";
import {isNavActive} from "@/components/shell/nav-config";

type Props = {
  item: NavItemConfig;
  pathname: string;
  badgeCount?: number;
  /** Icons-only rail (tooltips on). False when pinned or peeking. */
  rail?: boolean;
  /** Child row under a group (smaller, indented). */
  nested?: boolean;
  onNavigate?: () => void;
};

function formatBadge(n: number): string {
  return n > 99 ? "99+" : String(n);
}

/**
 * Frame sidebar nav row — glass pill active + shared sliding indicator (CSS).
 * No icon tiles, no connected-tab curves.
 */
export function SidebarItem({
  item,
  pathname,
  badgeCount = 0,
  rail = false,
  nested = false,
  onNavigate,
}: Props) {
  const active = !item.comingSoon && isNavActive(pathname, item);
  const Icon = active && item.iconActive ? item.iconActive : item.icon;
  const showBadge = badgeCount > 0;
  const tip = [
    item.label,
    showBadge ? `${formatBadge(badgeCount)} sin leer` : null,
    item.comingSoon ? "Disponible pronto" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (item.comingSoon) {
    const soon = (
      <span
        aria-disabled="true"
        className={[
          "nabbi-sidebar-item nabbi-sidebar-item--soon relative flex cursor-not-allowed items-center gap-3",
          rail
            ? "h-12 w-12 justify-center rounded-[var(--r-tile)]"
            : "h-11 w-full rounded-[var(--r-tile)] px-3",
        ].join(" ")}>
        <Icon
          className="nabbi-sidebar-item__icon h-5 w-5 shrink-0 opacity-40"
          strokeWidth={1.75}
          aria-hidden
        />
        {!rail ? (
          <>
            <span className="nabbi-sidebar-item__label min-w-0 flex-1 truncate text-[14px] font-medium opacity-40">
              {item.label}
            </span>
            <span className="rounded-full bg-[var(--glass-1)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
              Pronto
            </span>
          </>
        ) : null}
      </span>
    );
    return rail ? (
      <Tooltip content={tip} side="right" delay={300} className="flex w-full justify-center">
        {soon}
      </Tooltip>
    ) : (
      <Tooltip content="Disponible pronto" side="right" delay={300}>
        {soon}
      </Tooltip>
    );
  }

  const link = (
    <Link
      href={item.href}
      className={[
        "nabbi-sidebar-item group/item relative inline-flex items-center no-underline outline-none",
        nested ? "nabbi-sidebar-item--nested h-9 gap-3 px-3" : "",
        rail
          ? "nabbi-sidebar-item--rail h-12 w-12 justify-center rounded-[var(--r-tile)]"
          : "h-11 w-full gap-3 rounded-[var(--r-tile)] px-3",
        active ? "nabbi-sidebar-item--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-current={active ? "page" : undefined}
      aria-label={rail ? item.label : undefined}
      data-active={active ? "true" : undefined}
      onClick={onNavigate}>
      {/* SSR-safe static indicator fallback (hidden when JS indicator is mounted) */}
      {active ? (
        <span className="nabbi-sidebar-item__indicator-fallback" aria-hidden />
      ) : null}
      <Icon
        className="nabbi-sidebar-item__icon h-5 w-5 shrink-0"
        strokeWidth={1.75}
        aria-hidden
      />
      {!rail ? (
        <>
          <span className="nabbi-sidebar-item__label min-w-0 flex-1 truncate text-[14px] leading-5">
            {item.label}
          </span>
          {showBadge ? (
            <span className="nabbi-sidebar-item__badge inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold tabular-nums leading-none text-secondary-foreground">
              {formatBadge(badgeCount)}
            </span>
          ) : null}
        </>
      ) : showBadge ? (
        <span
          className="nabbi-badge-corner nabbi-badge-corner--dot rounded-full bg-secondary ring-2 ring-[var(--shell-frame-mid)]"
          aria-hidden
        />
      ) : null}
    </Link>
  );

  return rail ? (
    <Tooltip content={tip} side="right" delay={300} className="flex w-full">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
