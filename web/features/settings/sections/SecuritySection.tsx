"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {Badge} from "@/components/ui/Badge";
import {Button} from "@/components/ui/Button";
import {Dialog} from "@/components/ui/Dialog";
import {useToast} from "@/components/ui/Toast";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {
  absoluteTimeLabel,
  relativeTimeLabel,
} from "@/features/notifications/time";
import {errorUtils, notificationApi} from "@/lib/api";
import {ChangePasswordDrawer} from "../components/ChangePasswordDrawer";
import {SettingsCard} from "../components/SettingsCard";
import {SettingsRow} from "../components/SettingsRow";
import {SettingsSectionGrid} from "../components/SettingsSectionGrid";
import type {SettingsCapability} from "../settingsConfig";

type Session = {
  id: number;
  platform: string;
  created_at: string;
  last_seen_at: string | null;
};

type Props = {
  caps: SettingsCapability;
};

function platformIcon(platform: string) {
  const p = (platform || "").toLowerCase();
  if (p.includes("ios") || p.includes("android") || p.includes("mobile")) {
    return DevicePhoneMobileIcon;
  }
  return ComputerDesktopIcon;
}

function platformLabel(platform: string) {
  const p = (platform || "").trim();
  if (!p || p === "unknown") return "Dispositivo";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function SecuritySection({caps}: Props) {
  const {user} = useAuth();
  const toast = useToast();
  const pwdTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!caps.sessions) return;
    setLoadingSessions(true);
    try {
      const res = await notificationApi.getActiveSessions();
      const data = res.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [caps.sessions]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const revokeOne = async (id: number) => {
    if (!confirm("¿Cerrar sesión en este dispositivo?")) return;
    setBusyId(id);
    try {
      await notificationApi.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sesión cerrada");
    } catch (err) {
      toast.error(errorUtils.getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const revokeAll = async () => {
    setRevokingAll(true);
    try {
      await notificationApi.revokeAllSessions();
      setSessions([]);
      setRevokeAllOpen(false);
      toast.success("Sesiones revocadas");
    } catch (err) {
      toast.error(errorUtils.getErrorMessage(err));
    } finally {
      setRevokingAll(false);
    }
  };

  const email = user?.email || "";
  const verified = Boolean(user?.emailVerified);
  const showVerifyAlert = caps.emailReadOnly && email && !verified;
  const showAccess = caps.emailReadOnly || caps.changePassword;
  /* >2 rows → list-like; span-full (and Acceso too so it is not a half orphan). */
  const sessionsSpan = caps.sessions && sessions.length > 2;
  const peerCount = Number(showAccess) + Number(caps.sessions);
  const layout = peerCount >= 2 && !sessionsSpan ? "grid" : "stack";

  return (
    <>
      <SettingsSectionGrid layout={layout}>
        {showAccess ? (
          <SettingsCard
            title="Acceso"
            description="Correo y contraseña"
            icon={ShieldCheckIcon}
            headingAs="h3"
            span={sessionsSpan ? "full" : "auto"}>
            {showVerifyAlert ? (
              <p className="nabbi-settings-inline-note" role="status">
                Verifica tu correo para recuperar tu cuenta.
              </p>
            ) : null}
            <div className="nabbi-settings-group__list">
              {caps.emailReadOnly ? (
                <SettingsRow
                  title="Correo electrónico"
                  description={
                    caps.emailChange
                      ? email
                      : `${email || "Sin correo"}. El correo no se puede cambiar desde aquí.`
                  }
                  descriptionTitle={email || undefined}
                  icon={EnvelopeIcon}
                  control="badge"
                  titleWrap
                  trailing={
                    verified ? (
                      <Badge tone="brand" size="sm">
                        Verificado
                      </Badge>
                    ) : email ? (
                      <Badge tone="neutral" size="sm">
                        Sin verificar
                      </Badge>
                    ) : null
                  }
                />
              ) : null}
              {caps.changePassword ? (
                <SettingsRow
                  title="Contraseña"
                  description="Usa una contraseña única y segura."
                  icon={KeyIcon}
                  control="wide"
                  trailing={
                    <button
                      ref={pwdTriggerRef}
                      type="button"
                      className="nabbi-settings-row__btn nabbi-settings-row__btn--outline"
                      onClick={() => setPwdOpen(true)}>
                      Cambiar contraseña
                    </button>
                  }
                />
              ) : null}
            </div>
          </SettingsCard>
        ) : null}

        {caps.sessions ? (
          <SettingsCard
            title="Sesiones activas"
            description="Dispositivos con notificaciones registradas"
            icon={ComputerDesktopIcon}
            headingAs="h3"
            span={sessionsSpan ? "full" : "auto"}>
            {loadingSessions ? (
              <p className="nabbi-settings-empty">Cargando…</p>
            ) : sessions.length === 0 ? (
              <p className="nabbi-settings-empty">
                No hay dispositivos con notificaciones registradas.
              </p>
            ) : (
              <ul className="nabbi-settings-group__list m-0 list-none p-0">
                {sessions.map((s) => {
                  const Icon = platformIcon(s.platform);
                  const when = s.last_seen_at || s.created_at;
                  const rel = when ? relativeTimeLabel(when) : "";
                  const abs = when ? absoluteTimeLabel(when) : "";
                  const label = platformLabel(s.platform);
                  return (
                    <li key={s.id}>
                      <SettingsRow
                        title={label}
                        description={
                          rel
                            ? `Última actividad: ${rel}`
                            : "Sin actividad reciente"
                        }
                        descriptionTitle={abs || undefined}
                        icon={Icon}
                        control="wide"
                        titleWrap
                        className="nabbi-settings-row--stack-md"
                        trailing={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busyId === s.id}
                            className="nabbi-settings-row__btn nabbi-settings-row__btn--danger-ghost"
                            onClick={() => void revokeOne(s.id)}>
                            {busyId === s.id ? "…" : "Cerrar sesión"}
                          </Button>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="nabbi-settings-card-footer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sessions.length === 0}
                className="nabbi-settings-row__btn nabbi-settings-row__btn--block"
                onClick={() => setRevokeAllOpen(true)}>
                Cerrar sesión en todos los demás dispositivos
              </Button>
            </div>
          </SettingsCard>
        ) : null}
      </SettingsSectionGrid>

      <ChangePasswordDrawer
        open={pwdOpen}
        onClose={() => {
          setPwdOpen(false);
          window.requestAnimationFrame(() => pwdTriggerRef.current?.focus());
        }}
      />

      <Dialog
        open={revokeAllOpen}
        onClose={() => {
          if (!revokingAll) setRevokeAllOpen(false);
        }}
        title="Cerrar otras sesiones"
        description="Se desactivarán todos los tokens de notificación registrados. Deberás volver a iniciar sesión en esos dispositivos para recibir avisos."
        size="sm"
        className="nabbi-settings-dialog"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={revokingAll}
              onClick={() => setRevokeAllOpen(false)}
              className="nabbi-settings-dialog__btn">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="error"
              size="sm"
              disabled={revokingAll}
              onClick={() => void revokeAll()}
              className="nabbi-settings-dialog__btn">
              {revokingAll ? "Cerrando…" : "Cerrar sesiones"}
            </Button>
          </>
        }
      />
    </>
  );
}
