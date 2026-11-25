"use client";

import {useState} from "react";
import Link from "next/link";
import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {authApi, errorUtils} from "@/lib/api";

export default function DeleteAccountPage() {
  usePageHeader({title: "Eliminar cuenta", pageOwnsTitle: true});
  const {logout} = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === "ELIMINAR";

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm("¿Confirmas eliminar tu cuenta de forma permanente?"))
      return;
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
    <StackLayout>
      <PageHeaderRow
        title="Eliminar cuenta"
        description="Se eliminarán permanentemente tu perfil, reservas, publicaciones y datos asociados. Esta acción no se puede deshacer."
        meta={
          <Link
            href="/privacy"
            className="text-[13px] font-bold text-primary hover:underline">
            ← Privacidad
          </Link>
        }
      />

      <section className="rounded-[var(--card-radius)] border border-error/40 bg-card p-[var(--card-pad)] shadow-card">
        <CardHeader
          title="Confirmación"
          icon={ExclamationTriangleIcon}
          description="Escribe ELIMINAR para confirmar"
        />
        <div className="mt-4">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
            className="mb-3 w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 py-2.5 text-foreground"
          />
          {error ? (
            <p className="mb-3 text-[14px] text-error">{error}</p>
          ) : null}
          <Button
            type="button"
            variant="error"
            disabled={!canDelete || busy}
            onClick={handleDelete}
            className="w-full">
            {busy ? "Eliminando…" : "Eliminar mi cuenta"}
          </Button>
        </div>
      </section>
    </StackLayout>
  );
}
