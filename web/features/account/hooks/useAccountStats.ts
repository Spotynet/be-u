"use client";

import {useMemo} from "react";
import type {AccountReservation} from "../lib/types";
import type {PeriodId} from "../lib/accountVariants";
import {filterByPeriod} from "../lib/period";

/** Client-side KPIs from the reservations list (no dedicated stats endpoint). */
export function useAccountStats(
  items: AccountReservation[],
  period: PeriodId = "all",
) {
  return useMemo(() => {
    const scoped = filterByPeriod(items, period);
    const total = scoped.length;
    const completed = scoped.filter(
      (r) => (r.status || "").toUpperCase() === "COMPLETED",
    ).length;
    const cancelled = scoped.filter((r) => {
      const s = (r.status || "").toUpperCase();
      return s === "CANCELLED" || s === "REJECTED";
    }).length;

    return {
      total,
      completed,
      cancelled,
      scoped,
    };
  }, [items, period]);
}
