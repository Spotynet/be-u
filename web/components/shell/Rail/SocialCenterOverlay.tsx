"use client";

import {useEffect, useRef} from "react";
import {SocialCenter} from "./SocialCenter";
import {useRail} from "./RailProvider";
import {RAIL_PANEL_ID} from "@/components/shell/rail-config";
import {PanelSurface} from "@/components/shell/PanelSurface";

/**
 * State C — floating non-modal panel (1024–1279). Does not push content.
 */
export function SocialCenterOverlay() {
  const {
    mode,
    closeOverlay,
    pendingSection,
    clearPendingSection,
    focusSection,
  } = useRail();
  const panelRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = mode === "overlay";

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const heading = panelRef.current?.querySelector<HTMLElement>(
      "#centro-social-title, h2",
    );
    heading?.focus({preventScroll: true});

    if (pendingSection) {
      const t = window.setTimeout(() => {
        focusSection(pendingSection);
        clearPendingSection();
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [open, pendingSection, focusSection, clearPendingSection]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeOverlay();
        triggerRef.current?.focus?.();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (panelRef.current?.contains(t)) return;
      const el = t as HTMLElement;
      if (el.closest?.("[data-rail-keep-open]")) return;
      closeOverlay();
      triggerRef.current?.focus?.();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, closeOverlay]);

  if (!open) return null;

  return (
    <PanelSurface
      as="aside"
      ref={panelRef}
      id={RAIL_PANEL_ID}
      className="nabbi-social-overlay"
      scroll={false}
      aria-label="Centro social"
      data-rail-keep-open>
      <SocialCenter mode="overlay" onClose={closeOverlay} />
    </PanelSurface>
  );
}
