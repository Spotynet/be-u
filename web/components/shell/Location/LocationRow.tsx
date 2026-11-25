"use client";

import {useEffect, useRef} from "react";
import {MapPinIcon} from "@heroicons/react/24/outline";
import {useOverlay} from "@/components/shell/overlay";
import {useLocationFilter} from "@/components/shell/useLocationFilter";
import {LocationPopover} from "./LocationPopover";

/**
 * Compact location row for drawer / mobile chrome.
 * Opens the same LocationPopover (bottom sheet on coarse/narrow).
 * Only mounted while the drawer is open — sole location owner on mobile.
 */
export function LocationRow({className = ""}: {className?: string}) {
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

  const place = (loc.label || loc.city || "").split(",")[0]?.trim();
  const label = !loc.hydrated
    ? "Ubicación"
    : loc.permission === "denied"
      ? "Ubicación bloqueada"
      : loc.status === "locating"
        ? "Ubicando…"
        : place
          ? `${place} · ${loc.radiusKm} km`
          : "Activar ubicación";

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-11 w-full items-center gap-2 rounded-xl border border-card-border bg-card px-3 text-[13px] font-semibold text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open && isOwner}
        aria-haspopup="dialog"
        aria-label={`Ubicación: ${label}`}>
        <MapPinIcon
          className={[
            "h-5 w-5 shrink-0",
            loc.enabled && place ? "text-primary" : "text-foreground-secondary",
          ].join(" ")}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        {place && loc.enabled ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
        ) : !place ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
        ) : null}
      </button>
      {isOwner ? (
        <LocationPopover
          open={open}
          onClose={onClose}
          triggerRef={triggerRef}
        />
      ) : null}
    </div>
  );
}
