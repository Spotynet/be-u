"use client";

import {useState} from "react";
import Link from "next/link";
import {profileImageUrl} from "@/lib/media";

export type ProviderCardData = {
  id: number | string;
  name?: string;
  display_name?: string;
  business_name?: string;
  user_image?: string | null;
  photo_url?: string | null;
  profile_photo?: string | null;
  cover_photo?: string | null;
  images?: Array<string | null | undefined> | null;
  average_rating?: number | null;
  rating?: number | null;
  category?: string | null;
  main_category?: string | null;
  profile_type?: string | null;
  distance_km?: number | null;
  distance?: number | null;
  bio?: string | null;
  city?: string | null;
};

function titleOf(p: ProviderCardData): string {
  return (
    p.business_name ||
    p.display_name ||
    p.name ||
    "Proveedor"
  );
}

function photoOf(p: ProviderCardData): string | null {
  return profileImageUrl(p);
}

function ratingOf(p: ProviderCardData): number | null {
  const r = p.average_rating ?? p.rating;
  if (r == null || Number.isNaN(Number(r))) return null;
  return Number(r);
}

function distanceOf(p: ProviderCardData): string | null {
  const d = p.distance_km ?? p.distance;
  if (d == null || Number.isNaN(Number(d))) return null;
  const n = Number(d);
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`;
}

function typeLabel(t?: string | null): string | null {
  if (!t) return null;
  const u = t.toUpperCase();
  if (u === "PLACE") return "Lugar";
  if (u === "PROFESSIONAL") return "Pro";
  return null;
}

type Props = {
  provider: ProviderCardData;
  selected?: boolean;
  onSelect?: () => void;
  href?: string;
  className?: string;
};

export function ProviderCard({
  provider,
  selected = false,
  onSelect,
  href,
  className = "",
}: Props) {
  const title = titleOf(provider);
  const photo = photoOf(provider);
  const [imgFailed, setImgFailed] = useState(false);
  const rating = ratingOf(provider);
  const distance = distanceOf(provider);
  const type = typeLabel(provider.profile_type);
  const category = provider.main_category || provider.category;
  const profileHref = href ?? `/profile/${provider.id}`;
  const showPhoto = Boolean(photo) && !imgFailed;

  const inner = (
    <>
      <div
        className="relative w-full overflow-hidden bg-background-secondary"
        style={{aspectRatio: "16 / 10"}}>
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo!}
            alt={title}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-light text-2xl font-bold text-primary">
            {title.slice(0, 1).toUpperCase()}
          </div>
        )}
        {type ? (
          <span className="absolute left-2 top-2 rounded-md bg-primary-dark px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            {type}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 line-clamp-1 text-[15px] font-bold text-foreground">
            {title}
          </h3>
          {rating != null ? (
            <span className="shrink-0 rounded-md bg-secondary-light px-1.5 py-0.5 text-[12px] font-bold text-secondary-dark">
              ★ {rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-medium text-foreground-secondary">
          {category ? <span className="capitalize">{category}</span> : null}
          {distance ? <span>· {distance}</span> : null}
          {provider.city ? <span>· {provider.city}</span> : null}
        </div>
        {provider.bio ? (
          <p className="m-0 line-clamp-2 text-[12px] leading-snug text-foreground-secondary">
            {provider.bio}
          </p>
        ) : null}
      </div>
    </>
  );

  const shellClass = [
    "block overflow-hidden rounded-2xl border bg-card text-left shadow-card transition-shadow hover:shadow-card-hover",
    selected
      ? "border-primary ring-2 ring-primary/40"
      : "border-card-border",
    className,
  ].join(" ");

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`${shellClass} w-full cursor-pointer p-0`}
        aria-pressed={selected}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={profileHref} className={`${shellClass} no-underline`}>
      {inner}
    </Link>
  );
}
