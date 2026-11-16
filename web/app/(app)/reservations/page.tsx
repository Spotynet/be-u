"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {SectionHeader} from "@/components/marketplace";
import {reservationApi, errorUtils} from "@/lib/api";

const STATUS_FILTERS = [
  {id: "", label: "Todos"},
  {id: "PENDING", label: "Pendiente"},
  {id: "CONFIRMED", label: "Confirmada"},
  {id: "CANCELLED", label: "Cancelada"},
  {id: "COMPLETED", label: "Completada"},
] as const;

function statusTone(status?: string): string {
  const s = (status || "").toUpperCase();
  if (s === "CONFIRMED" || s === "COMPLETED") return "text-emerald-700 bg-emerald-50";
  if (s === "PENDING") return "text-amber-700 bg-amber-50";
  if (s === "CANCELLED") return "text-rose-700 bg-rose-50";
  return "text-primary bg-primary-light";
}

export default function ReservationsPage() {
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<any[]>([]);
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
      (r) => (r.status || "").toUpperCase() === status.toUpperCase()
    );
  }, [items, status]);

  return (
    <div className="nabbi-page mx-auto w-full max-w-[960px]">
      <SectionHeader title="Mis reservas" />

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ["upcoming", "Próximas"],
            ["past", "Pasadas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={[
              filter === value ? "nabbi-chip nabbi-chip-active" : "nabbi-chip",
            ].join(" ")}>
            {label}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.id || "all"}
            type="button"
            onClick={() => setStatus(s.id)}
            className={[
              "rounded-full px-3 py-1.5 text-[12px] font-semibold",
              status === s.id
                ? "bg-primary-dark text-white"
                : "border border-card-border bg-card text-foreground-secondary",
            ].join(" ")}>
            {s.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-foreground-muted">Cargando…</p>}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-600">
          {error}
        </div>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="text-foreground-muted">
          No tienes reservas {filter === "upcoming" ? "próximas" : "pasadas"}
          {status ? " con ese estado" : ""}.{" "}
          <Link href="/explore" className="font-bold text-primary">
            Explorar
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-2.5 md:gap-3">
        {visible.map((r) => (
          <Link
            key={r.id}
            href={`/reservation/${r.id}`}
            className="block rounded-2xl border border-card-border bg-card p-4 text-foreground no-underline shadow-card transition-shadow hover:shadow-card-hover md:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[16px] font-extrabold">
                  {r.service_name || r.service?.name || "Servicio"}
                </div>
                <div className="mt-1 text-[13px] text-foreground-muted">
                  {r.provider_name || r.provider?.name || ""}
                  {r.date ? ` · ${r.date}` : ""}
                  {r.time ? ` ${String(r.time).slice(0, 5)}` : ""}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${statusTone(
                  r.status
                )}`}>
                {r.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
