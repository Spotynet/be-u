"use client";

import {useEffect, useId, useRef, useState} from "react";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import {Tooltip} from "@/components/ui/Tooltip";
import {
  TOPBAR_BTN_ACTIVE,
  TOPBAR_BTN_BASE,
} from "@/components/shell/TopbarButton";
import {useOverlay} from "@/components/shell/overlay";
import {useLocationFilter} from "@/components/shell/useLocationFilter";
import {LocationPopover} from "./LocationPopover";

const SEEN_KEY = "nabbi:location:seen-v1";

type Props = {
  className?: string;
  /** Drawer: always show label (full width). */
  forceExpanded?: boolean;
  /** When false, trigger only — no portal (breakpoint twin safety). */
  mountPopover?: boolean;
};

function shortLabel(label: string, city: string): string {
  const raw = label || city;
  if (!raw) return "";
  return raw.split(",")[0]?.trim() || raw;
}

/**
 * Topbar location control — single instance in the header cluster.
 * Opens LocationPopover (desktop popover / mobile sheet via HeaderPopover).
 */
export function LocationPill({
  className = "",
  forceExpanded = false,
  mountPopover = true,
}: Props) {
  const loc = useLocationFilter();
  const {open, setOpen, onClose, isOwner} = useOverlay("location", {
    claim: mountPopover,
  });
  const canPortal = mountPopover && isOwner;
  const [pulse, setPulse] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverId = useId();
  const lastNonce = useRef(loc.popoverNonce);

  useEffect(() => {
    if (loc.popoverNonce !== lastNonce.current) {
      lastNonce.current = loc.popoverNonce;
      setOpen(true);
    }
  }, [loc.popoverNonce, setOpen]);

  useEffect(() => {
    if (!loc.hydrated) return;
    if (loc.permission !== "prompt" && loc.permission !== "unknown") return;
    if (loc.coords || loc.city) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
      localStorage.setItem(SEEN_KEY, "1");
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 1600);
      return () => window.clearTimeout(t);
    } catch {
      /* ignore */
    }
  }, [loc.hydrated, loc.permission, loc.coords, loc.city]);

  const place = shortLabel(loc.label, loc.city);
  const denied = loc.permission === "denied";
  const locating = loc.status === "locating";
  const error = loc.status === "error" && !denied;
  const ready = Boolean(loc.coords || loc.city) && loc.hydrated;

  let display = "Ubicación";
  let tip = "Activa tu ubicación para ver servicios cerca de ti";
  let aria = "Ubicación: sin activar. Cambiar";

  if (!loc.hydrated) {
    display = "Ubicación";
    tip = "";
    aria = "Ubicación";
  } else if (locating) {
    display = "Ubicando…";
    tip = "Obteniendo tu ubicación";
    aria = "Ubicación: ubicando";
  } else if (denied) {
    display = "Ubicación bloqueada";
    tip =
      "El acceso está bloqueado. Actívalo en el candado del navegador o elige una ciudad.";
    aria = "Ubicación bloqueada. Cambiar";
  } else if (error) {
    display = "Reintentar";
    tip = loc.geoError || "No pudimos obtener tu ubicación";
    aria = "Error de ubicación. Reintentar";
  } else if (ready) {
    display = place || "Cerca de ti";
    tip = loc.label || loc.city || display;
    aria = loc.enabled
      ? `Ubicación: ${tip}, radio ${loc.radiusKm} km. Cambiar`
      : `Ubicación: ${tip} (cercanos desactivados). Cambiar`;
  }

  const icon = locating ? (
    <ArrowPathIcon
      className="h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none"
      aria-hidden
    />
  ) : denied ? (
    <NoSymbolIcon className="h-5 w-5 shrink-0 text-warning" aria-hidden />
  ) : error ? (
    <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-error" aria-hidden />
  ) : (
    <MapPinIcon
      className={[
        "h-5 w-5 shrink-0",
        ready && loc.enabled ? "text-primary" : "",
      ].join(" ")}
      aria-hidden
    />
  );

  const dot = !loc.hydrated ? (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-muted/40" aria-hidden />
  ) : denied ? (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
  ) : ready && loc.enabled ? (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
  ) : ready ? (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-muted/50" aria-hidden />
  ) : (
    <span
      className={[
        "h-1.5 w-1.5 shrink-0 rounded-full bg-secondary",
        pulse
          ? "animate-[nabbi-loc-pulse_0.7s_ease-out_2] motion-reduce:animate-none"
          : "",
      ].join(" ")}
      aria-hidden
    />
  );

  const radiusChip =
    ready && loc.hydrated ? (
      <span
        className={[
          "nabbi-location-pill__radius hidden shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums xl:inline-flex",
          loc.enabled
            ? "bg-primary/15 text-foreground"
            : "bg-foreground-muted/15 text-foreground-muted",
        ].join(" ")}>
        {loc.radiusKm} km
      </span>
    ) : null;

  const labelEl = (
    <span
      className={[
        "nabbi-location-pill__label",
        forceExpanded
          ? "min-w-0 max-w-[160px] truncate"
          : "hidden min-w-0 max-w-[160px] truncate xl:inline",
      ].join(" ")}>
      {loc.hydrated ? display : "······"}
    </span>
  );

  const button = (
    <button
      ref={triggerRef}
      type="button"
      id={popoverId}
      onClick={() => setOpen(!open)}
      className={[
        TOPBAR_BTN_BASE,
        "nabbi-location-pill overflow-visible",
        open && canPortal ? TOPBAR_BTN_ACTIVE : "",
        forceExpanded
          ? "w-full max-w-none justify-start px-3.5 text-[13px] font-semibold"
          : "w-11 px-0 lg:w-auto lg:max-w-[200px] lg:px-3 xl:max-w-[220px] xl:px-3.5 xl:text-[13px] xl:font-semibold",
        !loc.hydrated ? "min-w-11" : "",
        className,
      ].join(" ")}
      aria-expanded={open && canPortal}
      aria-haspopup="dialog"
      aria-controls={open && canPortal ? `${popoverId}-panel` : undefined}
      aria-label={aria}>
      {icon}
      {labelEl}
      {radiusChip}
      <span
        className={
          forceExpanded ? "inline-flex" : "hidden lg:inline-flex xl:inline-flex"
        }>
        {dot}
      </span>
    </button>
  );

  return (
    <>
      {tip && loc.hydrated ? (
        <Tooltip content={tip} side="bottom" delay={400} className="inline-flex">
          {button}
        </Tooltip>
      ) : (
        button
      )}
      {canPortal ? (
        <LocationPopover
          open={open}
          onClose={onClose}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}
