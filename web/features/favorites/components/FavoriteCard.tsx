"use client";

import {
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline";
import {HeartIcon as HeartSolid} from "@heroicons/react/24/solid";
import {ResultCard, type ExploreResult} from "@/components/explore/ResultCard";
import type {Favorite} from "../hooks/useFavorites";

type Props = {
  favorite: Favorite;
  /** When true, heart is filled (saved). Always true on the Favoritos page until removed. */
  saved?: boolean;
  onToggle?: () => void;
  toggling?: boolean;
  className?: string;
};

function toExploreResult(f: Favorite): ExploreResult {
  const cats = f.favorite_specialty
    ? [f.favorite_specialty].filter(Boolean)
    : [];
  return {
    id: f.public_profile_id || f.content_object_id || f.id,
    name: f.favorite_name || `Favorito #${f.content_object_id}`,
    profile_type: f.favorite_type,
    category: cats.length ? cats : undefined,
    rating: f.favorite_rating ?? null,
  };
}

function profileHref(f: Favorite): string {
  if (f.public_profile_id) return `/profile/${f.public_profile_id}`;
  return "/explore";
}

/**
 * Explore-aligned card + favorite heart toggle (top-right, 40px).
 */
export function FavoriteCard({
  favorite,
  saved = true,
  onToggle,
  toggling = false,
  className = "",
}: Props) {
  const result = toExploreResult(favorite);
  const name = result.name || "Favorito";

  return (
    <div className={["relative h-full", className].filter(Boolean).join(" ")}>
      <ResultCard
        result={result}
        variant="tile"
        href={profileHref(favorite)}
        className="h-full"
      />
      {onToggle ? (
        <button
          type="button"
          disabled={toggling}
          aria-pressed={saved}
          aria-label={
            saved
              ? `Quitar ${name} de favoritos`
              : `Guardar ${name} en favoritos`
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          className={[
            "absolute right-2 top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full",
            "border border-card-border bg-card/95 text-foreground shadow-card",
            "hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:opacity-60",
            saved ? "text-error" : "text-foreground-muted",
          ].join(" ")}>
          {saved ? (
            <HeartSolid className="h-5 w-5" aria-hidden />
          ) : (
            <HeartOutline className="h-5 w-5" aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
}
