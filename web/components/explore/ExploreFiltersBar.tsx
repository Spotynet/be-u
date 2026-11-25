"use client";

/**
 * Floating horizontal filters card — spans the top of the map when open.
 */

import {useEffect, useId, useRef} from "react";
import {
  BuildingStorefrontIcon,
  CheckIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {MAIN_CATEGORIES} from "@/constants/categories";
import {Switch} from "@/components/ui/Switch";
import {
  EXPLORE_RADIUS_POPOVER,
  type ExploreProfileType,
  type ExploreResultsApi,
} from "@/features/explore";

type Props = {
  open: boolean;
  onClose: () => void;
  api: ExploreResultsApi;
};

const CHIP =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-transparent px-3 text-[13px] font-medium text-foreground hover:bg-surface-hover";
const CHIP_ON =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--accent-fill-border)] bg-[color:var(--accent-fill)] px-3 text-[13px] font-medium text-primary-foreground";

export function ExploreFiltersBar({open, onClose, api}: Props) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const {
    categories,
    setCategories,
    profileType,
    setProfileType,
    loc,
    locationMode,
    enableNearby,
    disableNearby,
    setRadiusDebounced,
    clearFilters,
    activeFilterCount,
  } = api;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    rootRef.current
      ?.querySelector<HTMLElement>("button,input,[role='switch']")
      ?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const typeSel = {
    pro: profileType === "PROFESSIONAL",
    place: profileType === "PLACE",
  };
  const setTypePair = (pro: boolean, place: boolean) => {
    let next: ExploreProfileType = "";
    if (pro && !place) next = "PROFESSIONAL";
    else if (place && !pro) next = "PLACE";
    setProfileType(next);
  };

  const nearbyOn = locationMode === "nearby";

  return (
    <div
      ref={rootRef}
      className="nabbi-explore-filters-bar"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}>
      <div className="nabbi-explore-filters-bar__card">
        <div className="nabbi-explore-filters-bar__lead">
          <h2 id={titleId} className="nabbi-explore-filters-bar__title">
            Filtros
          </h2>
          <button
            type="button"
            disabled={activeFilterCount === 0}
            onClick={clearFilters}
            className="nabbi-explore-filters-bar__reset">
            Restablecer
          </button>
        </div>

        <div className="nabbi-explore-filters-bar__scroll" role="group" aria-label="Filtros">
          <span className="nabbi-explore-filters-bar__label">Tipo</span>
          <button
            type="button"
            aria-pressed={typeSel.pro}
            onClick={() => setTypePair(!typeSel.pro, typeSel.place)}
            className={typeSel.pro ? CHIP_ON : CHIP}>
            {typeSel.pro ? (
              <CheckIcon className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <UserIcon className="h-4 w-4" aria-hidden />
            )}
            Profesionales
          </button>
          <button
            type="button"
            aria-pressed={typeSel.place}
            onClick={() => setTypePair(typeSel.pro, !typeSel.place)}
            className={typeSel.place ? CHIP_ON : CHIP}>
            {typeSel.place ? (
              <CheckIcon className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <BuildingStorefrontIcon className="h-4 w-4" aria-hidden />
            )}
            Lugares
          </button>

          <span className="nabbi-explore-filters-bar__sep" aria-hidden />

          <span className="nabbi-explore-filters-bar__label">Categorías</span>
          {MAIN_CATEGORIES.map((c) => {
            const checked = categories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={checked}
                onClick={() =>
                  setCategories((prev) =>
                    checked
                      ? prev.filter((x) => x !== c.id)
                      : [...prev, c.id],
                  )
                }
                className={checked ? CHIP_ON : CHIP}>
                {checked ? (
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                ) : null}
                {c.name}
              </button>
            );
          })}

          <span className="nabbi-explore-filters-bar__sep" aria-hidden />

          <label className="nabbi-explore-filters-bar__nearby">
            <span className="text-[13px] font-medium text-foreground">
              Cerca de mí
            </span>
            <Switch
              checked={nearbyOn}
              disabled={loc.status === "locating" || loc.status === "denied"}
              onCheckedChange={(on) => {
                if (on) enableNearby();
                else disableNearby();
              }}
            />
          </label>

          {nearbyOn ? (
            <>
              <span className="nabbi-explore-filters-bar__label">Distancia</span>
              {EXPLORE_RADIUS_POPOVER.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={loc.radiusKm === r}
                  onClick={() => setRadiusDebounced(r)}
                  className={loc.radiusKm === r ? CHIP_ON : CHIP}>
                  {r} km
                </button>
              ))}
            </>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Cerrar filtros"
          onClick={onClose}
          className="nabbi-explore-filters-bar__close">
          <XMarkIcon className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
