"use client";

import {useEffect, useId, useRef, useState} from "react";
import {BellIcon} from "@heroicons/react/24/outline";
import {useNotifications} from "@/features/notifications";
import {CountBadge} from "@/components/shell/CountBadge";
import {TOPBAR_BTN_ACTIVE, TOPBAR_BTN_ICON} from "@/components/shell/TopbarButton";
import {RAIL_PANEL_ID} from "@/components/shell/rail-config";
import {useRail, useRailAnnounceCollapsed} from "./RailProvider";

type Props = {
  className?: string;
  mountPopover?: boolean;
};

/**
 * Bell: focus notifications when open/overlay; else open drawer (or overlay at mini band).
 */
export function SocialBell({className = ""}: Props) {
  const {unreadCount} = useNotifications();
  const {
    mode,
    openDrawer,
    openOverlay,
    drawerOpen,
    overlayOpen,
    canOpen,
    canMini,
    isHiddenRoute,
    focusSection,
    setDocked,
  } = useRail();
  const [ring, setRing] = useState(false);
  const viaKeyboardRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const prevUnread = useRef(unreadCount);
  const panelId = useId();

  const collapsed = mode === "mini" || mode === "hidden";
  useRailAnnounceCollapsed(unreadCount, collapsed);

  useEffect(() => {
    if (unreadCount > prevUnread.current && unreadCount > 0) {
      setRing(true);
      const t = window.setTimeout(() => setRing(false), 450);
      prevUnread.current = unreadCount;
      return () => window.clearTimeout(t);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  const expanded = mode === "open" || overlayOpen || drawerOpen;

  const onClick = () => {
    if (mode === "open") {
      focusSection("notifications");
      return;
    }
    if (overlayOpen) {
      focusSection("notifications");
      return;
    }
    if (drawerOpen) {
      focusSection("notifications");
      return;
    }
    if (isHiddenRoute || canMini === false) {
      openDrawer("notifications");
      return;
    }
    if (canOpen === true) {
      setDocked("open");
      window.setTimeout(() => focusSection("notifications"), 200);
      return;
    }
    if (canMini === true) {
      openOverlay("notifications");
      return;
    }
    openDrawer("notifications");
  };

  return (
    <span
      className={["nabbi-badge-anchor nabbi-badge-anchor--topbar", className]
        .filter(Boolean)
        .join(" ")}
      data-rail-keep-open>
      <button
        ref={triggerRef}
        type="button"
        id={panelId}
        className={[TOPBAR_BTN_ICON, expanded ? TOPBAR_BTN_ACTIVE : ""]
          .filter(Boolean)
          .join(" ")}
        aria-label={
          unreadCount > 0 ? `Avisos, ${unreadCount} sin leer` : "Avisos"
        }
        aria-expanded={expanded}
        aria-controls={RAIL_PANEL_ID}
        aria-haspopup={mode === "drawer" || canMini === false ? "dialog" : undefined}
        onPointerDown={() => {
          viaKeyboardRef.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            viaKeyboardRef.current = true;
          }
        }}
        onClick={onClick}>
        <BellIcon
          className={["h-5 w-5 text-primary", ring ? "nabbi-bell--ring" : ""]
            .filter(Boolean)
            .join(" ")}
          strokeWidth={1.85}
          aria-hidden
        />
      </button>
      <CountBadge
        count={unreadCount}
        variant="pill"
        placement="corner"
        ringClassName="ring-card"
      />
    </span>
  );
}
