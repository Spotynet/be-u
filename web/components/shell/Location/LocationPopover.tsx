"use client";

import {useEffect, useId, useLayoutEffect, useRef, useState} from "react";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MapPinIcon,
  TrashIcon,
  ViewfinderCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {Badge} from "@/components/ui/Badge";
import {Button} from "@/components/ui/Button";
import {CustomDropdown} from "@/components/ui/CustomDropdown";
import {Switch} from "@/components/ui/Switch";
import {HeaderPopover} from "@/components/shell/HeaderPopover";
import {isCoarseOrNarrowViewport} from "@/components/ui/dropdown";
import {Tooltip} from "@/components/ui/Tooltip";
import {useToast} from "@/components/ui/Toast";
import {
  RADIUS_OPTIONS,
  useLocationFilter,
  type RadiusKm,
} from "@/components/shell/useLocationFilter";
import {loadPlaceOptions, resolvePlace} from "./placeSearch";
import {formatRelativeEs, sourceLabel} from "./relativeTime";

type Props = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 px-5 ${className}`.trim()}>{children}</div>
  );
}

function freshnessLine(
  source: "gps" | "manual" | "profile" | "none",
  updatedAt: number | null | undefined,
): string {
  const src = sourceLabel(source);
  const rel = formatRelativeEs(updatedAt).replace(/^Actualizada\s+/i, "");
  return [src, rel].filter(Boolean).join(" · ");
}

/**
 * Apply model: radius / city / GPS / enabled write the store immediately.
 * Footer “Listo” / “Cerrar” only closes the popover.
 *
 * Layout: HeaderPopover bodyScroll=false; outer overflow-x-hidden; all
 * flex children min-w-0; radius = grid-cols-6 w-full (no horizontal overflow).
 * Body does NOT use raw .scroll-premium (-mx-2) — uses nabbi-location-popover__body.
 */
export function LocationPopover({open, onClose, triggerRef}: Props) {
  const loc = useLocationFilter();
  const toast = useToast();
  const titleId = useId();
  const helperId = useId();
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const clusterRef = useRef<HTMLElement | null>(null);
  const [placeValue, setPlaceValue] = useState<string | null>(null);
  const [isSheet, setIsSheet] = useState(false);

  const hasLocation = Boolean(
    (loc.coords || loc.label || loc.city) && loc.hydrated,
  );

  useLayoutEffect(() => {
    if (!open) return;
    const el = triggerRef.current?.closest(
      ".nabbi-topbar-cluster",
    ) as HTMLElement | null;
    clusterRef.current = el;
    setIsSheet(isCoarseOrNarrowViewport());
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => primaryRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  const onSelectPlace = async (value: string | null) => {
    setPlaceValue(value);
    if (!value) return;
    const resolved = await resolvePlace(value);
    loc.setManual({
      label: resolved.label,
      city: resolved.city,
      coords: resolved.coords,
    });
    toast.success("Ubicación actualizada");
  };

  const onClear = () => {
    loc.clear();
    setPlaceValue(null);
    toast.info("Ubicación eliminada");
  };

  const unsupported =
    loc.permission === "unsupported" ||
    (typeof window !== "undefined" && !window.isSecureContext);

  const locating = loc.status === "locating";
  const denied = loc.permission === "denied";

  const onRadiusKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = RADIUS_OPTIONS.indexOf(loc.radiusKm as RadiusKm);
    if (idx < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = RADIUS_OPTIONS[Math.min(RADIUS_OPTIONS.length - 1, idx + 1)];
      loc.setRadiusKm(next as RadiusKm);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = RADIUS_OPTIONS[Math.max(0, idx - 1)];
      loc.setRadiusKm(prev as RadiusKm);
    } else if (e.key === "Home") {
      e.preventDefault();
      loc.setRadiusKm(RADIUS_OPTIONS[0] as RadiusKm);
    } else if (e.key === "End") {
      e.preventDefault();
      loc.setRadiusKm(RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1] as RadiusKm);
    }
  };

  return (
    <HeaderPopover
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      anchorRef={clusterRef}
      width={400}
      align="right"
      offset={12}
      edgePadding={12}
      bodyScroll={false}
      sheetMaxHeight="92dvh"
      hideSheetHandle
      labelledBy={titleId}
      className="nabbi-location-popover overflow-x-hidden !rounded-[24px]">
      <div className="flex max-h-[min(640px,calc(100dvh-96px))] min-h-0 min-w-0 flex-col overflow-x-hidden">
        {/* —— Brand band header —— */}
        <header
          className="nabbi-location-popover__band relative shrink-0 overflow-hidden px-5 py-4 text-white"
          style={{
            background: "var(--shell-frame-gradient)",
            minHeight: 88,
          }}>
          <span
            className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-[0.08]"
            style={{
              background:
                "radial-gradient(circle, currentColor 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full opacity-[0.06]"
            style={{
              background:
                "radial-gradient(circle, currentColor 0%, transparent 70%)",
            }}
            aria-hidden
          />
          {isSheet ? (
            <div
              className="relative mx-auto mb-3 h-1 w-10 rounded-full bg-white/40"
              aria-hidden
            />
          ) : null}
          <div className="relative flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/15 bg-white/12">
              <MapPinIcon className="h-5 w-5 text-white" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id={titleId}
                className="text-[18px] font-semibold leading-6 text-white">
                Ubicación
              </h2>
              <p className="mt-0.5 text-[13px] font-normal leading-[18px] text-white/70">
                Encuentra servicios cerca de ti.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              aria-label="Cerrar">
              <XMarkIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {/* —— Scroll body (vertical only; no scroll-premium -mx) —— */}
        <div className="nabbi-location-popover__body min-h-0 min-w-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain py-5">
          {/* 1. Current / empty card */}
          <Section>
            {hasLocation ? (
              <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-card-border bg-foreground-muted/5 p-3.5 sm:px-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <MapPinIcon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-[15px] font-semibold leading-5 text-foreground">
                      {loc.label || loc.city || "Cerca de ti"}
                    </p>
                    {loc.stale ? (
                      <Badge tone="warning" size="sm">
                        Desactualizada
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-4 text-foreground-secondary">
                    {freshnessLine(loc.source, loc.updatedAt)}
                  </p>
                </div>
                <Tooltip content="Actualizar" side="left" delay={300}>
                  <button
                    type="button"
                    onClick={() => loc.requestGps()}
                    disabled={locating || unsupported}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-secondary hover:bg-foreground-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
                    aria-label="Actualizar ubicación">
                    <ArrowPathIcon
                      className={`h-5 w-5 ${locating ? "animate-spin motion-reduce:animate-none" : ""}`}
                      aria-hidden
                    />
                  </button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-dashed border-card-border bg-foreground-muted/[0.03] p-3.5 sm:px-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground-muted/10 text-foreground-muted">
                  <MapPinIcon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium leading-5 text-foreground">
                    Aún no has elegido una ubicación
                  </p>
                  <p className="mt-0.5 text-[12px] leading-4 text-foreground-secondary">
                    Detecta tu ubicación o elige tu ciudad.
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* 2. Primary GPS / denied / unsupported — one yellow at a time */}
          <Section>
            {denied ? (
              <div className="min-w-0 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
                <p className="flex items-start gap-2 text-[14px] font-semibold text-foreground">
                  <ExclamationTriangleIcon
                    className="mt-0.5 h-5 w-5 shrink-0 text-warning"
                    aria-hidden
                  />
                  Ubicación bloqueada
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-foreground-secondary">
                  <li>
                    Haz clic en el icono del candado junto a la barra de
                    direcciones.
                  </li>
                  <li>Activa Ubicación para este sitio.</li>
                  <li>Vuelve aquí y pulsa Reintentar.</li>
                </ol>
                <Button
                  ref={primaryRef}
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => loc.requestGps()}>
                  Reintentar
                </Button>
              </div>
            ) : unsupported ? (
              <p className="rounded-2xl border border-card-border bg-foreground-muted/5 p-3.5 text-[13px] text-foreground-secondary">
                Tu navegador no permite detectar la ubicación. Elige tu ciudad
                manualmente.
              </p>
            ) : hasLocation ? (
              <button
                ref={primaryRef}
                type="button"
                disabled={locating}
                onClick={() => loc.requestGps()}
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-card-border bg-card px-5 text-[15px] font-semibold text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50">
                {locating ? (
                  <ArrowPathIcon
                    className="h-5 w-5 animate-spin motion-reduce:animate-none text-primary"
                    aria-hidden
                  />
                ) : (
                  <ViewfinderCircleIcon
                    className="h-5 w-5 text-primary"
                    aria-hidden
                  />
                )}
                {locating ? "Ubicando…" : "Actualizar con mi ubicación"}
              </button>
            ) : (
              <button
                ref={primaryRef}
                type="button"
                disabled={locating}
                onClick={() => loc.requestGps()}
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-[15px] font-semibold text-secondary-foreground hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50">
                {locating ? (
                  <ArrowPathIcon
                    className="h-5 w-5 animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                ) : (
                  <ViewfinderCircleIcon className="h-5 w-5" aria-hidden />
                )}
                {locating ? "Ubicando…" : "Usar mi ubicación actual"}
              </button>
            )}

            {loc.geoError && !denied ? (
              <p className="mt-2 text-[12px] font-medium text-error" role="alert">
                {loc.geoError}
              </p>
            ) : null}
          </Section>

          {/* 3. Divider (edge-to-edge lines via padded row, no -mx) */}
          <div
            className="flex min-w-0 items-center gap-3 px-5"
            role="separator">
            <span className="h-px min-w-0 flex-1 bg-card-border" aria-hidden />
            <span className="shrink-0 text-[12px] font-medium text-foreground-secondary">
              o elige tu ciudad
            </span>
            <span className="h-px min-w-0 flex-1 bg-card-border" aria-hidden />
          </div>

          {/* 4. City */}
          <Section>
            <CustomDropdown
              label="Ciudad o colonia"
              value={placeValue}
              onChange={(v) => onSelectPlace(v)}
              loadOptions={loadPlaceOptions}
              searchable
              searchPlaceholder="Buscar ciudad…"
              placeholder="Ej. Roma Norte, CDMX"
              clearable
              className="nabbi-location-popover__city min-w-0"
              leadingIcon={
                <MapPinIcon
                  className="h-[18px] w-[18px] text-foreground-secondary"
                  aria-hidden
                />
              }
            />
          </Section>

          {/* 5. Radius */}
          <Section>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-medium leading-[18px] text-foreground">
                Radio de búsqueda
              </p>
              <span className="text-[13px] font-semibold tabular-nums text-primary">
                {loc.radiusKm} km
              </span>
            </div>
            <div
              className="grid w-full min-w-0 grid-cols-6 gap-0.5 rounded-[14px] border border-card-border bg-foreground-muted/10 p-1"
              role="radiogroup"
              aria-label="Radio de búsqueda"
              onKeyDown={onRadiusKeyDown}>
              {RADIUS_OPTIONS.map((r) => {
                const selected = loc.radiusKm === r;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${r} kilómetros`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => loc.setRadiusKm(r as RadiusKm)}
                    className={[
                      "inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl px-0.5 text-[13px] font-medium tabular-nums transition-[background-color,box-shadow,color,border-color] duration-[180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none [@media(pointer:coarse)]:min-h-11",
                      selected
                        ? "border border-primary/35 bg-card font-semibold text-primary shadow-sm"
                        : "border border-transparent text-foreground-secondary hover:text-foreground",
                    ].join(" ")}>
                    {r}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] leading-4 text-foreground-secondary">
              Mostraremos resultados dentro de este radio.
            </p>
          </Section>

          {/* 6. Nearby switch */}
          <Section>
            <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-card-border bg-foreground-muted/5 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-5 text-foreground">
                  Mostrar solo servicios cercanos
                </p>
                <p
                  id={helperId}
                  className="mt-0.5 text-[12px] leading-4 text-foreground-secondary">
                  {hasLocation
                    ? "Filtra Explorar por tu ubicación."
                    : "Primero elige o detecta una ubicación."}
                </p>
              </div>
              <Switch
                checked={loc.enabled}
                onCheckedChange={(next) => loc.setEnabled(next)}
                disabled={!hasLocation}
                describedBy={helperId}
              />
            </div>
          </Section>

          {/* 7. Privacy */}
          <Section className="!mt-1">
            <p className="flex items-start gap-2 text-[12px] leading-[18px] text-foreground-secondary">
              <LockClosedIcon
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden
              />
              Solo usamos tu ubicación para mostrarte servicios cercanos. No se
              comparte con otros usuarios.
            </p>
          </Section>
        </div>

        {/* —— Footer —— */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-card-border bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            {hasLocation ? (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-error hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <TrashIcon className="h-4 w-4" aria-hidden />
                Quitar ubicación
              </button>
            ) : loc.hasClearSnapshot ? (
              <button
                type="button"
                onClick={() => {
                  loc.restoreCleared();
                  toast.success("Ubicación restaurada");
                }}
                className="text-[13px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Deshacer
              </button>
            ) : (
              <span />
            )}
          </div>
          {hasLocation ? (
            <Button type="button" variant="primary" size="sm" onClick={onClose}>
              Listo
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </footer>
      </div>
    </HeaderPopover>
  );
}
