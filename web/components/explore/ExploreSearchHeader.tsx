"use client";

import {useEffect, useId, useRef, useState} from "react";
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {useAppSearchQuery} from "@/components/shell/SearchBar/useAppSearchQuery";
import {useSearchChrome} from "@/components/shell/SearchBar/SearchChromeContext";
import {Switch} from "@/components/ui/Switch";
import {
  EXPLORE_RADIUS_POPOVER,
  type ExploreResultsApi,
} from "@/features/explore";

type Props = {
  api: ExploreResultsApi;
  activeFilterCount: number;
  filtersDocked: boolean;
  filtersCollapsed: boolean;
  onToggleFilters: () => void;
  onOpenFiltersSheet: () => void;
};

export function ExploreSearchHeader({
  api,
  activeFilterCount,
  filtersDocked,
  filtersCollapsed,
  onToggleFilters,
  onOpenFiltersSheet,
}: Props) {
  const search = useAppSearchQuery();
  const {registerDesktopInput} = useSearchChrome();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const labelId = useId();
  const descId = useId();
  const [locOpen, setLocOpen] = useState(false);
  const locRef = useRef<HTMLDivElement | null>(null);

  const {
    loc,
    locationMode,
    enableNearby,
    disableNearby,
    setRadiusDebounced,
    mapArea,
    clearMapOverride,
  } = api;

  useEffect(() => {
    registerDesktopInput(inputRef.current);
    return () => registerDesktopInput(null);
  }, [registerDesktopInput]);

  useEffect(() => {
    if (!locOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!locRef.current?.contains(e.target as Node)) setLocOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [locOpen]);

  const nearBusy = loc.status === "locating";
  const denied = loc.status === "denied";
  const locValue =
    locationMode === "nearby"
      ? `Cerca de mí · ${loc.radiusKm} km`
      : locationMode === "mapArea"
        ? "Zona del mapa"
        : loc.label || loc.city || "Elegir ubicación";

  const onFiltros = () => {
    if (filtersDocked) onToggleFilters();
    else onOpenFiltersSheet();
  };

  return (
    <div className="nabbi-explore-search-header" role="search">
      <label id={labelId} className="sr-only" htmlFor="explore-search-input">
        Buscar en Explorar
      </label>
      <MagnifyingGlassIcon
        className="h-5 w-5 shrink-0 text-foreground-muted"
        aria-hidden
      />
      <input
        ref={inputRef}
        id="explore-search-input"
        type="search"
        name="q"
        autoComplete="off"
        enterKeyHint="search"
        aria-labelledby={labelId}
        aria-describedby={descId}
        aria-description="Encuentra profesionales y lugares cerca de ti. Reserva en pocos toques."
        placeholder="Buscar profesionales o lugares"
        value={search.value}
        onChange={(e) => search.setQuery(e.target.value)}
        onFocus={() => search.setFocused(true)}
        onBlur={() => search.setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            search.submit();
          }
          if (e.key === "Escape") {
            if (search.value) {
              e.preventDefault();
              search.clear();
            } else {
              (e.target as HTMLInputElement).blur();
            }
          }
        }}
        className="nabbi-explore-search-header__input"
      />
      {search.value ? (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          onClick={() => search.clear()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)]">
          <XMarkIcon className="h-4 w-4" aria-hidden />
        </button>
      ) : null}

      <span className="nabbi-explore-search-header__sep" aria-hidden />

      <div className="relative shrink-0" ref={locRef}>
        <button
          type="button"
          aria-expanded={locOpen}
          aria-haspopup="dialog"
          onClick={() => setLocOpen((v) => !v)}
          className="nabbi-explore-loc-block">
          <span className="nabbi-explore-loc-block__tile" aria-hidden>
            <MapPinIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-foreground-muted">
              Ubicación
            </span>
            <span className="block truncate text-[14px] font-medium text-foreground">
              {nearBusy ? "Localizando..." : locValue}
            </span>
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
        </button>
        {locOpen ? (
          <div
            role="dialog"
            aria-label="Ubicación"
            className="nabbi-explore-loc-pop">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] font-semibold text-foreground">
                Cerca de mí
              </span>
              <Switch
                checked={locationMode === "nearby"}
                disabled={nearBusy || denied}
                onCheckedChange={(on) => {
                  if (on) enableNearby();
                  else disableNearby();
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXPLORE_RADIUS_POPOVER.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={locationMode !== "nearby"}
                  aria-pressed={loc.radiusKm === r}
                  onClick={() => setRadiusDebounced(r)}
                  className={
                    loc.radiusKm === r && locationMode === "nearby"
                      ? "inline-flex h-9 items-center rounded-full bg-[color:var(--accent-fill)] px-3 text-[13px] font-semibold text-primary-foreground"
                      : "inline-flex h-9 items-center rounded-full border border-[color:var(--hairline-strong)] bg-card px-3 text-[13px] font-medium text-foreground disabled:opacity-45"
                  }>
                  {r} km
                </button>
              ))}
            </div>
            {denied ? (
              <p className="mt-3 text-[12px] text-error">
                Permite la ubicación en el navegador y vuelve a intentar.
              </p>
            ) : null}
            {(locationMode !== "none" || mapArea) && (
              <button
                type="button"
                className="mt-3 text-[13px] font-semibold text-foreground-secondary underline-offset-2 hover:underline"
                onClick={() => {
                  disableNearby();
                  clearMapOverride();
                  setLocOpen(false);
                }}>
                Limpiar ubicación
              </button>
            )}
          </div>
        ) : null}
      </div>

      {(!filtersDocked || filtersCollapsed) && (
        <>
          <span className="nabbi-explore-search-header__sep nabbi-explore-search-header__sep--filtros" aria-hidden />
          <button
            type="button"
            onClick={onFiltros}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--hairline-strong)] bg-card px-3 text-[13px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)]">
            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold tabular-nums text-secondary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </>
      )}

      <p
        id={descId}
        className={
          search.shortHint
            ? "nabbi-explore-search-header__hint"
            : "sr-only"
        }>
        {search.shortHint
          ? "Escribe al menos 2 letras"
          : "Encuentra profesionales y lugares cerca de ti. Reserva en pocos toques."}
      </p>
    </div>
  );
}
