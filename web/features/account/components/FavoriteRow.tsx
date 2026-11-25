"use client";

import Link from "next/link";
import {ChevronRightIcon} from "@heroicons/react/24/outline";
import {Avatar} from "@/components/ui/Avatar";
import {StatusChip} from "./StatusChip";
import type {AccountFavorite} from "../lib/types";

type Props = {
  favorite: AccountFavorite;
  className?: string;
};

export function FavoriteRow({favorite: f, className = ""}: Props) {
  const href = f.public_profile_id
    ? `/profile/${f.public_profile_id}`
    : "/explore";
  const typeLabel = f.favorite_type === "PLACE" ? "Lugar" : "Profesional";

  return (
    <Link
      href={href}
      className={[
        "flex min-h-14 min-w-0 items-center gap-3 py-3 no-underline outline-none transition-colors",
        "hover:bg-foreground-muted/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
        className,
      ].join(" ")}>
      <Avatar name={f.favorite_name} size="md" fallbackTone="auto" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-foreground">
          {f.favorite_name}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-foreground-secondary">
          {f.favorite_specialty || typeLabel}
          {typeof f.favorite_rating === "number"
            ? ` · ${f.favorite_rating.toFixed(1)}`
            : ""}
        </p>
      </div>
      <StatusChip tone="brand" size="sm">
        {typeLabel}
      </StatusChip>
      <ChevronRightIcon
        className="h-4 w-4 shrink-0 text-foreground-muted"
        aria-hidden
      />
    </Link>
  );
}
