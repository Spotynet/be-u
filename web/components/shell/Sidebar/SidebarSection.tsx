"use client";

import type {NavItemConfig, NavSection} from "@/components/shell/nav-config";
import {isNavActive, isNavGroup} from "@/components/shell/nav-config";
import {SidebarGroup} from "./SidebarGroup";
import {SidebarItem} from "./SidebarItem";

type Props = {
  section: NavSection;
  /** When omitted, no label row and no rail divider. */
  label?: string;
  items: NavItemConfig[];
  pathname: string;
  rail: boolean;
  badges?: Partial<Record<string, number>>;
  onNavigate?: () => void;
  groupIsOpen: (key: string, fallback?: boolean) => boolean;
  onGroupOpenChange: (key: string, open: boolean) => void;
  onRailGroupActivate?: (key: string) => void;
};

export function SidebarSection({
  section,
  label,
  items,
  pathname,
  rail,
  badges,
  onNavigate,
  groupIsOpen,
  onGroupOpenChange,
  onRailGroupActivate,
}: Props) {
  return (
    <div data-section={section}>
      {label ? (
        rail ? (
          <div
            className="mx-auto my-3 h-px w-6 bg-[var(--hairline-dark-surface)]"
            role="separator"
            aria-hidden
          />
        ) : (
          <p className="nabbi-micro-label mb-2 px-3 text-white/45">
            {label}
          </p>
        )
      ) : null}
      <ul className="nabbi-sidebar__nav-list flex flex-col gap-1">
        {items.map((item) => {
          if (isNavGroup(item)) {
            const childActive = isNavActive(pathname, item);
            return (
              <li key={item.key} className={rail ? "w-full" : ""}>
                <SidebarGroup
                  item={item}
                  pathname={pathname}
                  rail={rail}
                  open={groupIsOpen(item.key, childActive)}
                  onOpenChange={(open) => onGroupOpenChange(item.key, open)}
                  onRailActivate={() => onRailGroupActivate?.(item.key)}
                  badges={badges}
                  onNavigate={onNavigate}
                />
              </li>
            );
          }
          const count =
            item.badgeKey && badges?.[item.badgeKey]
              ? badges[item.badgeKey]!
              : 0;
          return (
            <li key={item.key} className={rail ? "w-full" : ""}>
              <SidebarItem
                item={item}
                pathname={pathname}
                badgeCount={count}
                rail={rail}
                onNavigate={onNavigate}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
