"use client";

import Link from "next/link";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole, normalizeRole} from "@/lib/roles";
import {PageContainer} from "@/components/layout/PageContainer";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";

export default function MePage() {
  const {user, logout} = useAuth();
  const provider = isProviderRole(user?.role);
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.email ||
    "Usuario";

  return (
    <PageContainer size="sm">
      <h1 className="nabbi-page-title">Perfil</h1>
      <p className="nabbi-page-sub">Tu cuenta en nabbi web.</p>

      <div className="nabbi-card" style={{marginBottom: 16, borderRadius: 18}}>
        <div style={{fontWeight: 900, fontSize: 20, color: INK, wordBreak: "break-word"}}>
          {displayName}
        </div>
        <div style={{color: "#64748b", fontSize: 14, marginTop: 4, wordBreak: "break-all"}}>
          {user?.email}
        </div>
        <div
          style={{
            marginTop: 10,
            display: "inline-block",
            background: "rgba(85,131,103,0.12)",
            color: MAIN,
            fontWeight: 800,
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 999,
            letterSpacing: "0.04em",
          }}>
          {normalizeRole(user?.role) || "—"}
        </div>
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: 8}}>
        <SettingsLink href="/feed" label="Ir al feed" />
        <SettingsLink href="/notifications" label="Notificaciones" />
        <SettingsLink href="/favorites" label="Favoritos / Guardados" />
        {provider && (
          <>
            <SettingsLink href="/profile" label="Editar perfil público y servicios" />
            <SettingsLink href="/schedule" label="Horarios / disponibilidad" />
            <SettingsLink href="/group-sessions" label="Sesiones grupales" />
            <SettingsLink href="/links" label="Equipo / vinculaciones" />
            <SettingsLink href="/google-calendar" label="Google Calendar" />
            <SettingsLink href="/dashboard" label="Ir al dashboard" />
            <SettingsLink href="/mis-resenas" label="Mis reseñas" />
          </>
        )}
        <SettingsLink href="/reservations" label="Mis reservas" />
        <SettingsLink href="/help" label="Ayuda y soporte" />
        <SettingsLink href="/privacy" label="Privacidad y seguridad" />
        <SettingsLink href="/aviso-de-privacidad" label="Aviso de privacidad" />
        <SettingsLink href="/terminos-y-condiciones" label="Términos y condiciones" />
      </div>

      <button
        type="button"
        onClick={logout}
        style={{
          marginTop: 24,
          width: "100%",
          background: "transparent",
          border: `1.5px solid rgba(18,33,26,0.15)`,
          borderRadius: 12,
          padding: "12px 16px",
          fontWeight: 700,
          color: DARK,
          cursor: "pointer",
        }}>
        Cerrar sesión
      </button>
    </PageContainer>
  );
}

function SettingsLink({href, label}: {href: string; label: string}) {
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
        color: INK,
        fontWeight: 700,
        fontSize: 14,
      }}>
      {label}
    </Link>
  );
}
