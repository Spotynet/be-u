"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Suspense} from "react";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {calendarApi, getCalendarRedirectUri, errorUtils} from "@/lib/api";

const INK = "#12211A";
const MAIN = "#558367";
const GOOGLE_GREEN = "#34a853";

type Status = {
  is_connected: boolean;
  calendar_id: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  is_active: boolean;
};

function GoogleCalendarInner() {
  const {user} = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = isProviderRole(user?.role);

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && !provider) router.replace("/me");
  }, [user, provider, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calendarApi.getStatus();
      setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (provider) load();
  }, [provider, load]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "1") setMessage("Google Calendar conectado.");
    if (err) setMessage(err);
  }, [searchParams]);

  const connect = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const redirectUri = getCalendarRedirectUri();
      const res = await calendarApi.getAuthUrl(redirectUri);
      const authUrl = res.data?.auth_url;
      if (!authUrl) throw new Error("No se obtuvo URL de autorización");
      window.location.href = authUrl;
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await calendarApi.syncAvailability();
      await load();
      setMessage("Disponibilidad sincronizada.");
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("¿Desconectar Google Calendar?")) return;
    setBusy(true);
    try {
      await calendarApi.disconnect();
      await load();
      setMessage("Desconectado.");
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!provider) return <p style={{color: "#64748b"}}>Redirigiendo…</p>;

  const connected = status?.is_connected ?? false;

  return (
    <PageContainer size="md">
      <h1 className="nabbi-page-title">Google Calendar</h1>
      <p className="nabbi-page-sub">
        Sincroniza reservas y disponibilidad con tu calendario de Google.
      </p>

      {message && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: "#ecfdf5",
            color: "#047857",
            fontSize: 14,
          }}>
          {message}
        </div>
      )}

      <div
        style={{
          background: "white",
          border: "1px solid rgba(18,33,26,0.08)",
          borderRadius: 16,
          padding: 20,
        }}>
        {loading ? (
          <p style={{color: "#64748b"}}>Cargando estado…</p>
        ) : (
          <>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: connected ? `${GOOGLE_GREEN}22` : "rgba(18,33,26,0.06)",
                color: connected ? GOOGLE_GREEN : "#64748b",
                fontWeight: 800,
                fontSize: 13,
                marginBottom: 16,
              }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: connected ? GOOGLE_GREEN : "#94a3b8",
                }}
              />
              {connected ? "Conectado" : "No conectado"}
            </div>

            {connected && (
              <div style={{fontSize: 13, color: "#64748b", marginBottom: 16}}>
                {status?.calendar_id && <div>Calendario: {status.calendar_id}</div>}
                {status?.last_sync_at && (
                  <div>
                    Última sync:{" "}
                    {new Date(status.last_sync_at).toLocaleString("es-MX")}
                  </div>
                )}
                {status?.sync_error && (
                  <div style={{color: "#dc2626"}}>Error: {status.sync_error}</div>
                )}
              </div>
            )}

            <div style={{display: "flex", flexDirection: "column", gap: 8}}>
              {!connected ? (
                <button type="button" disabled={busy} onClick={connect} style={primaryBtn}>
                  {busy ? "Redirigiendo…" : "Conectar Google Calendar"}
                </button>
              ) : (
                <>
                  <button type="button" disabled={busy} onClick={sync} style={primaryBtn}>
                    {busy ? "Sincronizando…" : "Sincronizar disponibilidad"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={disconnect}
                    style={{
                      background: "transparent",
                      border: "1px solid #fca5a5",
                      color: "#dc2626",
                      borderRadius: 12,
                      padding: "12px 16px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}>
                    Desconectar
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default function GoogleCalendarPage() {
  return (
    <Suspense fallback={<p style={{color: "#64748b"}}>Cargando…</p>}>
      <GoogleCalendarInner />
    </Suspense>
  );
}

const primaryBtn: React.CSSProperties = {
  background: MAIN,
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};
