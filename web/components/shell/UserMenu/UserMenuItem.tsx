"use client";

import type {ComponentType, CSSProperties, SVGProps} from "react";
import Link from "next/link";
import {ChevronRightIcon} from "@heroicons/react/24/outline";

type Props = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active?: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
  style?: CSSProperties;
};

function formatBadge(n: number): string {
  return n > 99 ? "99+" : String(n);
}

export function UserMenuItem({
  href,
  label,
  icon: Icon,
  active = false,
  badgeCount = 0,
  onNavigate,
  style,
}: Props) {
  return (
    <Link
      href={href}
      role="menuitem"
      aria-current={active ? "page" : undefined}
      style={style}
      onClick={onNavigate}
      className={[
        "nabbi-user-menu__item group/row relative flex w-full items-center no-underline outline-none",
        active ? "nabbi-user-menu__item--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}>
      <span className="nabbi-user-menu__tile flex shrink-0 items-center justify-center">
        <Icon className="nabbi-user-menu__icon" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="nabbi-user-menu__label min-w-0 flex-1 truncate">{label}</span>
      {badgeCount > 0 ? (
        <span className="nabbi-user-menu__count">
          {formatBadge(badgeCount)}
        </span>
      ) : (
        <ChevronRightIcon
          className="nabbi-user-menu__chevron shrink-0 opacity-0 transition-[opacity,transform] duration-150 group-hover/row:translate-x-0.5 group-hover/row:opacity-100 group-focus-visible/row:translate-x-0.5 group-focus-visible/row:opacity-100"
          aria-hidden
        />
      )}
      {active ? (
        <span className="nabbi-user-menu__active-dot" aria-hidden />
      ) : null}
    </Link>
  );
}
