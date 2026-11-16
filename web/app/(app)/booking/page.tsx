"use client";

import {Suspense, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {
  BookingSummaryPanel,
  StickyBookingBar,
} from "@/components/marketplace";
import {reservationApi, serviceApi, profileCustomizationApi, errorUtils} from "@/lib/api";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseHm(value: string): number {
  const [h, m] = value.slice(0, 5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Expand provider availability ranges into bookable start times (30-min steps). */
function expandAvailabilityRanges(
  ranges: Array<{start_time?: string; end_time?: string}>,
  durationMinutes: number
): string[] {
  const step = 30;
  const out: string[] = [];
  for (const range of ranges) {
    if (!range.start_time || !range.end_time) continue;
    let cursor = parseHm(range.start_time);
    const end = parseHm(range.end_time);
    while (cursor + durationMinutes <= end) {
      out.push(formatHm(cursor));
      cursor += step;
    }
  }
  return out;
}

function parseSlotsPayload(data: any, durationMinutes: number): string[] {
  const ranges =
    data?.available_slots || data?.slots || (Array.isArray(data) ? data : []);
  if (!Array.isArray(ranges) || ranges.length === 0) return [];
  if (typeof ranges[0] === "string") return ranges as string[];
  if (ranges[0]?.time) {
    return ranges
      .filter((s: any) => s.available !== false)
      .map((s: any) => s.time)
      .filter((t: string) => typeof t === "string");
  }
  return expandAvailabilityRanges(ranges, durationMinutes);
}

/** Drop start times that are already in the past when date is today (local). */
function filterPastTimesForToday(times: string[], dateStr: string): string[] {
  const today = formatLocalDate(new Date());
  if (dateStr !== today) return times;
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  return times.filter((t) => parseHm(t) > nowMins);
}

async function loadAvailabilityFallback(
  providerType: "place" | "professional",
  providerId: number,
  date: string,
  serviceInstanceId: number,
  durationMinutes: number
): Promise<string[]> {
  if (!providerId) return [];

  try {
    const alt = await profileCustomizationApi.getAvailableSlots(
      providerType,
      providerId,
      date,
      serviceInstanceId
    );
    const fromAlt = parseSlotsPayload(alt.data, durationMinutes);
    if (fromAlt.length > 0) return fromAlt;
  } catch {
    /* try schedule next */
  }

  try {
    const schedule = await reservationApi.getProviderSchedule({
      provider_type: providerType,
      provider_id: providerId,
      date,
    });
    const wh = schedule.data?.working_hours;
    if (wh?.start && wh?.end) {
      return expandAvailabilityRanges(
        [{start_time: wh.start, end_time: wh.end}],
        durationMinutes
      );
    }
  } catch {
    /* empty */
  }

  return [];
}

function BookingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceInfo = useMemo(() => {
    const serviceInstanceId = parseInt(searchParams.get("serviceInstanceId") || "0", 10);
    const serviceTypeId = parseInt(searchParams.get("serviceTypeId") || "0", 10);
    const providerId = parseInt(searchParams.get("providerId") || "0", 10);
    const duration = parseInt(searchParams.get("duration") || "60", 10);
    const serviceType = (searchParams.get("serviceType") || "professional_service") as
      | "place_service"
      | "professional_service"
      | "custom_service";
    return {
      serviceInstanceId,
      serviceTypeId,
      serviceName: searchParams.get("serviceName") || "Servicio",
      serviceType,
      providerId,
      providerName: searchParams.get("providerName") || "Proveedor",
      price: searchParams.get("price") || "",
      duration: Number.isNaN(duration) ? 60 : duration,
    };
  }, [searchParams]);

  const providerType =
    serviceInfo.serviceType === "place_service" ? "place" : "professional";

  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || !serviceInfo.serviceInstanceId) return;

    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      setSlotError(null);
      setSelectedTime("");
      setAvailableTimes([]);
      try {
        let available: string[] = [];
        try {
          const slotsResponse = await serviceApi.getAvailableSlots({
            service_id: serviceInfo.serviceInstanceId,
            date: selectedDate,
            service_type: providerType,
          });
          const slots = slotsResponse.data?.slots || [];
          available = slots
            .filter((s: any) => s.available)
            .map((s: any) => s.time)
            .filter((t: string) => typeof t === "string");
        } catch {
          available = [];
        }

        // Empty 200 (common for custom services) OR thrown error → availability fallback
        if (available.length === 0) {
          available = await loadAvailabilityFallback(
            providerType,
            serviceInfo.providerId,
            selectedDate,
            serviceInfo.serviceInstanceId,
            serviceInfo.duration || 60
          );
        }

        available = filterPastTimesForToday(available, selectedDate);

        if (cancelled) return;
        setAvailableTimes(available);
        if (available.length === 0) {
          setSlotError("No hay horarios disponibles para esta fecha.");
        }
      } catch (err) {
        if (!cancelled) {
          setSlotError(errorUtils.getErrorMessage(err) || "No se pudieron cargar los horarios.");
          setAvailableTimes([]);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, serviceInfo.serviceInstanceId, serviceInfo.providerId, providerType]);

  const minDate = formatLocalDate(new Date());

  const submitReservation = async () => {
    setError(null);
    if (!serviceInfo.serviceInstanceId || !selectedDate || !selectedTime) {
      setError("Selecciona fecha y hora para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await reservationApi.createReservation({
        service_instance_type: serviceInfo.serviceType,
        service_instance_id: serviceInfo.serviceInstanceId,
        provider_type: providerType,
        provider_id: serviceInfo.providerId || undefined,
        date: selectedDate,
        time: selectedTime.slice(0, 5),
        notes: notes.trim() || undefined,
      });
      const reservationId = response?.data?.id || response?.data?.reservation?.id;
      if (reservationId) {
        router.push(`/reservation/${reservationId}`);
      } else {
        router.push("/reservations");
      }
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitReservation();
  };

  const canConfirm = !!(selectedDate && selectedTime) && !submitting;
  const priceLabel = serviceInfo.price ? `$${serviceInfo.price}` : undefined;

  const confirm = () => {
    if (!canConfirm) return;
    void submitReservation();
  };

  if (!serviceInfo.serviceInstanceId) {
    return (
      <div className="nabbi-page max-w-xl">
        <h1 className="nabbi-page-title">Reservar</h1>
        <p className="nabbi-page-sub">
          Faltan datos del servicio. Vuelve a un perfil y elige un servicio.
        </p>
        <Link href="/explore" className="font-bold text-primary">
          Ir a Explorar
        </Link>
      </div>
    );
  }

  const summaryLines = [
    {label: "Duración", value: `${serviceInfo.duration} min`},
    ...(selectedDate ? [{label: "Fecha", value: selectedDate}] : []),
    ...(selectedTime ? [{label: "Hora", value: selectedTime.slice(0, 5)}] : []),
  ];

  return (
    <div className="nabbi-page w-full pb-28 lg:pb-4">
      <h1 className="nabbi-page-title">Reservar</h1>
      <p className="nabbi-page-sub">
        {serviceInfo.serviceName} con {serviceInfo.providerName}
        {serviceInfo.price ? ` · $${serviceInfo.price}` : ""} · {serviceInfo.duration}{" "}
        min
      </p>

      <div className="nabbi-booking-layout">
        <form
          id="booking-form"
          onSubmit={handleSubmit}
          className="flex min-w-0 flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-foreground">Fecha</span>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="rounded-xl border-[1.5px] border-primary/25 bg-card px-3.5 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div>
            <div className="mb-2 text-[13px] font-bold text-foreground">Hora</div>
            {loadingSlots && (
              <p className="text-sm text-foreground-muted">Cargando horarios…</p>
            )}
            {slotError && !loadingSlots && (
              <p className="text-sm text-error">{slotError}</p>
            )}
            {!loadingSlots && availableTimes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableTimes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={[
                      "rounded-[10px] px-3.5 py-2.5 text-sm font-bold",
                      selectedTime === t
                        ? "border-[1.5px] border-primary bg-primary/15 text-primary-dark"
                        : "border-[1.5px] border-primary/20 bg-card text-primary-dark",
                    ].join(" ")}>
                    {t.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-foreground">
              Notas (opcional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Algo que deba saber el profesional…"
              className="rounded-xl border-[1.5px] border-primary/25 bg-card px-3.5 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Mobile-only inline submit fallback when sticky is awkward */}
          <button
            type="submit"
            disabled={!canConfirm}
            className="hidden min-h-12 rounded-xl bg-secondary text-[15px] font-extrabold text-secondary-foreground disabled:opacity-60 md:hidden">
            {submitting ? "Confirmando…" : "Confirmar reserva"}
          </button>
        </form>

        <div className="hidden lg:block">
          <BookingSummaryPanel
            title="Resumen"
            providerName={serviceInfo.providerName}
            serviceName={serviceInfo.serviceName}
            lines={summaryLines}
            totalValue={priceLabel}
            ctaLabel={submitting ? "Confirmando…" : "Confirmar reserva"}
            disabled={!canConfirm}
            busy={submitting}
            onConfirm={confirm}
          />
        </div>
      </div>

      <StickyBookingBar
        priceLabel={priceLabel || serviceInfo.serviceName}
        subtitle={
          selectedDate && selectedTime
            ? `${selectedDate} · ${selectedTime.slice(0, 5)}`
            : "Elige fecha y hora"
        }
        ctaLabel={submitting ? "Confirmando…" : "Confirmar reserva"}
        disabled={!canConfirm}
        onClick={confirm}
      />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<p style={{color: "#64748b"}}>Cargando…</p>}>
      <BookingInner />
    </Suspense>
  );
}
