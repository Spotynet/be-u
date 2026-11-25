"use client";

import {useEffect, useId, useRef} from "react";
import Link from "next/link";
import {StarIcon} from "@heroicons/react/20/solid";
import {
  HeartIcon as HeartOutline,
  MapIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {HeartIcon as HeartSolid} from "@heroicons/react/24/solid";
import {MAIN_CATEGORIES} from "@/constants/categories";
import type {ExploreResult} from "./ResultCard";

type Props = {
  result: ExploreResult;
  onClose: () => void;
  favorited?: boolean;
  favoriteBusy?: boolean;
  showFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** desktop anchored vs narrow docked */
  variant?: "anchored" | "docked";
  className?: string;
};

function catsOf(r: ExploreResult): string[] {
  const raw = r.category;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}

function catLabel(id: string): string {
  return MAIN_CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

function distanceLabel(r: ExploreResult): string | null {
  const d = r.distance_km ?? r.distance;
  if (d == null || Number.isNaN(Number(d))) return null;
  const n = Number(d);
  const formatted = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: n < 10 ? 1 : 0,
  }).format(n);
  if (n < 1) return `a ${Math.round(n * 1000)} m`;
  return `a ${formatted} km`;
}

function directionsHref(r: ExploreResult): string | null {
  const lat = Number(r.latitude);
  const lng = Number(r.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export function ExploreSelectionPanel({
  result,
  onClose,
  favorited = false,
  favoriteBusy = false,
  showFavorite = false,
  onToggleFavorite,
  variant = "anchored",
  className = "",
}: Props) {
  const title = result.name || "Sin nombre";
  const cats = catsOf(result);
  const rating = result.average_rating ?? result.rating;
  const distance = distanceLabel(result);
  const cover = result.images?.[0] || result.user_image || null;
  const directions = directionsHref(result);
  const titleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const catCity = [cats.map(catLabel).slice(0, 2).join(", "), result.city]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const root = panelRef.current;
    const focusable = root?.querySelector<HTMLElement>(
      "a,button,[tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    root?.addEventListener("keydown", onKey);
    return () => {
      root?.removeEventListener("keydown", onKey);
      if (prev && typeof prev.focus === "function") {
        try {
          prev.focus();
        } catch {
          /* ignore */
        }
      }
    };
  }, [onClose, result.id]);

  const rootClass = [
    "nabbi-explore-selection",
    variant === "docked" ? "nabbi-explore-selection--docked" : "nabbi-explore-selection--anchored",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={panelRef}
      className={rootClass}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}>
      {variant === "docked" ? (
        <div className="nabbi-explore-selection__handle" aria-hidden />
      ) : null}

      <div className="nabbi-explore-selection__media">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[color:var(--accent-wash)] text-[22px] font-bold text-foreground-muted">
            {initials(title) || "·"}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-[color:color-mix(in_srgb,var(--accent-fill)_40%,transparent)] text-white backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
          <XMarkIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            id={titleId}
            className="m-0 line-clamp-1 text-[15px] font-semibold text-foreground">
            {title}
          </h3>
          {rating != null && !Number.isNaN(Number(rating)) ? (
            <span className="inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full bg-[color:var(--accent-wash)] px-2 text-[12px] font-semibold tabular-nums text-foreground">
              <StarIcon className="h-3 w-3 text-secondary" aria-hidden />
              {Number(rating).toFixed(1)}
            </span>
          ) : null}
        </div>
        {catCity ? (
          <p className="m-0 mt-1 line-clamp-1 text-[13px] text-foreground-secondary">
            {catCity}
          </p>
        ) : null}
        {distance ? (
          <p className="m-0 mt-1 text-[12px] text-foreground-muted">{distance}</p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/profile/${result.id}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-secondary px-3.5 text-[13px] font-bold text-secondary-foreground no-underline hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
            Ver perfil
          </Link>
          {showFavorite && onToggleFavorite ? (
            <button
              type="button"
              disabled={favoriteBusy}
              aria-pressed={favorited}
              aria-label={
                favorited
                  ? `Quitar ${title} de favoritos`
                  : `Guardar a ${title} en favoritos`
              }
              onClick={onToggleFavorite}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-card-border bg-card text-foreground-muted hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">
              {favorited ? (
                <HeartSolid className="h-5 w-5 text-secondary" aria-hidden />
              ) : (
                <HeartOutline className="h-5 w-5" aria-hidden />
              )}
            </button>
          ) : null}
          {directions ? (
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Cómo llegar a ${title}`}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-card-border bg-card text-foreground no-underline hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <MapIcon className="h-5 w-5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
