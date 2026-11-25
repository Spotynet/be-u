"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {CalendarDaysIcon, UserGroupIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {CustomDropdown} from "@/components/ui/CustomDropdown";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole, normalizeRole} from "@/lib/roles";
import {
  groupSessionApi,
  serviceApi,
  profileCustomizationApi,
  errorUtils,
} from "@/lib/api";

type ServiceItem = {
  id: number;
  name: string;
  service: number;
  duration_minutes?: number;
  type?: "place_service" | "professional_service" | "custom_service";
};

const toDurationString = (minutes: number) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = Math.max(minutes % 60, 0).toString().padStart(2, "0");
  return `${h}:${m}:00`;
};

const fieldClass =
  "rounded-[var(--control-radius)] border border-card-border bg-background px-3 py-2.5 text-[14px] font-medium text-foreground";

export default function GroupSessionsPage() {
  usePageHeader({title: "Sesiones grupales", pageOwnsTitle: true});
  const {user} = useAuth();
  const router = useRouter();
  const isPlace = normalizeRole(user?.role) === "PLACE";
  const provider = isProviderRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [capacity, setCapacity] = useState(4);
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(
    null,
  );

  const selected = useMemo(
    () => services.find((s) => s.id === Number(serviceId)),
    [services, serviceId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sessionRes = await groupSessionApi.list();
      setSessions(sessionRes.data?.results || []);

      if (provider) {
        const [placeOrPro, custom] = await Promise.all([
          isPlace
            ? serviceApi.getPlaceServices({is_active: true})
            : serviceApi.getProfessionalServices({is_active: true}),
          profileCustomizationApi.getCustomServices().catch(() => ({data: []})),
        ]);
        const list = placeOrPro.data?.results || placeOrPro.data || [];
        const placeOrProItems: ServiceItem[] = (Array.isArray(list) ? list : []).map(
          (s: any) => ({
            id: s.id,
            name: s.name || s.service_name || s.service?.name || "Servicio",
            service: s.service ?? s.service_type_id ?? s.service_details?.id ?? s.id,
            duration_minutes: s.duration_minutes ?? 60,
            type: isPlace ? "place_service" : "professional_service",
          }),
        );
        const customList = Array.isArray(custom.data)
          ? custom.data
          : custom.data?.results ?? [];
        const customItems: ServiceItem[] = customList
          .filter((s: any) => s.is_active !== false)
          .map((s: any) => ({
            id: s.id,
            name: s.name || "Servicio",
            service: 0,
            duration_minutes: s.duration_minutes ?? 60,
            type: "custom_service" as const,
          }));
        setServices([...placeOrProItems, ...customItems]);
      }
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setLoading(false);
    }
  }, [provider, isPlace]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setMessage({type: "err", text: "Selecciona un servicio."});
      return;
    }
    if (!date || !time) {
      setMessage({type: "err", text: "Fecha y hora requeridas."});
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const duration = Math.max(1, selected.duration_minutes ?? 60);
      const payload: any = {
        service_instance_id: selected.id,
        date,
        time: time.length === 5 ? `${time}:00` : time,
        duration: toDurationString(duration),
        capacity: Math.max(1, capacity),
      };
      if (selected.type === "custom_service") {
        payload.service_instance_type = "custom_service";
      } else {
        payload.service = selected.service;
        payload.service_instance_type = selected.type;
      }
      const res = await groupSessionApi.create(payload);
      setMessage({type: "ok", text: "Sesión creada."});
      setServiceId("");
      await load();
      if (res.data?.id) router.push(`/group-sessions/${res.data.id}`);
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackLayout>
      <PageHeaderRow
        title="Sesiones grupales"
        description={
          provider
            ? "Crea y administra sesiones con cupo limitado."
            : "Tus sesiones y reservas grupales."
        }
      />

      {message ? (
        <div
          className={[
            "rounded-[var(--control-radius)] border px-3 py-2.5 text-[14px]",
            message.type === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/40 bg-error/10 text-error",
          ].join(" ")}>
          {message.text}
        </div>
      ) : null}

      {provider ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
          <CardHeader title="Nueva sesión" icon={UserGroupIcon} />
          <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
            <CustomDropdown
              label="Servicio"
              value={serviceId === "" ? null : Number(serviceId)}
              onChange={(value) => setServiceId(value === null ? "" : value)}
              options={services.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              searchable="auto"
              required
              placeholder="Seleccionar…"
              size="md"
            />
            <div className="nabbi-form-row">
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-foreground">
                Fecha
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={fieldClass}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-foreground">
                Hora
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={fieldClass}
                  required
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-bold text-foreground">
              Cupo
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value) || 1)}
                className={fieldClass}
              />
            </label>
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? "Creando…" : "Crear sesión"}
            </Button>
          </form>
        </section>
      ) : null}

      {loading ? (
        <p className="text-foreground-secondary">Cargando…</p>
      ) : sessions.length === 0 ? (
        <p className="text-foreground-secondary">No hay sesiones aún.</p>
      ) : (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
          <CardHeader title="Sesiones" icon={CalendarDaysIcon} />
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/group-sessions/${s.id}`}
                  className="block rounded-[var(--card-radius)] border border-card-border bg-background p-3.5 text-foreground no-underline transition-colors hover:bg-background-secondary">
                  <div className="font-extrabold">
                    {s.service_name || s.service?.name || "Sesión grupal"}
                  </div>
                  <div className="mt-1 text-[13px] text-foreground-secondary">
                    {s.date} · {String(s.time || "").slice(0, 5)} · cupo{" "}
                    {s.spots_taken ?? 0}/{s.capacity ?? "?"}
                    {s.status ? ` · ${s.status}` : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </StackLayout>
  );
}