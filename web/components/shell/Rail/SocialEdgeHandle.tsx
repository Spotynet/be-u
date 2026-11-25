"use client";

import {BellIcon} from "@heroicons/react/24/outline";
import {useSocialCenterOptional} from "./SocialCenterProvider";
import {useRail} from "./RailProvider";

/**
 * 768–1023: slim tab on the right edge of the center panel → opens drawer D.
 */
export function SocialEdgeHandle() {
  const {showEdgeHandle, openDrawer, drawerOpen, panelId} = useRail();
  const social = useSocialCenterOptional();
  const unread = social?.unreadCount ?? 0;

  if (!showEdgeHandle) return null;

  return (
    <button
      type="button"
      className="nabbi-social-edge-handle"
      aria-label={
        unread > 0
          ? `Centro social, ${unread} sin leer`
          : "Centro social"
      }
      aria-expanded={drawerOpen}
      aria-controls={panelId}
      onClick={() => openDrawer()}>
      <span className="nabbi-social-edge-handle__label">Centro social</span>
      <BellIcon className="h-4 w-4 shrink-0" aria-hidden />
      {unread > 0 ? (
        <span className="nabbi-social-edge-handle__badge">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );
}
