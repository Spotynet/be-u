"use client";

import {
  RectangleGroupIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import {TOPBAR_BTN_ACTIVE, TOPBAR_BTN_ICON} from "@/components/shell/TopbarButton";
import {useRail} from "./RailProvider";
import {RAIL_PANEL_ID} from "@/components/shell/rail-config";

/**
 * Topbar: ≥1280 toggles open/mini; 1024–1279 opens overlay C; opt-out → drawer.
 * Hidden below 1024 via showTopbarToggle (except opt-out routes).
 */
export function RailToggleButton({className = ""}: {className?: string}) {
  const {
    showTopbarToggle,
    docked,
    mode,
    canOpen,
    isHiddenRoute,
    toggleDocked,
    overlayOpen,
    drawerOpen,
  } = useRail();

  if (!showTopbarToggle) return null;

  const pressed =
    mode === "open" || overlayOpen || (isHiddenRoute && drawerOpen);
  const label = pressed
    ? "Ocultar centro social"
    : "Mostrar centro social";

  return (
    <button
      type="button"
      data-rail-keep-open
      className={[TOPBAR_BTN_ICON, pressed ? TOPBAR_BTN_ACTIVE : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      aria-pressed={docked === "open" && canOpen === true && !isHiddenRoute}
      aria-expanded={pressed}
      aria-controls={RAIL_PANEL_ID}
      title={label}
      onClick={() => toggleDocked()}>
      {pressed ? (
        <ViewColumnsIcon className="h-5 w-5 text-primary" strokeWidth={1.85} aria-hidden />
      ) : (
        <RectangleGroupIcon
          className="h-5 w-5 text-primary"
          strokeWidth={1.85}
          aria-hidden
        />
      )}
    </button>
  );
}
