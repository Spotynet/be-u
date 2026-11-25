"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {ShieldCheckIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {notificationApi, errorUtils} from "@/lib/api";

type Session = {
  id: number;
  platform: string;
  created_at: string;
  last_seen_at: string | null;
};

export default function PrivacyPage() {
  usePageHeader({title: "Privacidad y seguridad", pageOwnsTitle: true});
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
    <StackLayout>
      <PageHeaderRow
        title="Privacidad y seguridad"
        description="Legal, sesiones y eliminación de cuenta."
      />

      {message ? (
        <div className="rounded-[var(--control-radius)] border border-success/30 bg-success/10 px-3 py-2.5 text-[14px] text-success">
          {message}
        </div>
      ) : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
        <CardHeader title="Legal" icon={ShieldCheckIcon} />
        <div className="mt-3 flex flex-col gap-2">
          <SettingsLink href="/aviso-de-privacidad" label="Aviso de privacidad" />
          <SettingsLink
            href="/terminos-y-condiciones"
            label="Términos y condiciones"
          />
          <SettingsLink href="/delete-account" label="Eliminar cuenta" danger />
        </div>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
        <CardHeader
          title="Sesiones activas"
          description="Dispositivos con token de notificación registrado."
        />
        <div className="mt-3">
          {loading ? (
            <p className="text-foreground-secondary">Cargando…</p>
          ) : sessions.length === 0 ? (
            <p className="text-foreground-secondary">
              No hay sesiones registradas.
            </p>
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="nabbi-stack-row flex items-center justify-between gap-3 rounded-[var(--tile-radius)] border border-card-border bg-background px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground">
                        {s.platform || "dispositivo"}
                      </div>
                      <div className="text-[12px] text-foreground-secondary">
                        Creada {new Date(s.created_at).toLocaleString("es-MX")}
                        {s.last_seen_at
                          ? ` · vista ${new Date(s.last_seen_at).toLocaleString("es-MX")}`
                          : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => revoke(s.id)}
                      className="cursor-pointer border-0 bg-transparent text-[13px] font-bold text-error">
                      Revocar
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={revokeAll}>
                Revocar todas
              </Button>
            </>
          )}
        </div>
      </section>
    </StackLayout>
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
      className={[
        "block rounded-[var(--control-radius)] border border-card-border bg-background px-4 py-3.5 text-[14px] font-bold no-underline",
        danger ? "text-error" : "text-foreground",
      ].join(" ")}>
      {label}
    </Link>
  );
}
