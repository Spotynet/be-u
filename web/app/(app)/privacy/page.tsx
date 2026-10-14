"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useEffect, useState} from "react";
import Link from "next/link";
import {notificationApi, errorUtils} from "@/lib/api";

const INK = "#12211A";

type Session = {
  id: number;
  platform: string;
  created_at: string;
  last_seen_at: string | null;
};

export default function PrivacyPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getActiveSessions();
      const data = res.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id: number) => {
    try {
      await notificationApi.revokeSession(id);
      setMessage("Sesión revocada.");
      await load();
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    }
  };

  const revokeAll = async () => {
    if (!confirm("¿Revocar todas las sesiones activas?")) return;
    try {
      await notificationApi.revokeAllSessions();
      setMessage("Todas las sesiones fueron revocadas.");
      await load();
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    }
  };

  return (
    <PageContainer size="md">
      <h1 className="nabbi-page-title">Privacidad y seguridad</h1>
      <p className="nabbi-page-sub">Legal, sesiones y eliminación de cuenta.</p>

      {message && (
        <div style={{marginBottom: 12, padding: 12, borderRadius: 12, background: "#ecfdf5", color: "#047857", fontSize: 14}}>
          {message}
        </div>
      )}

      <div style={{display: "flex", flexDirection: "column", gap: 8, marginBottom: 28}}>
        <SettingsLink href="/aviso-de-privacidad" label="Aviso de privacidad" />
        <SettingsLink href="/terminos-y-condiciones" label="Términos y condiciones" />
        <SettingsLink href="/delete-account" label="Eliminar cuenta" danger />
      </div>

      <h2 style={{fontSize: 18, fontWeight: 800, color: INK}}>Sesiones activas</h2>
      <p style={{color: "#64748b", fontSize: 14, marginBottom: 12}}>
        Dispositivos con token de notificación registrado.
      </p>

      {loading ? (
        <p style={{color: "#64748b"}}>Cargando…</p>
      ) : sessions.length === 0 ? (
        <p style={{color: "#64748b"}}>No hay sesiones registradas.</p>
      ) : (
        <>
          <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8}}>
            {sessions.map((s) => (
              <li
                key={s.id}
                className="nabbi-stack-row"
                style={{
                  background: "white",
                  border: "1px solid rgba(18,33,26,0.08)",
                  borderRadius: 12,
                  padding: 12,
                  justifyContent: "space-between",
                }}>
                <div style={{flex: "1 1 160px", minWidth: 0}}>
                  <div style={{fontWeight: 700}}>{s.platform || "dispositivo"}</div>
                  <div style={{fontSize: 12, color: "#64748b"}}>
                    Creada {new Date(s.created_at).toLocaleString("es-MX")}
                    {s.last_seen_at
                      ? ` · vista ${new Date(s.last_seen_at).toLocaleString("es-MX")}`
                      : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(s.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                  }}>
                  Revocar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={revokeAll}
            style={{
              marginTop: 12,
              background: "transparent",
              border: "1px solid rgba(18,33,26,0.15)",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Revocar todas
          </button>
        </>
      )}
    </PageContainer>
  );
}

function SettingsLink({
  href,
  label,
  danger,
}: {
  href: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "white",
        border: "1px solid rgba(18,33,26,0.08)",
        borderRadius: 12,
        padding: "14px 16px",
        textDecoration: "none",
        color: danger ? "#dc2626" : INK,
        fontWeight: 700,
        fontSize: 14,
      }}>
      {label}
    </Link>
  );
}
