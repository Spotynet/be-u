"use client";

import {useMemo, type CSSProperties} from "react";
import Link from "next/link";
import {ChevronRightIcon} from "@heroicons/react/24/outline";
import {Avatar} from "@/components/ui/Avatar";
import {StatusBadge} from "./StatusBadge";
import {getReservationStatusConfig} from "./statusConfig";

/** Flexible booking shape from account preview or /reservations list. */
export type ReservationRowData = {
  id: number | string;
  date: string;
  time?: string | null;
  end_time?: string | null;
  status: string;
  service_name?: string | null;
  service?: {name?: string | null} | null;
  service_details?: {
    name?: string | null;
    price?: number | string | null;
    currency?: string | null;
  } | null;
  service_names?: string[] | null;
  provider_name?: string | null;
  provider?: {name?: string | null} | null;
  provider_details?: {
    name?: string | null;
    last_name?: string | null;
    image?: string | null;
    avatar?: string | null;
    public_profile_id?: number | null;
  } | null;
  service_address?: string | null;
  place_name?: string | null;
};

type Props = {
  reservation: ReservationRowData;
  className?: string;
  last?: boolean;
  /** Stagger index for entrance (0–5 on mobile, up to 7 desktop). */
  enterIndex?: number;
  href?: string | null;
};

