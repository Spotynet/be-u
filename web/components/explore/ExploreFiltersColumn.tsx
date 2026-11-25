"use client";

import {useMemo, useState} from "react";
import {
  CheckIcon,
  BuildingStorefrontIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {MAIN_CATEGORIES} from "@/constants/categories";
import {Switch} from "@/components/ui/Switch";
import {Button} from "@/components/ui/Button";
import {
  EXPLORE_RADIUS_POPOVER,
  type ExploreProfileType,
  type ExploreResultsApi,
} from "@/features/explore";

type Props = {
  api: ExploreResultsApi;
  onCollapse?: () => void;
  variant?: "column" | "sheet";
  onApplySheet?: () => void;
};

const TYPE_BTN =
  "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-transparent px-2 text-[13px] font-medium text-foreground";
const TYPE_BTN_ON =
  "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-[color:var(--accent-fill-border)] bg-[color:var(--accent-fill)] px-2 text-[13px] font-medium text-primary-foreground";

export function ExploreFiltersColumn({
  api,
  onCollapse,
  variant = "column",
  onApplySheet,
}: Props) {
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

  const [catsExpanded, setCatsExpanded] = useState(false);
  const visibleCats = catsExpanded
    ? MAIN_CATEGORIES
    : MAIN_CATEGORIES.slice(0, 5);
  const hasMoreCats = MAIN_CATEGORIES.length > 5;

  const typeSel = useMemo(() => {
    if (profileType === "PROFESSIONAL") return {pro: true, place: false};
    if (profileType === "PLACE") return {pro: false, place: true};
    return {pro: false, place: false};
  }, [profileType]);

  const setTypePair = (pro: boolean, place: boolean) => {
    let next: ExploreProfileType = "";
    if (pro && !place) next = "PROFESSIONAL";
    else if (place && !pro) next = "PLACE";
    setProfileType(next);
  };

  const nearbyOn = locationMode === "nearby";
  const radiusIdx = Math.max(
    0,
    EXPLORE_RADIUS_POPOVER.indexOf(
      (EXPLORE_RADIUS_POPOVER.includes(loc.radiusKm as 1)
        ? loc.radiusKm
        : 5) as 1 | 5 | 10 | 25,
    ),
  );

  return (
    <aside
      className={
        variant === "column"
          ? "nabbi-explore-filters"
          : "nabbi-explore-filters nabbi-explore-filters--sheet"
      }
      aria-label="Filtros">
      <div className="nabbi-explore-filters__head">
        <h2 className="m-0 text-[15px] font-semibold text-foreground">Filtros</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={activeFilterCount === 0}
            onClick={clearFilters}
            className="px-2 text-[13px] font-semibold text-foreground-secondary disabled:opacity-40">
            Restablecer
          </button>
          {onCollapse ? (
            <button
              type="button"
              aria-label="Ocultar filtros"
              onClick={onCollapse}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-hover">
              <XMarkIcon className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="nabbi-explore-filters__body">
        <section className="nabbi-explore-filters__section">
          <h3 className="mb-3 m-0 text-[14px] font-semibold text-foreground">
            Tipo
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={typeSel.pro}
              onClick={() => setTypePair(!typeSel.pro, typeSel.place)}
              className={typeSel.pro ? TYPE_BTN_ON : TYPE_BTN}>
              {typeSel.pro ? (
                <CheckIcon className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <UserIcon className="h-[18px] w-[18px]" aria-hidden />
              )}
              Profesionales
            </button>
            <button
              type="button"
              aria-pressed={typeSel.place}
              onClick={() => setTypePair(typeSel.pro, !typeSel.place)}
              className={typeSel.place ? TYPE_BTN_ON : TYPE_BTN}>
              {typeSel.place ? (
                <CheckIcon className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <BuildingStorefrontIcon className="h-[18px] w-[18px]" aria-hidden />
              )}
              Lugares
            </button>
          </div>
        </section>

        <section className="nabbi-explore-filters__section">
          <h3 className="mb-3 m-0 text-[14px] font-semibold text-foreground">
            Categorías
          </h3>
          <ul className="m-0 flex list-none flex-col gap-0 p-0">
            {visibleCats.map((c) => {
              const checked = categories.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={checked}
                    onClick={() =>
                      setCategories((prev) =>
                        checked
                          ? prev.filter((x) => x !== c.id)
                          : [...prev, c.id],
                      )
                    }
                    className="flex h-9 w-full items-center justify-between gap-3 rounded-[var(--r-control)] px-1 text-left text-[13px] font-medium text-foreground hover:bg-surface-hover">
                    {c.name}
                    <span
                      className={
                        checked
                          ? "nabbi-explore-check is-checked"
                          : "nabbi-explore-check"
                      }
                      aria-hidden>
                      {checked ? (
                        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {hasMoreCats ? (
            <button
              type="button"
              className="mt-2 text-[13px] font-semibold text-foreground-secondary"
              onClick={() => setCatsExpanded((v) => !v)}>
              {catsExpanded ? "Ver menos" : "Ver todas"}
            </button>
          ) : null}
        </section>

        <section className="nabbi-explore-filters__section">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="m-0 text-[14px] font-semibold text-foreground">
              Cerca de mí
            </h3>
            <Switch
              checked={nearbyOn}
              disabled={loc.status === "locating" || loc.status === "denied"}
              onCheckedChange={(on) => {
                if (on) enableNearby();
                else disableNearby();
              }}
            />
          </div>
          {loc.status === "denied" ? (
            <p className="m-0 text-[12px] text-error">
              Permite la ubicación en el navegador para usar este filtro.
            </p>
          ) : null}
        </section>

        <section className="nabbi-explore-filters__section">
          <h3 className="mb-1 m-0 text-[14px] font-semibold text-foreground">
            Distancia
          </h3>
          {!nearbyOn ? (
            <p className="m-0 text-[12px] text-foreground-muted">
              Activa Cerca de mí
            </p>
          ) : (
            <div>
              <div className="mb-2 text-center text-[12px] font-bold tabular-nums text-foreground">
                {EXPLORE_RADIUS_POPOVER[radiusIdx]} km
              </div>
              <input
                type="range"
                role="slider"
                min={0}
                max={EXPLORE_RADIUS_POPOVER.length - 1}
                step={1}
                disabled={!nearbyOn}
                value={radiusIdx}
                aria-valuemin={1}
                aria-valuemax={25}
                aria-valuenow={EXPLORE_RADIUS_POPOVER[radiusIdx]}
                aria-valuetext={`${EXPLORE_RADIUS_POPOVER[radiusIdx]} kilómetros`}
                onChange={(e) => {
                  const i = Number(e.target.value);
                  setRadiusDebounced(EXPLORE_RADIUS_POPOVER[i] ?? 5);
                }}
                className="nabbi-explore-range w-full"
              />
              <div className="mt-1 flex justify-between text-[11px] text-foreground-muted">
                <span>1 km</span>
                <span>25 km</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {variant === "sheet" ? (
        <div className="nabbi-explore-filters__footer">
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Restablecer
          </Button>
          <Button type="button" onClick={onApplySheet}>
            Ver resultados
          </Button>
        </div>
      ) : activeFilterCount > 0 ? (
        <div className="nabbi-explore-filters__footer">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={clearFilters}>
            Restablecer ({activeFilterCount})
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
