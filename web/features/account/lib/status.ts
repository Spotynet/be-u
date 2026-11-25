/**
 * @deprecated Prefer `@/components/reservations` statusConfig / StatusBadge.
 * Kept for account feature re-exports and FavoriteRow StatusChip tones.
 */
import {
  getReservationStatusConfig,
  type StatusTone as ConfigTone,
} from "@/components/reservations";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | string;

export type StatusTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "error"
  | "info";

export type StatusMeta = {
  label: string;
  tone: StatusTone;
};

const TONE_MAP: Record<ConfigTone, StatusTone> = {
  warning: "warning",
  success: "success",
  brand: "brand",
  danger: "error",
  neutral: "neutral",
};

/** Map backend reservation status → Spanish label + chip tone. */
export function reservationStatusMeta(status?: string | null): StatusMeta {
  const cfg = getReservationStatusConfig(status);
  return {label: cfg.label, tone: TONE_MAP[cfg.tone]};
}

export function isUpcomingReservation(r: {
  date: string;
  time?: string;
  status?: string;
}): boolean {
  const s = (r.status || "").toUpperCase();
  if (s === "CANCELLED" || s === "REJECTED" || s === "COMPLETED") return false;
  const now = new Date();
  const start = new Date(`${r.date}T${(r.time || "00:00").slice(0, 8)}`);
  return start.getTime() >= now.getTime();
}

export function isPastReservation(r: {
  date: string;
  time?: string;
  status?: string;
}): boolean {
  return !isUpcomingReservation(r);
}
