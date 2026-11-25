"use client";

import {useEffect, useState} from "react";
import {usePathname} from "next/navigation";
import {EllipsisHorizontalIcon} from "@heroicons/react/24/outline";
import {NavItem} from "./NavItem";
import {GUEST_MOBILE_NAV, mobileNavForRole, type NavItemConfig} from "./nav-config";

type Props = {
  role?: string | null;
  isAuthenticated: boolean;
  badges?: Partial<Record<string, number>>;
  /** Opens the sidebar drawer ("Más"). */
  onMoreClick?: () => void;
};

export function MobileBottomNav({
  role,
  isAuthenticated,
  badges,
  onMoreClick,
}: Props) {
  const pathname = usePathname() || "";
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      /* Heuristic: keyboard often shrinks visual viewport height. */
      setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const items: NavItemConfig[] = isAuthenticated
    ? mobileNavForRole(role)
    : GUEST_MOBILE_NAV;

  if (!items.length && !onMoreClick) return null;
  if (keyboardOpen) return null;

  const cols = items.length + (onMoreClick ? 1 : 0);

  return (
    <nav
      className="nabbi-bottom-nav z-shell-chrome fixed bottom-0 left-0 right-0 grid border-t border-card-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`}}
      aria-label="Navegación inferior">
      {items.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          pathname={pathname}
          variant="bottom"
          badgeCount={
            item.badgeKey && badges?.[item.badgeKey] ? badges[item.badgeKey]! : 0
          }
        />
      ))}
      {onMoreClick ? (
        <button
          type="button"
          onClick={onMoreClick}
          className="relative inline-flex min-h-11 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-semibold text-foreground-secondary outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          aria-label="Más opciones">
          <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
          <span>Más</span>
        </button>
      ) : null}
    </nav>
  );
}
