"use client";

/**
 * Same Filtros badge — expands in place into a floating card; collapses back.
 */

import {useEffect, useId, useRef} from "react";
import {
  AdjustmentsHorizontalIcon,
  BuildingStorefrontIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {MAIN_CATEGORIES} from "@/constants/categories";
import {Switch} from "@/components/ui/Switch";
import {
  EXPLORE_RADIUS_POPOVER,
  type ExploreProfileType,
  type ExploreResultsApi,
} from "@/features/explore";

type Props = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  api: ExploreResultsApi;
};

const CHIP =
  "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[color:var(--hairline)] bg-transparent px-2.5 text-[12px] font-medium text-foreground hover:bg-surface-hover";
const CHIP_ON =
  "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[color:var(--accent-fill-border)] bg-[color:var(--accent-fill)] px-2.5 text-[12px] font-medium text-primary-foreground";

export function ExploreFiltersBadge({
  expanded,
  onExpandedChange,
  api,
}: Props) {
  const panelId = useId();
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
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExpandedChange(false);
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t || rootRef.current?.contains(t)) return;
      onExpandedChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [expanded, onExpandedChange]);

  const active = activeFilterCount > 0;
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
      className="nabbi-explore-filters-badge"
      data-expanded={expanded ? "on" : "off"}>
      <button
        type="button"
        className={[
          "nabbi-explore-filters-trigger",
          active ? "is-active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => onExpandedChange(!expanded)}>
        <AdjustmentsHorizontalIcon className="h-[18px] w-[18px]" aria-hidden />
        Filtros
        {active ? (
          <span className="nabbi-explore-filters-trigger__count">
            {activeFilterCount}
          </span>
        ) : null}
        {expanded ? (
          <ChevronUpIcon className="h-4 w-4 opacity-70" aria-hidden />
        ) : (
          <ChevronDownIcon className="h-4 w-4 opacity-70" aria-hidden />
        )}
      </button>

      {expanded ? (
        <div
          id={panelId}
          className="nabbi-explore-filters-badge__panel"
          role="region"
          aria-label="Opciones de filtros">
          <div className="nabbi-explore-filters-badge__row">
            <span className="nabbi-explore-filters-badge__label">Tipo</span>
            <button
              type="button"
              aria-pressed={typeSel.pro}
              onClick={() => setTypePair(!typeSel.pro, typeSel.place)}
              className={typeSel.pro ? CHIP_ON : CHIP}>
              {typeSel.pro ? (
                <CheckIcon className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <UserIcon className="h-3.5 w-3.5" aria-hidden />
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
                <BuildingStorefrontIcon className="h-3.5 w-3.5" aria-hidden />
              )}
              Lugares
            </button>
          </div>

          <div className="nabbi-explore-filters-badge__row">
            <span className="nabbi-explore-filters-badge__label">
              Categorías
            </span>
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
          </div>

          <div className="nabbi-explore-filters-badge__row">
            <label className="nabbi-explore-filters-badge__nearby">
              <span>Cerca de mí</span>
              <Switch
                checked={nearbyOn}
                disabled={
                  loc.status === "locating" || loc.status === "denied"
                }
                onCheckedChange={(on) => {
                  if (on) enableNearby();
                  else disableNearby();
                }}
              />
            </label>
            {nearbyOn
              ? EXPLORE_RADIUS_POPOVER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={loc.radiusKm === r}
                    onClick={() => setRadiusDebounced(r)}
                    className={loc.radiusKm === r ? CHIP_ON : CHIP}>
                    {r} km
                  </button>
                ))
              : null}
          </div>

          <div className="nabbi-explore-filters-badge__footer">
            <button
              type="button"
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              className="nabbi-explore-filters-badge__reset">
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => onExpandedChange(false)}
              className="nabbi-explore-filters-badge__done">
              Listo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
