"use client";

import Link from "next/link";
import {StarIcon} from "@heroicons/react/20/solid";
import {
  HeartIcon as HeartOutline,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {HeartIcon as HeartSolid} from "@heroicons/react/24/solid";
import {MAIN_CATEGORIES} from "@/constants/categories";

export type ExploreResult = {
  id: number;
  name?: string;
  profile_type?: string;
  category?: string | string[];
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
  distance_km?: number | null;
  rating?: number | null;
  average_rating?: number | null;
  rating_count?: number | null;
  user_image?: string | null;
  images?: Array<string | null | undefined> | null;
  bio?: string | null;
  description?: string | null;
  min_price?: number | null;
  price_from?: number | null;
  sub_categories?: string[] | null;
  professional_profile_id?: number | null;
  place_profile_id?: number | null;
};

/** media = image-first card; row/tile aliases kept for Favoritos compat. */
export type ResultCardVariant = "media" | "row" | "tile";

type Props = {
  result: ExploreResult;
  variant?: ResultCardVariant;
  selected?: boolean;
  highlighted?: boolean;
  href?: string;
  onHover?: (id: number | null) => void;
  onSelect?: (id: number) => void;
  onFocusCard?: (id: number) => void;
  onShowOnMap?: (id: number) => void;
  cardRef?: (el: HTMLElement | null) => void;
  compact?: boolean;
  className?: string;
  favorited?: boolean;
  favoriteBusy?: boolean;
  onToggleFavorite?: () => void;
  showFavorite?: boolean;
  showMapAction?: boolean;
};

const ROOT: Record<"rest" | "selected" | "highlighted", string> = {
  rest: "nabbi-explore-media relative",
  selected: "nabbi-explore-media relative is-selected",
  highlighted: "nabbi-explore-media relative is-highlighted",
};

const FAV_OFF =
  "nabbi-explore-media__fav absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-[color:color-mix(in_srgb,var(--accent-fill)_40%,transparent)] text-white backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-60";
const FAV_ON =
  "nabbi-explore-media__fav is-on absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-secondary text-secondary-foreground backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-60";

const MAP_BTN =
  "absolute bottom-2 right-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-[color:color-mix(in_srgb,var(--accent-fill)_40%,transparent)] text-white backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

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

function typeLabel(t?: string): "Profesional" | "Lugar" | null {
  if (!t) return null;
  const u = t.toUpperCase();
  if (u === "PLACE") return "Lugar";
  if (u === "PROFESSIONAL") return "Profesional";
  return null;
}

function priceLabel(r: ExploreResult): string | null {
  const p = r.min_price ?? r.price_from;
  if (p == null || Number.isNaN(Number(p))) return null;
  return `Desde $${Number(p).toLocaleString("es-MX")} MXN`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export function ResultCard({
  result,
  selected = false,
  highlighted = false,
  href,
  onHover,
  onSelect,
  onFocusCard,
  onShowOnMap,
  cardRef,
  className = "",
  favorited = false,
  favoriteBusy = false,
  onToggleFavorite,
  showFavorite = false,
  showMapAction = false,
}: Props) {
  const title = result.name || "Sin nombre";
  const type = typeLabel(result.profile_type);
  const cats = catsOf(result);
  const catLine = cats.slice(0, 2).map(catLabel).join(", ");
  const distance = distanceLabel(result);
  const rating = result.average_rating ?? result.rating;
  const price = priceLabel(result);
  const cover = result.images?.[0] || result.user_image || null;
  const profileHref = href ?? `/profile/${result.id}`;
  const tone = selected ? "selected" : highlighted ? "highlighted" : "rest";
  const rootClass = [ROOT[tone], className].filter(Boolean).join(" ");
  const hasCoords =
    Number.isFinite(Number(result.latitude)) &&
    Number.isFinite(Number(result.longitude));

  return (
    <div
      ref={cardRef}
      className={rootClass}
      onMouseEnter={() => onHover?.(result.id)}
      onMouseLeave={() => onHover?.(null)}
      aria-current={selected ? "true" : undefined}>
      <Link
        href={profileHref}
        className="block no-underline outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        aria-label={`Ver perfil de ${title}`}
        onFocus={() => {
          onFocusCard?.(result.id);
          onSelect?.(result.id);
        }}>
        <div className="nabbi-explore-media__frame">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={title}
              className="nabbi-explore-media__img"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 560px) 100vw, 440px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[28px] font-bold text-foreground-muted">
              {initials(title) || "·"}
            </div>
          )}
          {type ? (
            <span className="absolute bottom-2 left-2 inline-flex h-6 items-center rounded-full border border-white/25 bg-[color:color-mix(in_srgb,var(--accent-fill)_45%,transparent)] px-2 text-[10.5px] font-semibold text-white backdrop-blur-sm">
              {type}
            </span>
          ) : null}
        </div>

        <div className="px-1 pb-1 pt-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="m-0 line-clamp-1 text-[15px] font-semibold text-foreground">
              {title}
            </h3>
            {rating != null && !Number.isNaN(Number(rating)) ? (
              <span className="inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full bg-[color:var(--accent-wash)] px-2 text-[12px] font-semibold tabular-nums text-foreground">
                <StarIcon className="h-3 w-3 text-secondary" aria-hidden />
                {Number(rating).toFixed(1)}
              </span>
            ) : null}
          </div>
          <p className="m-0 mt-1 line-clamp-1 text-[13px] text-foreground-secondary">
            {[catLine || null, result.city || null].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-foreground-muted">
            {distance ? <span>{distance}</span> : null}
            {price ? <span>{price}</span> : null}
          </div>
        </div>
      </Link>

      <div className="nabbi-explore-media__overlays" aria-hidden={false}>
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={favorited ? FAV_ON : FAV_OFF}>
            {favorited ? (
              <HeartSolid className="h-4 w-4" aria-hidden />
            ) : (
              <HeartOutline className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}

        {showMapAction && hasCoords && onShowOnMap ? (
          <button
            type="button"
            aria-label={`Ver ${title} en el mapa`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShowOnMap(result.id);
            }}
            className={MAP_BTN}>
            <MapPinIcon className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
