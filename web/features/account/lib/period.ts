import type {AccountReservation} from "./types";
import type {PeriodId, ReservaEstadoId} from "./accountVariants";
import {isUpcomingReservation} from "./status";

export function filterByPeriod(
  items: AccountReservation[],
  period: PeriodId,
): AccountReservation[] {
  if (period === "all") return items;
  const now = new Date();
  const start = new Date(now);
  if (period === "30") start.setDate(start.getDate() - 30);
  else if (period === "90") start.setDate(start.getDate() - 90);
  else if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  const t0 = start.getTime();
  return items.filter((r) => {
    const d = new Date(`${r.date}T12:00:00`);
    return !Number.isNaN(d.getTime()) && d.getTime() >= t0;
  });
}

export function filterByEstado(
  items: AccountReservation[],
  estado: ReservaEstadoId,
): AccountReservation[] {
  switch (estado) {
    case "upcoming":
      return items.filter(isUpcomingReservation);
    case "completed":
      return items.filter(
        (r) => (r.status || "").toUpperCase() === "COMPLETED",
      );
    case "cancelled":
      return items.filter((r) => {
        const s = (r.status || "").toUpperCase();
        return s === "CANCELLED" || s === "REJECTED";
      });
    default:
      return items;
  }
}

export function parsePeriod(raw: string | null): PeriodId {
  if (raw === "30" || raw === "90" || raw === "year" || raw === "all") {
    return raw;
  }
  return "all";
}

export function parseEstado(raw: string | null): ReservaEstadoId {
  if (
    raw === "upcoming" ||
    raw === "completed" ||
    raw === "cancelled" ||
    raw === "all"
  ) {
    return raw;
  }
  return "all";
}
