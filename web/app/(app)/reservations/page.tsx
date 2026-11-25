"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {CalendarDaysIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
  ToolbarListCard,
} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {
  ReservationRow,
  RESERVATION_STATUS_CONFIG,
  reservationMonthLabel,
  type ReservationRowData,
} from "@/components/reservations";
import {reservationApi, errorUtils} from "@/lib/api";

const STATUS_FILTERS = [
  {id: "", label: "Todos"},
  {id: "PENDING", label: RESERVATION_STATUS_CONFIG.PENDING.label},
  {id: "CONFIRMED", label: RESERVATION_STATUS_CONFIG.CONFIRMED.label},
  {id: "CANCELLED", label: RESERVATION_STATUS_CONFIG.CANCELLED.label},
  {id: "COMPLETED", label: RESERVATION_STATUS_CONFIG.COMPLETED.label},
] as const;

export default function ReservationsPage() {
  usePageHeader({title: "Mis reservas"});
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<ReservationRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reservationApi.getMyReservations({filter});
      setItems(res.data.results || []);
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!status) return items;
    return items.filter(
      (r) => (r.status || "").toUpperCase() === status.toUpperCase(),
    );
  }, [items, status]);

  const multiMonth =
    visible.length > 1 &&
    reservationMonthLabel(visible[0].date) !==
      reservationMonthLabel(visible[visible.length - 1].date);

  const activeFilters = Number(Boolean(status)) + 1;

  return (
    <StackLayout>
      <PageHeaderRow title="Mis reservas" />

      <ToolbarListCard
        toolbar={
          <CardHeader
            title="Reservas"
            description={
              filter === "upcoming" ? "Próximas citas" : "Historial"
            }
            icon={CalendarDaysIcon}
            actions={
              <span className="inline-flex min-h-10 items-center rounded-full border border-card-border bg-background px-3 text-[12px] font-bold tabular-nums text-foreground-secondary">
                Filtros · {activeFilters}
              </span>
            }
          />
        }
        chips={
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Periodo">
              {(
                [
                  ["upcoming", "Próximas"],
                  ["past", "Pasadas"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => setFilter(value)}
                  className={[
                    filter === value
                      ? "nabbi-chip nabbi-chip-active"
                      : "nabbi-chip",
                  ].join(" ")}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.id || "all"}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={[
                    "rounded-full px-3 py-1.5 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    status === s.id
                      ? "bg-primary-dark text-primary-foreground"
                      : "border border-card-border bg-card text-foreground-secondary",
                  ].join(" ")}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        }>
        {loading && (
          <div className="space-y-0" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex min-h-20 items-center gap-3 px-4 py-4">
                <div className="h-14 w-14 animate-pulse rounded-[14px] bg-foreground-muted/15" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-foreground-muted/15" />
                  <div className="h-3 w-28 animate-pulse rounded bg-foreground-muted/15" />
                </div>
                <div className="h-7 w-24 animate-pulse rounded-full bg-foreground-muted/15" />
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="m-4 rounded-xl border border-error/40 bg-error/10 p-3 text-error">
            {error}
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="px-5 py-6 text-foreground-muted">
            No tienes reservas {filter === "upcoming" ? "próximas" : "pasadas"}
            {status ? " con ese estado" : ""}.{" "}
            <Link href="/explore" className="font-bold text-primary">
              Explorar
            </Link>
          </p>
        )}

        {!loading && !error && visible.length > 0 ? (
          <ul className="m-0 list-none p-0" role="list">
            {visible.map((r, i) => {
              const month = reservationMonthLabel(r.date);
              const prevMonth =
                i > 0 ? reservationMonthLabel(visible[i - 1].date) : "";
              const showMonth = i === 0 || month !== prevMonth;
              return (
                <li key={r.id}>
                  {multiMonth && showMonth && month ? (
                    <p className="nabbi-rr-month">{month}</p>
                  ) : null}
                  <ReservationRow
                    reservation={r}
                    last={i === visible.length - 1}
                    enterIndex={i < 6 ? i : undefined}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}
      </ToolbarListCard>
    </StackLayout>
  );
}
