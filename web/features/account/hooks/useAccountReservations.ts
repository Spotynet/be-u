"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {errorUtils, reservationApi} from "@/lib/api";
import {
  isPastReservation,
  isUpcomingReservation,
} from "../lib/status";
import type {
  AccountReservation,
  ReservationFilterId,
} from "../lib/types";

function normalize(raw: any): AccountReservation {
  return {
    id: raw.id,
    code: raw.code,
    date: raw.date,
    time: typeof raw.time === "string" ? raw.time : String(raw.time || ""),
    end_time: raw.end_time ?? null,
    duration_minutes: raw.duration_minutes ?? null,
    status: raw.status,
    status_display: raw.status_display,
    service_name: raw.service_name || raw.service_details?.name,
    service_details: raw.service_details ?? null,
    provider_name: raw.provider_name,
    provider_details: raw.provider_details ?? null,
    service_address: raw.service_address,
    created_at: raw.created_at,
  };
}

export function useAccountReservations(enabled = true) {
  const [items, setItems] = useState<AccountReservation[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationFilterId>("all");

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [up, past] = await Promise.allSettled([
        reservationApi.getMyReservations({filter: "upcoming"}),
        reservationApi.getMyReservations({filter: "past"}),
      ]);
      const map = new Map<number, AccountReservation>();
      for (const res of [up, past]) {
        if (res.status !== "fulfilled") continue;
        const list = (res.value.data?.results || []) as any[];
        for (const row of list) {
          const n = normalize(row);
          map.set(n.id, n);
        }
      }
      setItems(Array.from(map.values()));
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let list = [...items];
    switch (filter) {
      case "upcoming":
        list = list.filter(isUpcomingReservation);
        break;
      case "past":
        list = list.filter(isPastReservation);
        break;
      case "month":
        list = list.filter((r) => {
          const d = new Date(`${r.date}T12:00:00`);
          return d.getMonth() === month && d.getFullYear() === year;
        });
        break;
      case "cancelled":
        list = list.filter((r) => {
          const s = (r.status || "").toUpperCase();
          return s === "CANCELLED" || s === "REJECTED";
        });
        break;
      default:
        break;
    }
    list.sort((a, b) => {
      const ta = new Date(`${a.date}T${(a.time || "00:00").slice(0, 8)}`).getTime();
      const tb = new Date(`${b.date}T${(b.time || "00:00").slice(0, 8)}`).getTime();
      return tb - ta;
    });
    return list;
  }, [items, filter]);

  const counts = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return {
      all: items.length,
      upcoming: items.filter(isUpcomingReservation).length,
      past: items.filter(isPastReservation).length,
      month: items.filter((r) => {
        const d = new Date(`${r.date}T12:00:00`);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length,
      cancelled: items.filter((r) => {
        const s = (r.status || "").toUpperCase();
        return s === "CANCELLED" || s === "REJECTED";
      }).length,
    };
  }, [items]);

  return {
    items,
    filtered,
    filter,
    setFilter,
    counts,
    loading,
    error,
    reload: load,
  };
}
