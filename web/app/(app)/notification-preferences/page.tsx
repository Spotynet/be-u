"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useEffect, useState} from "react";
import Link from "next/link";
import {notificationApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const MAIN = "#558367";

const LABELS: Record<string, string> = {
  reservation: "Reservas",
  review: "Reseñas",
  social: "Social",
  message: "Mensajes",
  system: "Sistema",
  marketing: "Promociones",
  link: "Vinculaciones",
};

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await notificationApi.getPreferences();
        setPrefs(res.data?.preferences || {});
      } catch (err) {
        setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (key: string) => {
    setPrefs((p) => ({...p, [key]: !p[key]}));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await notificationApi.savePreferences(prefs);
      setPrefs(res.data?.preferences || prefs);
      setMessage({type: "ok", text: "Preferencias guardadas."});
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setSaving(false);
    }
  };

  const keys = Object.keys(prefs).length
    ? Object.keys(prefs)
    : Object.keys(LABELS);

  return (
    <PageContainer size="sm">
      <Link href="/notifications" style={{color: MAIN, fontWeight: 700, textDecoration: "none", fontSize: 14}}>
        ← Notificaciones
      </Link>
      <h1 className="nabbi-page-title" style={{marginTop: 12}}>
        Preferencias
      </h1>
      <p className="nabbi-page-sub">Elige qué avisos quieres recibir en la app.</p>

      {message && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: message.type === "ok" ? "#ecfdf5" : "#fef2f2",
            color: message.type === "ok" ? "#047857" : "#dc2626",
            fontSize: 14,
          }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p style={{color: "#64748b"}}>Cargando…</p>
      ) : (
        <div
          style={{
            background: "white",
            border: "1px solid rgba(18,33,26,0.08)",
            borderRadius: 16,
            padding: 8,
          }}>
          {keys.map((key) => (
            <label
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 10px",
                borderBottom: "1px solid rgba(18,33,26,0.06)",
                cursor: "pointer",
              }}>
              <span style={{fontWeight: 700, color: INK}}>{LABELS[key] || key}</span>
              <input
                type="checkbox"
                checked={prefs[key] !== false}
                onChange={() => toggle(key)}
              />
            </label>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving || loading}
        style={{
          marginTop: 20,
          width: "100%",
          background: MAIN,
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "14px 16px",
          fontWeight: 800,
          cursor: "pointer",
        }}>
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </PageContainer>
  );
}
