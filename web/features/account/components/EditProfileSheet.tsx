"use client";

import {useEffect, useId, useState} from "react";
import {Dialog} from "@/components/ui/Dialog";
import {useToast} from "@/components/ui/Toast";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {errorUtils} from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Edit profile — Dialog (bottom sheet on narrow, centered on sm+).
 * Fields limited to PUT /auth/profile/ (firstName, lastName, phone).
 * Email read-only. Location/alerts managed elsewhere (shell overlay / prefs).
 */
export function EditProfileSheet({open, onClose}: Props) {
  const {user, updateProfile, isLoading} = useAuth();
  const toast = useToast();
  const formId = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    const p =
      user.phoneNumber ||
      (user as {phone?: string}).phone ||
      "";
    setPhone(p);
    setFieldError(null);
  }, [open, user]);

  const pristine =
    firstName === (user?.firstName || "") &&
    lastName === (user?.lastName || "") &&
    phone ===
      (user?.phoneNumber || (user as {phone?: string} | null)?.phone || "");

  const onSave = async () => {
    if (!firstName.trim()) {
      setFieldError("El nombre es obligatorio.");
      return;
    }
    setFieldError(null);
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim() || undefined,
        ...({phone: phone.trim() || undefined} as object),
      } as Parameters<typeof updateProfile>[0]);
      toast.success("Perfil actualizado");
      onClose();
    } catch (err) {
      const msg = errorUtils.getErrorMessage(err);
      setFieldError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Editar perfil"
      description="Actualiza tu nombre y teléfono. El correo no se puede cambiar aquí."
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-semibold text-foreground-secondary outline-none hover:bg-foreground-muted/10 focus-visible:ring-2 focus-visible:ring-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={pristine || saving || isLoading}
            className="inline-flex h-11 items-center justify-center rounded-full bg-secondary px-5 text-[14px] font-bold text-secondary-foreground outline-none hover:bg-secondary-hover focus-visible:ring-2 focus-visible:ring-secondary disabled:pointer-events-none disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </>
      }>
      <form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave();
        }}>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-foreground-muted">
            Nombre
          </span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            className="h-11 w-full rounded-[12px] border border-card-border bg-card px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-foreground-muted">
            Apellido
          </span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            className="h-11 w-full rounded-[12px] border border-card-border bg-card px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-foreground-muted">
            Teléfono
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="h-11 w-full rounded-[12px] border border-card-border bg-card px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-foreground-muted">
            Correo
          </span>
          <input
            type="email"
            value={user?.email || ""}
            readOnly
            disabled
            className="h-11 w-full cursor-not-allowed rounded-[12px] border border-card-border bg-foreground-muted/8 px-3 text-[14px] text-foreground-secondary"
          />
          <p className="mt-1.5 text-[12px] text-foreground-muted">
            El correo no se puede cambiar aquí.
          </p>
        </div>
        {fieldError ? (
          <p className="text-[13px] font-medium text-error" role="alert">
            {fieldError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
