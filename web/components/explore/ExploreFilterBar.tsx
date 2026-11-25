"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  AdjustmentsHorizontalIcon,
  CheckIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import {MAIN_CATEGORIES} from "@/constants/categories";
import {ChipRow} from "@/components/ui/ChipRow";
import {FilterChip} from "@/components/ui/FilterChip";
import {
  EXPLORE_RADIUS_POPOVER,
  type ExploreProfileType,
  type ExploreResultsApi,
} from "@/features/explore";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = {
  api: ExploreResultsApi;
  onOpenFilters: () => void;
};

const TYPE_OPTS: {id: ExploreProfileType; label: string}[] = [
  {id: "", label: "Todos"},
  {id: "PROFESSIONAL", label: "Profesionales"},
  {id: "PLACE", label: "Lugares"},
];

const CAT_IDS = MAIN_CATEGORIES.map((c) => c.id);

const TYPE_THUMB: Record<string, string> = {
  "": "nabbi-explore-type-seg__thumb",
  PROFESSIONAL: "nabbi-explore-type-seg__thumb nabbi-explore-type-seg__thumb--1",
  PLACE: "nabbi-explore-type-seg__thumb nabbi-explore-type-seg__thumb--2",
};

export function ExploreFilterBar({api, onOpenFilters}: Props) {
  const {
    loc,
    categories,
    setCategories,
    profileType,
    setProfileType,
    urlQ,
    syncUrl,
    clearFilters,
    activeFilterCount,
    mapArea,
    clearMapOverride,
    locationMode,
    enableNearby,
    disableNearby,
    setRadiusDebounced,
    refetching,
    modeNotice,
  } = api;

  const barRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [catFocus, setCatFocus] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const barH =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bar-h")
        .trim() || "64px";
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting),
      {rootMargin: `-${barH} 0px 0px 0px`, threshold: [1]},
    );
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "height:1px;width:1px;pointer-events:none";
    el.parentElement?.insertBefore(sentinel, el);
    io.observe(sentinel);
    return () => {
      io.disconnect();
      sentinel.remove();
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [categories, profileType, locationMode]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !categories.length) return;
    const last = categories[categories.length - 1];
    const chip = el.querySelector(
      `[data-cat-id="${last}"]`,
    ) as HTMLElement | null;
    chip?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [categories]);

  const nearBusy = loc.status === "locating";
  const denied = loc.permission === "denied";
  const unavailable =
    loc.permission === "unsupported" ||
    (Boolean(loc.geoError) && !denied);

  const onNearClick = () => {
    if (locationMode === "nearby") {
      disableNearby();
      return;
    }
    enableNearby();
  };

  const toggleCat = (id: string) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onCatKeyDown = (e: ReactKeyboardEvent, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    let next = index;
    if (e.key === "ArrowRight") next = Math.min(CAT_IDS.length - 1, index + 1);
    if (e.key === "ArrowLeft") next = Math.max(0, index - 1);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = CAT_IDS.length - 1;
    setCatFocus(next);
    const btn = scrollRef.current?.querySelector(
      `[data-cat-id="${CAT_IDS[next]}"]`,
    ) as HTMLElement | null;
    btn?.focus();
  };

  const onTypeKey = (e: ReactKeyboardEvent) => {
    const idx = TYPE_OPTS.findIndex((o) => o.id === profileType);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = TYPE_OPTS[Math.min(TYPE_OPTS.length - 1, idx + 1)];
      if (next) setProfileType(next.id);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const next = TYPE_OPTS[Math.max(0, idx - 1)];
      if (next) setProfileType(next.id);
    }
  };

  const typeIndex = Math.max(
    0,
    TYPE_OPTS.findIndex((o) => o.id === profileType),
  );
  const extraCatCount = Math.max(0, categories.length - 3);

  return (
    <>
      <div
        ref={barRef}
        className={
          stuck
            ? "nabbi-explore-filter-bar is-stuck"
            : "nabbi-explore-filter-bar"
        }>
        {refetching ? (
          <div className="nabbi-explore-filter-bar__progress" aria-hidden />
        ) : null}
        <div
          ref={scrollRef}
          className={
            overflow
              ? "nabbi-explore-filter-bar__scroll nabbi-explore-filter-bar__mask"
              : "nabbi-explore-filter-bar__scroll"
          }>
          {/* Cerca de mí */}
          <div className="relative inline-flex items-center gap-1">
            <button
              type="button"
              aria-pressed={locationMode === "nearby"}
              disabled={nearBusy || denied}
              onClick={onNearClick}
              className={
                locationMode === "nearby"
                  ? "inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--accent-fill)] px-3 text-[13px] font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-60"
                  : denied || unavailable
                    ? "inline-flex h-9 items-center gap-1.5 rounded-full border border-error/40 bg-card px-3 text-[13px] font-medium text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    : "inline-flex h-9 items-center gap-1.5 rounded-full border border-card-border bg-card px-3 text-[13px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              }>
              {nearBusy ? (
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              ) : (
                <MapPinIcon className="h-4 w-4" aria-hidden />
              )}
              Cerca de mí
              {locationMode === "nearby" ? (
                <span className="rounded-full bg-primary-foreground/15 px-1.5 text-[11px] font-bold">
                  {loc.radiusKm} km
                </span>
              ) : null}
            </button>
            {locationMode === "nearby" ? (
              <button
                type="button"
                aria-expanded={radiusOpen}
                aria-haspopup="listbox"
                aria-label="Cambiar radio"
                onClick={() => setRadiusOpen((v) => !v)}
                className="inline-flex h-9 items-center rounded-full border border-card-border bg-card px-2 text-[11px] font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                Radio
              </button>
            ) : null}
            {denied ? (
              <button
                type="button"
                aria-expanded={helpOpen}
                onClick={() => setHelpOpen((v) => !v)}
                className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-error underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <QuestionMarkCircleIcon className="h-4 w-4" aria-hidden />
                Cómo activar la ubicación
              </button>
            ) : null}
            {radiusOpen && locationMode === "nearby" ? (
              <div
                role="listbox"
                aria-label="Radio"
                className="absolute left-0 top-[calc(100%+6px)] z-20 flex gap-1 rounded-[var(--r-tile)] border border-card-border bg-card p-1.5 shadow-card">
                {EXPLORE_RADIUS_POPOVER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="option"
                    aria-selected={loc.radiusKm === r}
                    onClick={() => {
                      setRadiusDebounced(r);
                      setRadiusOpen(false);
                    }}
                    className={
                      loc.radiusKm === r
                        ? "h-8 min-w-10 rounded-full bg-primary-light px-2 text-[12px] font-bold text-primary-dark"
                        : "h-8 min-w-10 rounded-full px-2 text-[12px] font-semibold text-foreground-secondary hover:bg-surface-hover"
                    }>
                    {r}
                  </button>
                ))}
              </div>
            ) : null}
            {helpOpen && denied ? (
              <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[260px] rounded-[var(--r-tile)] border border-card-border bg-card p-3 text-[12px] text-foreground-secondary shadow-card">
                Abre la configuración del sitio en tu navegador, permite
                ubicación para nabbi y vuelve a tocar Cerca de mí.
              </div>
            ) : null}
          </div>

          <span className="nabbi-explore-strip-sep" aria-hidden />

          {/* Type segmented */}
          <div
            className="nabbi-explore-type-seg"
            role="radiogroup"
            aria-label="Tipo"
            onKeyDown={onTypeKey}>
            <span
              className={TYPE_THUMB[profileType] || TYPE_THUMB[""]}
              style={
                {["--type-i" as string]: String(typeIndex)} as CSSProperties
              }
              aria-hidden
            />
            {TYPE_OPTS.map((opt) => (
              <button
                key={opt.id || "all"}
                type="button"
                role="radio"
                aria-checked={profileType === opt.id}
                onClick={() => setProfileType(opt.id)}
                className="nabbi-explore-type-seg__btn">
                {opt.label}
              </button>
            ))}
          </div>

          <span className="nabbi-explore-strip-sep" aria-hidden />

          {/* Categories */}
          <div
            className="inline-flex items-center gap-1"
            role="group"
            aria-label="Categorías">
            <button
              type="button"
              aria-pressed={categories.length === 0}
              onClick={() => setCategories([])}
              className={
                categories.length === 0
                  ? "inline-flex h-9 items-center gap-1 rounded-full bg-[color:var(--accent-fill)] px-3 text-[13px] font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  : "inline-flex h-9 items-center rounded-full border border-card-border bg-card px-3 text-[13px] font-medium text-foreground-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              }>
              {categories.length === 0 ? (
                <CheckIcon className="h-3.5 w-3.5" aria-hidden />
              ) : null}
              Todas
            </button>
            {MAIN_CATEGORIES.map((c, index) => {
              const selected = categories.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  data-cat-id={c.id}
                  aria-pressed={selected}
                  tabIndex={catFocus === index ? 0 : -1}
                  onFocus={() => setCatFocus(index)}
                  onKeyDown={(e) => onCatKeyDown(e, index)}
                  onClick={() => toggleCat(c.id)}
                  className={
                    selected
                      ? "inline-flex h-9 items-center gap-1 rounded-full bg-[color:var(--accent-fill)] px-3 text-[13px] font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                      : "inline-flex h-9 items-center rounded-full border border-card-border bg-card px-3 text-[13px] font-medium text-foreground-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  }>
                  {selected ? (
                    <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                  ) : null}
                  {c.name}
                </button>
              );
            })}
            {extraCatCount > 0 ? (
              <span className="inline-flex h-9 min-w-8 items-center justify-center rounded-full bg-secondary px-2 text-[11px] font-bold tabular-nums text-secondary-foreground">
                +{extraCatCount}
              </span>
            ) : null}
          </div>

          {/* Filtros — pinned right via ml-auto on a flex child */}
          <button
            type="button"
            onClick={onOpenFilters}
            className="ml-auto inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-card-border bg-card px-3 text-[13px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold tabular-nums text-secondary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {modeNotice ? (
        <p className="mt-2 text-[12px] font-semibold text-foreground-secondary">
          {modeNotice}
        </p>
      ) : null}

      <div
        className={
          activeFilterCount > 0
            ? "nabbi-explore-active-row"
            : "nabbi-explore-active-row nabbi-explore-active-row--empty"
        }
        aria-hidden={activeFilterCount === 0}>
        {activeFilterCount > 0 ? (
          <ChipRow
            aria-label="Filtros activos"
            mode="multi"
            bleed={false}
            surface="card">
            {urlQ ? (
              <FilterChip
                label={`Búsqueda: «${urlQ}»`}
                selected
                removable
                onRemove={() => syncUrl({q: ""})}
                onClick={() => syncUrl({q: ""})}
              />
            ) : null}
            {locationMode === "nearby" ? (
              <FilterChip
                label={`Cerca · ${loc.radiusKm} km`}
                selected
                variant="accent"
                removable
                onRemove={disableNearby}
                onClick={disableNearby}
              />
            ) : null}
            {mapArea ? (
              <FilterChip
                label="Zona del mapa"
                selected
                variant="accent"
                removable
                onRemove={clearMapOverride}
                onClick={clearMapOverride}
              />
            ) : null}
            {profileType ? (
              <FilterChip
                label={profileType === "PLACE" ? "Lugares" : "Profesionales"}
                selected
                removable
                onRemove={() => setProfileType("")}
                onClick={() => setProfileType("")}
              />
            ) : null}
            {categories.map((c) => (
              <FilterChip
                key={c}
                label={MAIN_CATEGORIES.find((x) => x.id === c)?.name || c}
                selected
                removable
                onRemove={() =>
                  setCategories((prev) => prev.filter((x) => x !== c))
                }
                onClick={() =>
                  setCategories((prev) => prev.filter((x) => x !== c))
                }
              />
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-7 items-center text-[12px] font-bold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              Limpiar filtros
            </button>
          </ChipRow>
        ) : null}
      </div>
    </>
  );
}
