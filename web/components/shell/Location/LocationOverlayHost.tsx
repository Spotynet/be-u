"use client";

import {useEffect, useRef} from "react";
import {useOverlay} from "@/components/shell/overlay";
import {useLocationFilter} from "@/components/shell/useLocationFilter";
import {LocationPopover} from "./LocationPopover";

/**
 * Mobile-only portal owner for location. Listens to `popoverNonce` (Explorar
 * chip) and owns the HeaderPopover while drawer/topbar triggers only toggle
 * shared open state (`mountPopover={false}`).
 */
export function LocationOverlayHost() {
  const loc = useLocationFilter();
  const {open, setOpen, onClose, isOwner} = useOverlay("location");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const lastNonce = useRef(loc.popoverNonce);

  useEffect(() => {
    if (loc.popoverNonce !== lastNonce.current) {
      lastNonce.current = loc.popoverNonce;
      setOpen(true);
    }
  }, [loc.popoverNonce, setOpen]);

  if (!isOwner) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
      />
      <LocationPopover open={open} onClose={onClose} triggerRef={triggerRef} />
    </>
  );
}
