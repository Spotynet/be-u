"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useState} from "react";
import Link from "next/link";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {authApi, errorUtils} from "@/lib/api";

const INK = "#12211A";

export default function DeleteAccountPage() {
  const {logout} = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === "ELIMINAR";

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm("¿Confirmas eliminar tu cuenta de forma permanente?")) return;
    setBusy(true);
    setError(null);
    try {
      await authApi.deleteMyAccount();
      logout();
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <PageContainer size="sm">
      <Link href="/privacy" style={{color: "#558367", fontWeight: 700, textDecoration: "none", fontSize: 14}}>
        ← Privacidad
      </Link>
      <h1 className="nabbi-page-title" style={{marginTop: 12}}>
        Eliminar cuenta
      </h1>
      <p className="nabbi-page-sub">
        Se eliminarán permanentemente tu perfil, reservas, publicaciones y datos asociados. Esta
        acción <strong>no se puede deshacer</strong>.
      </p>

      <div
        style={{
          background: "white",
          border: "1px solid #fca5a5",
          borderRadius: 16,
          padding: 16,
        }}>
        <p style={{fontSize: 14, color: INK, marginTop: 0}}>
          Escribe <strong>ELIMINAR</strong> para confirmar:
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="ELIMINAR"
          style={{
            width: "100%",
            border: "1px solid rgba(18,33,26,0.15)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 12,
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{color: "#dc2626", fontSize: 14, marginBottom: 12}}>{error}</p>
        )}
        <button
          type="button"
          disabled={!canDelete || busy}
          onClick={handleDelete}
          style={{
            width: "100%",
            background: canDelete ? "#dc2626" : "#fca5a5",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "14px 16px",
            fontWeight: 800,
            cursor: canDelete && !busy ? "pointer" : "not-allowed",
          }}>
          {busy ? "Eliminando…" : "Eliminar mi cuenta"}
        </button>
      </div>
    </PageContainer>
  );
}
