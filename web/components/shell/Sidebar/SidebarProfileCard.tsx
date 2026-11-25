"use client";

import {ProfileHero} from "./profile/ProfileHero";

type Props = {
  collapsed: boolean;
  mountPopover?: boolean;
  active?: boolean;
  className?: string;
};

/**
 * Sidebar profile hero (social-style) — wraps ProfileHero.
 * Menu opens the existing UserMenu (CUENTA / AYUDA / APARIENCIA / logout).
 */
export function SidebarProfileCard({
  collapsed,
  mountPopover = true,
  active = false,
  className = "",
}: Props) {
  return (
    <ProfileHero
      variant={collapsed ? "rail" : "full"}
      mountPopover={mountPopover}
      active={active}
      className={className}
    />
  );
}
