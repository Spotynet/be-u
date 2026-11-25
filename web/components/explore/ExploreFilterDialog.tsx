"use client";

/**
 * Mobile/undocked filter sheet — draft state commits atomically on Aplicar.
 */

import {useEffect, useId, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {
  BuildingStorefrontIcon,
  CheckIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {MAIN_CATEGORIES} from "@/constants/categories";
import {Button} from "@/components/ui/Button";
import {Switch} from "@/components/ui/Switch";
import {
  EXPLORE_RADIUS_POPOVER,
  type ExploreProfileType,
  type ExploreResultsApi,
} from "@/features/explore";

type Draft = {
  categories: string[];
  profileType: ExploreProfileType;
  nearby: boolean;
  radiusKm: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  api: ExploreResultsApi;
};

const TYPE_BTN =
  "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--r-tile)] border border-[color:var(--hairline-strong)] bg-card px-2 text-[14px] font-medium text-foreground";
const TYPE_BTN_ON =
  "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--r-tile)] border border-[color:var(--accent-fill-border)] bg-[color:var(--accent-fill)] px-2 text-[14px] font-medium text-primary-foreground";

function snapshot(api: ExploreResultsApi): Draft {
  return {
    categories: [...api.categories],
    profileType: api.profileType,
    nearby: api.locationMode === "nearby",
    radiusKm: api.loc.radiusKm,
  };
}

export function ExploreFilterDialog({open, onClose, api}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => snapshot(api));
  const [catsExpanded, setCatsExpanded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraft(snapshot(api));
    setCatsExpanded(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button,input")?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
    // Snapshot only when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const typeSel = {
    pro: draft.profileType === "PROFESSIONAL",
    place: draft.profileType === "PLACE",
  };
  const setTypePair = (pro: boolean, place: boolean) => {
    let next: ExploreProfileType = "";
    if (pro && !place) next = "PROFESSIONAL";
    else if (place && !pro) next = "PLACE";
    setDraft((d) => ({...d, profileType: next}));
  };

  const radiusIdx = Math.max(
    0,
    EXPLORE_RADIUS_POPOVER.indexOf(
      (EXPLORE_RADIUS_POPOVER.includes(draft.radiusKm as 1)
        ? draft.radiusKm
        : 5) as 1 | 5 | 10 | 25,
    ),
  );

  const visibleCats = catsExpanded
    ? MAIN_CATEGORIES
    : MAIN_CATEGORIES.slice(0, 6);

  const pending =
    draft.categories.join(",") !== api.categories.join(",") ||
    draft.profileType !== api.profileType ||
    draft.nearby !== (api.locationMode === "nearby") ||
    (draft.nearby && draft.radiusKm !== api.loc.radiusKm);

  const apply = () => {
    api.setCategories(draft.categories);
    api.setProfileType(draft.profileType);
    if (draft.nearby) {
      api.enableNearby();
      if (draft.radiusKm !== api.loc.radiusKm) {
        api.setRadiusDebounced(draft.radiusKm);
      }
    } else if (api.locationMode === "nearby") {
      api.disableNearby();
    }
    onClose();
  };

  const resetDraft = () => {
    setDraft({
      categories: [],
      profileType: "",
      nearby: false,
      radiusKm: 5,
    });
  };

  return createPortal(
    <div
      className={
        narrow
          ? "fixed inset-0 z-[65] flex items-end justify-center"
          : "fixed inset-0 z-[65] flex items-stretch justify-end p-3"
      }
      role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          narrow
            ? "relative z-[1] flex max-h-[min(90dvh,720px)] w-full flex-col overflow-hidden rounded-t-[var(--r-panel)] border border-[color:var(--hairline-strong)] bg-card shadow-float"
            : "relative z-[1] flex h-full w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden rounded-[var(--r-panel)] border border-[color:var(--hairline-strong)] bg-card shadow-float"
        }>
        {narrow ? (
          <div
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground-muted/25"
            aria-hidden
          />
        ) : null}
        <div className="flex items-center justify-between border-b border-[color:var(--hairline)] px-4 py-3">
          <h2 id={titleId} className="m-0 text-[18px] font-semibold text-foreground">
            Filtros
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-hover">
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <section className="mb-6">
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
                  <BuildingStorefrontIcon
                    className="h-[18px] w-[18px]"
                    aria-hidden
                  />
                )}
                Lugares
              </button>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 m-0 text-[14px] font-semibold text-foreground">
              Categorías
            </h3>
            <ul className="m-0 flex list-none flex-col gap-0 p-0">
              {visibleCats.map((c) => {
                const checked = draft.categories.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-pressed={checked}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          categories: checked
                            ? d.categories.filter((x) => x !== c.id)
                            : [...d.categories, c.id],
                        }))
                      }
                      className="flex h-10 w-full items-center justify-between gap-3 rounded-[var(--r-control)] px-1 text-left text-[14px] font-medium text-foreground hover:bg-surface-hover">
                      {c.name}
                      <span
                        className={
                          checked
                            ? "nabbi-explore-check is-checked"
                            : "nabbi-explore-check"
                        }
                        aria-hidden>
                        {checked ? (
                          <CheckIcon
                            className="h-3.5 w-3.5"
                            strokeWidth={2.5}
                          />
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {MAIN_CATEGORIES.length > 6 ? (
              <button
                type="button"
                className="mt-2 text-[13px] font-semibold text-foreground-secondary"
                onClick={() => setCatsExpanded((v) => !v)}>
                {catsExpanded ? "Ver menos" : "Ver todas"}
              </button>
            ) : null}
          </section>

          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="m-0 text-[14px] font-semibold text-foreground">
                Cerca de mí
              </h3>
              <Switch
                checked={draft.nearby}
                disabled={
                  api.loc.status === "locating" || api.loc.status === "denied"
                }
                onCheckedChange={(on) =>
                  setDraft((d) => ({...d, nearby: on}))
                }
              />
            </div>
            {api.loc.status === "denied" ? (
              <p className="m-0 text-[12px] text-error">
                Permite la ubicación en el navegador para usar este filtro.
              </p>
            ) : null}
          </section>

          <section className="mb-2">
            <h3 className="mb-1 m-0 text-[14px] font-semibold text-foreground">
              Distancia
            </h3>
            {!draft.nearby ? (
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
                  value={radiusIdx}
                  aria-valuemin={1}
                  aria-valuemax={25}
                  aria-valuenow={EXPLORE_RADIUS_POPOVER[radiusIdx]}
                  aria-valuetext={`${EXPLORE_RADIUS_POPOVER[radiusIdx]} kilómetros`}
                  onChange={(e) => {
                    const i = Number(e.target.value);
                    setDraft((d) => ({
                      ...d,
                      radiusKm: EXPLORE_RADIUS_POPOVER[i] ?? 5,
                    }));
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

        <div className="flex shrink-0 gap-2 justify-between border-t border-[color:var(--hairline)] px-4 py-3">
          <Button type="button" variant="ghost" onClick={resetDraft}>
            Restablecer
          </Button>
          <Button type="button" onClick={apply}>
            {pending ? "Aplicar" : "Ver resultados"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
