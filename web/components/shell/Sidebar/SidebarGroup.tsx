"use client";

import {useEffect, useId} from "react";
import {ChevronRightIcon} from "@heroicons/react/24/outline";
import {Tooltip} from "@/components/ui/Tooltip";
import type {NavItemConfig} from "@/components/shell/nav-config";
import {isNavActive} from "@/components/shell/nav-config";
import {SidebarItem} from "./SidebarItem";

type Props = {
  item: NavItemConfig & {children: NavItemConfig[]};
  pathname: string;
  rail?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When clicking group icon in rail — request peek + expand. */
  onRailActivate?: () => void;
  badges?: Partial<Record<string, number>>;
  onNavigate?: () => void;
};

export function SidebarGroup({
  item,
  pathname,
  rail = false,
  open,
  onOpenChange,
  onRailActivate,
  badges,
  onNavigate,
}: Props) {
  const listId = useId();
  const childActive = item.children.some((c) => isNavActive(pathname, c));
  const Icon =
    (childActive || open) && item.iconActive ? item.iconActive : item.icon;

  useEffect(() => {
    if (childActive) onOpenChange(true);
  }, [childActive, onOpenChange]);

  if (rail) {
    return (
      <Tooltip content={item.label} side="right" delay={300}>
        <button
          type="button"
          className={[
            "nabbi-sidebar-item nabbi-sidebar-item--rail relative inline-flex h-12 w-12 items-center justify-center rounded-[var(--r-tile)]",
            "outline-none",
            childActive ? "nabbi-sidebar-item--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={item.label}
          aria-expanded={false}
          onClick={() => {
            onOpenChange(true);
            onRailActivate?.();
          }}>
          <Icon
            className="nabbi-sidebar-item__icon h-5 w-5"
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="nabbi-sidebar-group">
      <button
        type="button"
        className={[
          "nabbi-sidebar-item relative inline-flex h-11 w-full items-center gap-3 rounded-[var(--r-tile)] px-3",
          "outline-none",
          childActive ? "nabbi-sidebar-item--active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => onOpenChange(!open)}>
        <Icon
          className="nabbi-sidebar-item__icon h-5 w-5 shrink-0"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="nabbi-sidebar-item__label min-w-0 flex-1 truncate text-left text-[14px] font-medium leading-5">
          {item.label}
        </span>
        <ChevronRightIcon
          className={[
            "h-4 w-4 shrink-0 text-white/50 transition-transform duration-[160ms] motion-reduce:transition-none",
            open ? "rotate-90" : "rotate-0",
          ].join(" ")}
          aria-hidden
        />
      </button>

      <div
        id={listId}
        className={[
          "nabbi-sidebar-group__panel grid transition-[grid-template-rows] duration-[180ms] motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
        {...(!open ? {inert: true as const} : {})}>
        <div className="overflow-hidden">
          <ul
            className="nabbi-sidebar-group__list relative ml-7 border-l border-[var(--hairline-dark-surface)] py-1 pl-3"
            role="list">
            {item.children.map((child) => {
              const count =
                child.badgeKey && badges?.[child.badgeKey]
                  ? badges[child.badgeKey]!
                  : 0;
              return (
                <li key={child.key}>
                  <SidebarItem
                    item={child}
                    pathname={pathname}
                    badgeCount={count}
                    rail={false}
                    nested
                    onNavigate={onNavigate}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
