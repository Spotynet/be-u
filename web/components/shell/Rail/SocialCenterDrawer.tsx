"use client";

import {useEffect, useId, useRef} from "react";
import {createPortal} from "react-dom";
import {RAIL_PANEL_ID} from "@/components/shell/rail-config";
import {PanelSurface} from "@/components/shell/PanelSurface";
import {SocialCenter} from "./SocialCenter";
import {useRail} from "./RailProvider";

const FOCUSABLE =
  'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * State D — modal right drawer / sheet (&lt;1024 or opt-out routes).
 */
export function SocialCenterDrawer() {
  const {drawerOpen, closeDrawer, pendingSection, clearPendingSection, focusSection} =
    useRail();
  const titleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    if (pendingSection) {
      const t = window.setTimeout(() => {
        focusSection(pendingSection);
        clearPendingSection();
      }, 60);
      void t;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [
    drawerOpen,
    closeDrawer,
    pendingSection,
    clearPendingSection,
    focusSection,
  ]);

  if (!drawerOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="nabbi-social-drawer" role="presentation">
      <button
        type="button"
        className="nabbi-social-drawer__backdrop"
        aria-label="Cerrar centro social"
        onClick={closeDrawer}
      />
      <PanelSurface
        ref={panelRef}
        id={RAIL_PANEL_ID}
        className="nabbi-social-drawer__panel"
        radius="drawer-end"
        scroll={false}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}>
        <span id={titleId} className="sr-only">
          Centro social
        </span>
        <SocialCenter mode="drawer" onClose={closeDrawer} />
      </PanelSurface>
    </div>,
    document.body,
  );
}
