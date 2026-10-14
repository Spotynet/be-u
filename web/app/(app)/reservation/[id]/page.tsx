"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {reservationApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";

const CANCELLABLE = new Set(["PENDING", "CONFIRMED"]);

export default function ReservationDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError("Reserva no válida");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await reservationApi.getReservation(id);
      setReservation(res.data);
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async () => {
    if (!reservation?.id) return;
    if (!confirm("¿Cancelar esta reserva?")) return;
    setCancelling(true);
    setError(null);
    try {
      await reservationApi.cancelReservation(reservation.id, "CLIENT_CANCELLED");
      await load();
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const status = (reservation?.status || "").toUpperCase();
  const canCancel = CANCELLABLE.has(status);

  return (
    <PageContainer size="md">
      <Link
        href="/reservations"
        style={{color: MAIN, fontWeight: 700, textDecoration: "none", fontSize: 14}}>
        ← Mis reservas
      </Link>

      {loading && <p style={{color: "#64748b", marginTop: 16}}>Cargando…</p>}
      {error && (
        <div
          style={{
            marginTop: 16,
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 12,
            padding: 12,
            color: "#dc2626",
          }}>
          {error}
        </div>
      )}

      {reservation && !loading && (
        <div
          style={{
            marginTop: 16,
            background: "white",
            borderRadius: 18,
            border: "1px solid rgba(18,33,26,0.08)",
            padding: 22,
          }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: MAIN,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}>
            {reservation.status}
          </div>
          <h1 style={{margin: "0 0 12px", color: INK, fontWeight: 900, fontSize: 24}}>
            {reservation.service_name || reservation.service?.name || "Reserva"}
          </h1>
          <dl style={{margin: 0, display: "grid", gap: 10, fontSize: 14, color: DARK}}>
            <div>
              <dt style={{color: "#64748b", fontSize: 12, fontWeight: 600}}>Proveedor</dt>
              <dd style={{margin: "2px 0 0", fontWeight: 700}}>
                {reservation.provider_name || reservation.provider?.name || "—"}
              </dd>
            </div>
            <div>
              <dt style={{color: "#64748b", fontSize: 12, fontWeight: 600}}>Fecha y hora</dt>
              <dd style={{margin: "2px 0 0", fontWeight: 700}}>
                {reservation.date || "—"}{" "}
                {reservation.time ? String(reservation.time).slice(0, 5) : ""}
              </dd>
            </div>
            {reservation.notes && (
              <div>
                <dt style={{color: "#64748b", fontSize: 12, fontWeight: 600}}>Notas</dt>
                <dd style={{margin: "2px 0 0"}}>{reservation.notes}</dd>
              </div>
            )}
            {reservation.address && (
              <div>
                <dt style={{color: "#64748b", fontSize: 12, fontWeight: 600}}>Dirección</dt>
                <dd style={{margin: "2px 0 0"}}>{reservation.address}</dd>
              </div>
            )}
          </dl>

          <div style={{display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap"}}>
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  background: "transparent",
                  border: "1.5px solid #dc2626",
                  color: "#dc2626",
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: cancelling ? "not-allowed" : "pointer",
                  opacity: cancelling ? 0.6 : 1,
                }}>
                {cancelling ? "Cancelando…" : "Cancelar reserva"}
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/explore")}
              style={{
                background: MAIN,
                border: "none",
                color: "white",
                borderRadius: 12,
                padding: "10px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Seguir explorando
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
