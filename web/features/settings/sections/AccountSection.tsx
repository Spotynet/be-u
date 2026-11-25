"use client";

import {useState} from "react";
import {
  ArrowRightOnRectangleIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {Button} from "@/components/ui/Button";
import {Dialog} from "@/components/ui/Dialog";
import {useToast} from "@/components/ui/Toast";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {authApi, errorUtils} from "@/lib/api";
import {SettingsCard} from "../components/SettingsCard";
import {SettingsRow} from "../components/SettingsRow";
import {SettingsSectionGrid} from "../components/SettingsSectionGrid";
import type {SettingsCapability} from "../settingsConfig";

type Props = {
  caps: SettingsCapability;
};

export function AccountSection({caps}: Props) {
  const {logout} = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === "ELIMINAR";

  const onDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    setError(null);
    try {
      await authApi.deleteMyAccount();
      toast.success("Cuenta eliminada");
      logout();
    } catch (err) {
      const msg = errorUtils.getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <>
      <SettingsSectionGrid layout="stack">
        {caps.logout ? (
          <SettingsCard
            title="Cuenta"
            description="Sesión en este dispositivo"
            icon={UserCircleIcon}
            headingAs="h3">
            <div className="nabbi-settings-group__list">
              <SettingsRow
                title="Cerrar sesión"
                description="Salir de nabbi en este dispositivo"
                icon={ArrowRightOnRectangleIcon}
                control="wide"
                trailing={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="nabbi-settings-row__btn">
                    Salir
                  </Button>
                }
              />
            </div>
          </SettingsCard>
        ) : null}

        {caps.deleteAccount ? (
          <SettingsCard
            title="Zona delicada"
            description="Acciones permanentes"
            icon={TrashIcon}
            headingAs="h3"
            danger>
            <div className="nabbi-settings-group__list">
              <SettingsRow
                title="Eliminar cuenta"
                description="Se borrarán tu perfil, reservas y datos. No se puede deshacer."
                icon={TrashIcon}
                danger
                control="wide"
                trailing={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfirmText("");
                      setError(null);
                      setOpen(true);
                    }}
                    className="nabbi-settings-row__btn nabbi-settings-row__btn--danger">
                    Eliminar
                  </Button>
                }
              />
            </div>
          </SettingsCard>
        ) : null}
      </SettingsSectionGrid>

      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title="Eliminar cuenta"
        description="Escribe ELIMINAR para confirmar. Esta acción es permanente."
        size="sm"
        className="nabbi-settings-dialog"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="nabbi-settings-dialog__btn">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="error"
              size="sm"
              disabled={!canDelete || busy}
              onClick={onDelete}
              className="nabbi-settings-dialog__btn">
              {busy ? "Eliminando…" : "Eliminar mi cuenta"}
            </Button>
          </>
        }>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold text-foreground-secondary">
            Confirmación
          </span>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
            autoComplete="off"
            className="nabbi-settings-field"
          />
        </label>
        {error ? (
          <p className="mt-3 text-[13px] font-medium text-error" role="alert">
            {error}
          </p>
        ) : null}
      </Dialog>
    </>
  );
}
