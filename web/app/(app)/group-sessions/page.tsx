"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole, normalizeRole} from "@/lib/roles";
import {
  groupSessionApi,
  serviceApi,
  profileCustomizationApi,
  errorUtils,
} from "@/lib/api";

const INK = "#12211A";
const MAIN = "#558367";

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

export default function GroupSessionsPage() {
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
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(null);

  const selected = useMemo(
    () => services.find((s) => s.id === Number(serviceId)),
    [services, serviceId]
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
        const placeOrProItems: ServiceItem[] = (Array.isArray(list) ? list : []).map((s: any) => ({
          id: s.id,
          name: s.name || s.service_name || s.service?.name || "Servicio",
          service: s.service ?? s.service_type_id ?? s.service_details?.id ?? s.id,
          duration_minutes: s.duration_minutes ?? 60,
          type: isPlace ? "place_service" : "professional_service",
        }));
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
    <PageContainer size="lg">
      <h1 className="nabbi-page-title">Sesiones grupales</h1>
      <p className="nabbi-page-sub">
        {provider
          ? "Crea y administra sesiones con cupo limitado."
          : "Tus sesiones y reservas grupales."}
      </p>

      {message && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: message.type === "ok" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${message.type === "ok" ? "#6ee7b7" : "#fca5a5"}`,
            color: message.type === "ok" ? "#047857" : "#dc2626",
            fontSize: 14,
          }}>
          {message.text}
        </div>
      )}

      {provider && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "white",
            border: "1px solid rgba(18,33,26,0.08)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
          <div style={{fontWeight: 800, color: INK}}>Nueva sesión</div>
          <label style={labelStyle}>
            Servicio
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
              style={inputStyle}
              required>
              <option value="">Seleccionar…</option>
              {services.map((s) => (
                <option key={`${s.type}-${s.id}`} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="nabbi-form-row">
            <label style={labelStyle}>
              Fecha
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
                required
              />
            </label>
            <label style={labelStyle}>
              Hora
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={inputStyle}
                required
              />
            </label>
          </div>
          <label style={labelStyle}>
            Cupo
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) || 1)}
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? "Creando…" : "Crear sesión"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{color: "#64748b"}}>Cargando…</p>
      ) : sessions.length === 0 ? (
        <p style={{color: "#64748b"}}>No hay sesiones aún.</p>
      ) : (
        <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8}}>
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/group-sessions/${s.id}`}
                style={{
                  display: "block",
                  background: "white",
                  border: "1px solid rgba(18,33,26,0.08)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  textDecoration: "none",
                  color: INK,
                }}>
                <div style={{fontWeight: 800}}>
                  {s.service_name || s.service?.name || "Sesión grupal"}
                </div>
                <div style={{fontSize: 13, color: "#64748b", marginTop: 4}}>
                  {s.date} · {String(s.time || "").slice(0, 5)} · cupo {s.spots_taken ?? 0}/
                  {s.capacity ?? "?"}
                  {s.status ? ` · ${s.status}` : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: INK,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(18,33,26,0.15)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 500,
};

const primaryBtn: React.CSSProperties = {
  background: MAIN,
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};