function parseLocalDate(isoDate: string): Date | null {
  const d = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayNum(isoDate: string): string {
  const d = parseLocalDate(isoDate);
  return d ? String(d.getDate()) : "—";
}

function monthAbbr(isoDate: string): string {
  const d = parseLocalDate(isoDate);
  if (!d) return "—";
  return d.toLocaleDateString("es-MX", {month: "short"}).replace(".", "");
}

function formatTime(t?: string | null): string {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function formatPrice(
  price?: number | string | null,
  currency?: string | null,
): string | null {
  if (price == null || price === "") return null;
  const n = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(n)) return String(price);
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency || "MXN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

function startDateTime(r: ReservationRowData): Date | null {
  const t = (r.time || "00:00").slice(0, 8);
  const d = new Date(`${r.date}T${t.length === 5 ? `${t}:00` : t}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateHint(isoDate: string): "hoy" | "manana" | null {
  const d = parseLocalDate(isoDate);
  if (!d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (target.getTime() - today.getTime()) / 86400000;
  if (diff === 0) return "hoy";
  if (diff === 1) return "manana";
  return null;
}

function resolveTitle(r: ReservationRowData): {
  primary: string;
  extra: number;
} {
  const names =
    r.service_names?.filter(Boolean) ||
    [r.service_details?.name, r.service_name, r.service?.name].filter(Boolean);
  const unique = [...new Set(names as string[])];
  if (!unique.length) return {primary: "Servicio", extra: 0};
  if (unique.length === 1) return {primary: unique[0], extra: 0};
  if (unique.length === 2) {
    return {primary: `${unique[0]} · ${unique[1]}`, extra: 0};
  }
  return {primary: unique[0], extra: unique.length - 1};
}

function resolveProvider(r: ReservationRowData): {
  name: string;
  avatar: string | null;
} {
  const name =
    r.provider_name ||
    r.provider?.name ||
    [r.provider_details?.name, r.provider_details?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Proveedor";
  const avatar =
    r.provider_details?.image || r.provider_details?.avatar || null;
  return {name, avatar};
}

function formatDateSpoken(isoDate: string): string {
  const d = parseLocalDate(isoDate);
  if (!d) return isoDate;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Shared reservation list row — container-query responsive
 * (row-compact &lt;400 · row-stack 400–639 · row-wide ≥640).
 * Same DOM order everywhere; layout via CSS grid areas.
 */
export function ReservationRow({
  reservation: r,
  className = "",
  last = false,
  enterIndex,
  href,
}: Props) {
  const linkHref = href === null ? null : (href ?? `/reservation/${r.id}`);
  const interactive = Boolean(linkHref);

  const {primary, extra} = resolveTitle(r);
  const provider = resolveProvider(r);
  const start = formatTime(r.time);
  const end = formatTime(r.end_time);
  const range = end ? `${start} – ${end}` : start;
  const price = formatPrice(
    r.service_details?.price,
    r.service_details?.currency,
  );
  const place = r.place_name || r.service_address || null;
  const hint = dateHint(r.date);
  const upcoming = useMemo(() => {
    const dt = startDateTime(r);
    return dt ? dt.getTime() >= Date.now() : false;
  }, [r]);

  const statusLabel = getReservationStatusConfig(r.status).label;
  const ariaLabel = [
    primary,
    provider.name,
    formatDateSpoken(r.date),
    range,
    `estado ${statusLabel}`,
  ]
    .filter(Boolean)
    .join(", ");

  const enterStyle: CSSProperties | undefined =
    typeof enterIndex === "number" && enterIndex >= 0 && enterIndex < 8
      ? ({["--row-i" as string]: String(enterIndex)} as CSSProperties)
      : undefined;

  const surface = (
    <>
      {/* 1. Date tile */}
      <div
        className={[
          "nabbi-rr__tile",
          upcoming ? "nabbi-rr__tile--upcoming" : "nabbi-rr__tile--past",
          hint === "hoy" ? "nabbi-rr__tile--hoy" : "",
        ].join(" ")}>
        <span className="nabbi-rr__day tabular-nums">{dayNum(r.date)}</span>
        <span className="nabbi-rr__month">
          {hint === "hoy" ? (
            <>
              Hoy
              <span className="nabbi-rr__hoy-dot" aria-hidden />
            </>
          ) : hint === "manana" ? (
            "Mañana"
          ) : (
            monthAbbr(r.date)
          )}
        </span>
      </div>

      {/* 2–3. Title + meta */}
      <div className="nabbi-rr__content min-w-0">
        <div className="nabbi-rr__title-row min-w-0">
          <p className="nabbi-rr__title">{primary}</p>
          {extra > 0 ? (
            <span className="nabbi-rr__plus shrink-0">+{extra}</span>
          ) : null}
        </div>
        <div className="nabbi-rr__meta min-w-0">
          <Avatar
            src={provider.avatar}
            name={provider.name}
            size="xs"
            className="nabbi-rr__avatar"
            ringClassName="ring-card"
          />
          <span className="nabbi-rr__provider min-w-0 truncate">
            {provider.name}
          </span>
          {range ? (
            <span className="nabbi-rr__time-inline tabular-nums">
              <span className="nabbi-rr__sep" aria-hidden>
                ·
              </span>
              {range}
            </span>
          ) : null}
        </div>
        {range ? (
          <p className="nabbi-rr__time-block tabular-nums">{range}</p>
        ) : null}
        {place ? (
          <p className="nabbi-rr__place truncate">{place}</p>
        ) : null}
      </div>

      {/* 4–6. Status, price, chevron */}
      <div className="nabbi-rr__footer">
        <StatusBadge
          status={r.status}
          size="sm"
          className="nabbi-rr__badge whitespace-nowrap"
        />
        {price ? (
          <span className="nabbi-rr__price tabular-nums">{price}</span>
        ) : null}
        {interactive ? (
          <ChevronRightIcon className="nabbi-rr__chevron" aria-hidden />
        ) : null}
      </div>

      {!last ? <span className="nabbi-rr__divider" aria-hidden /> : null}
    </>
  );

  const wrapClass = [
    "nabbi-reservation-row nabbi-rr",
    typeof enterIndex === "number" ? "nabbi-reservation-row--enter" : "",
    className,
  ].join(" ");

  const surfaceClass = [
    "nabbi-rr__surface",
    interactive ? "nabbi-rr__surface--interactive" : "",
  ].join(" ");

  if (interactive && linkHref) {
    return (
      <div className={wrapClass} style={enterStyle}>
        <Link href={linkHref} className={surfaceClass} aria-label={ariaLabel}>
          {surface}
        </Link>
      </div>
    );
  }

  return (
    <div className={wrapClass} style={enterStyle}>
      <div className={surfaceClass} role="group">
        {surface}
      </div>
    </div>
  );
}

/** Month group label for multi-month lists (real dates only). */
export function reservationMonthLabel(isoDate: string): string {
  const d = parseLocalDate(isoDate);
  if (!d) return "";
  const label = d.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
