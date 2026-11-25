"use client";

import {UserMenu} from "@/components/shell/UserMenu";

type Props = {
  /** Icons-only rail (avatar only). */
  collapsed: boolean;
  className?: string;
  mountPopover?: boolean;
  /**
   * When true, shows a subtle active affordance on the user block
   * (2px yellow ring on the avatar + yellow dot on the more icon / rail).
   * Driven by `isAccountPath(pathname)` — account routes no longer have a
   * sidebar nav item highlight.
   */
  active?: boolean;
};

/** User row — opens the shared UserMenu upward (portal). */
export function SidebarUserBlock({
  collapsed,
  className = "",
  mountPopover = true,
  active = false,
}: Props) {
  return (
    <UserMenu
      tone="on-dark"
      variant={collapsed ? "rail" : "sidebar"}
      placement="top"
      className={className}
      mountPopover={mountPopover}
      active={active}
    />
  );
}
