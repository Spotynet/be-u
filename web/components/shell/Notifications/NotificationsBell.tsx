"use client";

import {useEffect, useId, useRef, useState} from "react";
import {BellIcon} from "@heroicons/react/24/outline";
import {useNotifications} from "@/features/notifications";
import {useOverlay} from "@/components/shell/overlay";
import {CountBadge} from "../CountBadge";
import {TOPBAR_BTN_ACTIVE, TOPBAR_BTN_ICON} from "../TopbarButton";
import {NotificationsPopover} from "./NotificationsPopover";

type Props = {
  /** Force compact (dot) badge — rail / tight spaces only (not search-related). */
  compact?: boolean;
  className?: string;
  /**
   * When false, render the trigger only (no portal). Use for CSS-hidden
   * breakpoint twins — prefer unmounting instead.
   */
  mountPopover?: boolean;
};

export function NotificationsBell({
  compact = false,
  className = "",
  mountPopover = true,
}: Props) {
  const {unreadCount} = useNotifications();
  const {open, setOpen, onClose, isOwner} = useOverlay("notifications", {
    claim: mountPopover,
  });
  const [ring, setRing] = useState(false);
  const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
  const viaKeyboardRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const prevUnread = useRef(unreadCount);
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const liveTimer = useRef<number | null>(null);
  const panelId = useId();
  const useDot = compact;
  const canPortal = mountPopover && isOwner;

  useEffect(() => {
    if (unreadCount > prevUnread.current && unreadCount > 0) {
      setRing(true);
      const t = window.setTimeout(() => setRing(false), 450);
      if (liveTimer.current != null) window.clearTimeout(liveTimer.current);
      liveTimer.current = window.setTimeout(() => {
        if (liveRef.current) {
          liveRef.current.textContent = `Tienes ${unreadCount} avisos nuevos`;
        }
      }, 500);
      prevUnread.current = unreadCount;
      return () => {
        window.clearTimeout(t);
        if (liveTimer.current != null) window.clearTimeout(liveTimer.current);
      };
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  return (
    <>
      <span ref={liveRef} className="sr-only" aria-live="polite" />
      <span
        className={`nabbi-badge-anchor nabbi-badge-anchor--topbar ${className}`.trim()}>
        <button
          ref={triggerRef}
          type="button"
          id={panelId}
          className={[TOPBAR_BTN_ICON, open && canPortal ? TOPBAR_BTN_ACTIVE : ""]
            .filter(Boolean)
            .join(" ")}
          aria-label={
            unreadCount > 0 ? `Avisos, ${unreadCount} sin leer` : "Avisos"
          }
          aria-expanded={open && canPortal}
          aria-haspopup="dialog"
          aria-controls={open && canPortal ? `${panelId}-panel` : undefined}
          onPointerDown={() => {
            viaKeyboardRef.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              viaKeyboardRef.current = true;
            }
          }}
          onClick={() => {
            setOpenedByKeyboard(viaKeyboardRef.current);
            setOpen(!open);
          }}>
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
          variant={useDot ? "dot" : "pill"}
          placement="corner"
          ringClassName="ring-card"
        />
      </span>

      {canPortal ? (
        <NotificationsPopover
          open={open}
          onClose={onClose}
          triggerRef={triggerRef}
          openedByKeyboard={openedByKeyboard}
        />
      ) : null}
    </>
  );
}
