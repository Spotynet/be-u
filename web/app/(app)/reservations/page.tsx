"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {PageContainer} from "@/components/layout/PageContainer";
import {reservationApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const MAIN = "#558367";

export default function ReservationsPage() {
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
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

  return (
    <PageContainer size="md">
      <h1 className="nabbi-page-title" style={{marginBottom: 16}}>
        Mis reservas
      </h1>

      <div style={{display: "flex", gap: 8, marginBottom: 18}}>
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
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: filter === value ? `1.5px solid ${MAIN}` : "1.5px solid rgba(85,131,103,0.2)",
              background: filter === value ? "rgba(85,131,103,0.12)" : "white",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              color: INK,
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading && <p style={{color: "#64748b"}}>Cargando…</p>}
      {error && (
        <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626"}}>
          {error}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <p style={{color: "#64748b"}}>
          No tienes reservas {filter === "upcoming" ? "próximas" : "pasadas"}.{" "}
          <Link href="/explore" style={{color: MAIN, fontWeight: 700}}>
            Explorar
          </Link>
        </p>
      )}

      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        {items.map((r) => (
          <Link
            key={r.id}
            href={`/reservation/${r.id}`}
            style={{
              textDecoration: "none",
              background: "white",
              borderRadius: 14,
              border: "1px solid rgba(18,33,26,0.08)",
              padding: 16,
              color: INK,
            }}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap"}}>
              <div>
                <div style={{fontWeight: 800, fontSize: 16}}>
                  {r.service_name || r.service?.name || "Servicio"}
                </div>
                <div style={{fontSize: 13, color: "#64748b", marginTop: 4}}>
                  {r.provider_name || r.provider?.name || ""}
                  {r.date ? ` · ${r.date}` : ""}
                  {r.time ? ` ${String(r.time).slice(0, 5)}` : ""}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: MAIN,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                {r.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
