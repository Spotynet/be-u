/**
 * Single source of truth for reservation status labels / tones / icons.
 * Keys match backend `Reservation.Status` (uppercase).
 */

export type ReservationStatusKey =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type StatusTone =
  | "warning"
  | "success"
  | "brand"
  | "danger"
  | "neutral";

export type StatusIconKind = "dot" | "check" | "x";

export type StatusConfigEntry = {
  label: string;
  /** Plural for filters / KPI chrome (optional). */
  labelPlural?: string;
  tone: StatusTone;
  icon: StatusIconKind;
  /** Soft pending pulse on the leading mark. */
  pulse?: boolean;
};

export const RESERVATION_STATUS_CONFIG: Record<
  ReservationStatusKey,
  StatusConfigEntry
> = {
  PENDING: {
    label: "Pendiente",
    labelPlural: "Pendientes",
    tone: "warning",
    icon: "dot",
    pulse: true,
  },
  CONFIRMED: {
    label: "Confirmada",
    labelPlural: "Confirmadas",
    tone: "success",
    icon: "dot",
  },
  COMPLETED: {
    label: "Completada",
    labelPlural: "Completadas",
    tone: "brand",
    icon: "check",
  },
  CANCELLED: {
    label: "Cancelada",
    labelPlural: "Canceladas",
    tone: "danger",
    icon: "x",
  },
  REJECTED: {
    label: "Rechazada",
    labelPlural: "Rechazadas",
    tone: "danger",
    icon: "x",
  },
};

/** Normalize API / dashboard casing → uppercase key. */
export function normalizeReservationStatus(
  status?: string | null,
): string {
  return (status || "").trim().toUpperCase();
}

function humanizeRaw(status: string): string {
  if (!status) return "—";
  return status
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getReservationStatusConfig(
  status?: string | null,
): StatusConfigEntry & {key: string} {
  const key = normalizeReservationStatus(status);
  const known = RESERVATION_STATUS_CONFIG[key as ReservationStatusKey];
  if (known) return {...known, key};
  return {
    key,
    label: humanizeRaw(key),
    tone: "neutral",
    icon: "dot",
  };
}
