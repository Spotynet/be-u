"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {CardHeader, PageHeaderRow, StackLayout} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {reservationApi, errorUtils} from "@/lib/api";

const CANCELLABLE = new Set(["PENDING", "CONFIRMED"]);

export default function ReservationDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const serviceTitle =
    reservation?.service_name || reservation?.service?.name || "Reserva";

  usePageHeader({title: serviceTitle, pageOwnsTitle: true});

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
    <StackLayout>
      <PageHeaderRow
        title={loading ? "Reserva" : serviceTitle}
        meta={
          <Link
            href="/reservations"
            className="text-sm font-bold text-primary no-underline">
            ← Mis reservas
          </Link>
        }
      />

      {loading ? <p className="text-foreground-muted">Cargando…</p> : null}
      {error ? (
        <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-error">
          {error}
        </div>
      ) : null}

      {reservation && !loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
          <CardHeader
            title={serviceTitle}
            description={reservation.status}
          />
          <dl className="mt-4 grid gap-2.5 text-sm text-foreground">
            <div>
              <dt className="text-xs font-semibold text-foreground-secondary">Proveedor</dt>
              <dd className="mt-0.5 font-bold">
                {reservation.provider_name || reservation.provider?.name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-foreground-secondary">Fecha y hora</dt>
              <dd className="mt-0.5 font-bold">
                {reservation.date || "—"}{" "}
                {reservation.time ? String(reservation.time).slice(0, 5) : ""}
              </dd>
            </div>
            {reservation.notes ? (
              <div>
                <dt className="text-xs font-semibold text-foreground-secondary">Notas</dt>
                <dd className="mt-0.5">{reservation.notes}</dd>
              </div>
            ) : null}
            {reservation.address ? (
              <div>
                <dt className="text-xs font-semibold text-foreground-secondary">Dirección</dt>
                <dd className="mt-0.5">{reservation.address}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {canCancel ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-xl border-[1.5px] border-error bg-transparent px-4 py-2.5 text-sm font-bold text-error disabled:opacity-60">
                {cancelling ? "Cancelando…" : "Cancelar reserva"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/explore")}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">
              Seguir explorando
            </button>
          </div>
        </section>
      ) : null}
    </StackLayout>
  );
}