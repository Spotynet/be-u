"use client";

import {Suspense, useCallback, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {CalendarDaysIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {calendarApi, getCalendarRedirectUri, errorUtils} from "@/lib/api";

type Status = {
  is_connected: boolean;
  calendar_id: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  is_active: boolean;
};

function GoogleCalendarInner() {
  usePageHeader({title: "Google Calendar", pageOwnsTitle: true});
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

  if (!provider) {
    return <p className="text-foreground-secondary">Redirigiendo…</p>;
  }

  const connected = status?.is_connected ?? false;

  return (
    <StackLayout>
      <PageHeaderRow
        title="Google Calendar"
        description="Sincroniza reservas y disponibilidad con tu calendario de Google."
      />

      {message ? (
        <div className="rounded-[var(--control-radius)] border border-success/30 bg-success/10 px-3 py-2.5 text-[14px] text-success">
          {message}
        </div>
      ) : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
        <CardHeader title="Estado" icon={CalendarDaysIcon} />
        <div className="mt-4">
          {loading ? (
            <p className="text-foreground-secondary">Cargando estado…</p>
          ) : (
            <>
              <div
                className={[
                  "mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-extrabold",
                  connected
                    ? "bg-success/15 text-success"
                    : "bg-background text-foreground-secondary",
                ].join(" ")}>
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    connected ? "bg-success" : "bg-foreground-secondary",
                  ].join(" ")}
                  aria-hidden
                />
                {connected ? "Conectado" : "No conectado"}
              </div>

              {connected ? (
                <div className="mb-4 text-[13px] text-foreground-secondary">
                  {status?.calendar_id ? (
                    <div>Calendario: {status.calendar_id}</div>
                  ) : null}
                  {status?.last_sync_at ? (
                    <div>
                      Última sync:{" "}
                      {new Date(status.last_sync_at).toLocaleString("es-MX")}
                    </div>
                  ) : null}
                  {status?.sync_error ? (
                    <div className="text-error">Error: {status.sync_error}</div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                {!connected ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={connect}>
                    {busy ? "Redirigiendo…" : "Conectar Google Calendar"}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={sync}>
                      {busy ? "Sincronizando…" : "Sincronizar disponibilidad"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={disconnect}
                      className="border-error/40 text-error">
                      Desconectar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </StackLayout>
  );
}

export default function GoogleCalendarPage() {
  return (
    <Suspense
      fallback={
        <StackLayout>
          <p className="text-foreground-secondary">Cargando…</p>
        </StackLayout>
      }>
      <GoogleCalendarInner />
    </Suspense>
  );
}
