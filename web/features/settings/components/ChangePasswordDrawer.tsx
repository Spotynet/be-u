"use client";

import {useEffect, useId, useMemo, useState} from "react";
import {EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/ui/Button";
import {Dialog} from "@/components/ui/Dialog";
import {useToast} from "@/components/ui/Toast";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {errorUtils} from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Strength = {level: 0 | 1 | 2 | 3 | 4; label: string};

function scorePassword(pw: string): Strength {
  if (!pw) return {level: 0, label: ""};
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-ZÁÉÍÓÚÑ]/.test(pw) && /[a-záéíóúñ]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const level = Math.min(4, score) as Strength["level"];
  const label =
    level <= 1 ? "Débil" : level <= 3 ? "Media" : "Fuerte";
  return {level, label};
}

function mapPasswordError(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("old password") || t.includes("incorrect")) {
    return "La contraseña actual no es correcta.";
  }
  if (t.includes("don't match") || t.includes("do not match") || t.includes("coincid")) {
    return "Las contraseñas nuevas no coinciden.";
  }
  if (t.includes("too common") || t.includes("common")) {
    return "Esa contraseña es demasiado común. Elige otra.";
  }
  if (t.includes("too short") || t.includes("at least") || t.includes("mínimo") || t.includes("minimum")) {
    return "La nueva contraseña debe tener al menos 8 caracteres.";
  }
  if (t.includes("entirely numeric") || t.includes("numeric")) {
    return "La contraseña no puede ser solo números.";
  }
  if (t.includes("similar") || t.includes("atribut")) {
    return "La contraseña es demasiado parecida a tus datos.";
  }
  return raw || "No pudimos actualizar la contraseña.";
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  describedBy,
  invalid,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  describedBy?: string;
  invalid?: boolean;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-foreground-secondary">
        {label}
      </span>
      <span className="relative block">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          required
          className="nabbi-settings-field nabbi-settings-field--password"
        />
        <button
          type="button"
          className="nabbi-settings-field__reveal"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          onClick={onToggleVisible}>
          {visible ? (
            <EyeSlashIcon className="h-4 w-4" aria-hidden />
          ) : (
            <EyeIcon className="h-4 w-4" aria-hidden />
          )}
        </button>
      </span>
    </label>
  );
}

/**
 * Change-password sheet (Dialog = bottom sheet &lt;sm, centered ≥sm).
 * Calls existing authApi.changePassword (PARTIAL backend URL).
 */
export function ChangePasswordDrawer({open, onClose}: Props) {
  const {changePassword, isLoading} = useAuth();
  const toast = useToast();
  const formId = useId();
  const strengthId = useId();
  const errorId = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const strength = useMemo(() => scorePassword(next), [next]);
  const rules = useMemo(
    () => [
      {ok: next.length >= 8, text: "Mínimo 8 caracteres"},
      {
        ok: /[A-Za-z]/.test(next) && /\d/.test(next),
        text: "Letras y números",
      },
      {
        ok: next.length > 0 && next === confirm,
        text: "Las contraseñas coinciden",
      },
    ],
    [next, confirm],
  );

  useEffect(() => {
    if (!open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      setShowCur(false);
      setShowNext(false);
      setShowConfirm(false);
      setSaving(false);
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (next !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await changePassword({oldPassword: current, newPassword: next});
      toast.success("Contraseña actualizada");
      onClose();
    } catch (err) {
      setError(mapPasswordError(errorUtils.getErrorMessage(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Cambiar contraseña"
      description="Usa una contraseña única y segura."
      size="md"
      className="nabbi-settings-dialog"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={onClose}
            className="nabbi-settings-dialog__btn">
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            disabled={saving || isLoading}
            className="nabbi-settings-dialog__btn">
            {saving ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
        </>
      }>
      <form id={formId} className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Field
          id={`${formId}-cur`}
          label="Contraseña actual"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          visible={showCur}
          onToggleVisible={() => setShowCur((v) => !v)}
          invalid={Boolean(error)}
          describedBy={error ? errorId : undefined}
        />
        <Field
          id={`${formId}-new`}
          label="Nueva contraseña"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          visible={showNext}
          onToggleVisible={() => setShowNext((v) => !v)}
          describedBy={strengthId}
        />
        {next ? (
          <div id={strengthId} className="nabbi-pwd-strength" aria-live="polite">
            <div className="nabbi-pwd-strength__track" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={[
                    "nabbi-pwd-strength__seg",
                    strength.level >= i ? `is-${strength.level}` : "",
                  ].join(" ")}
                />
              ))}
            </div>
            <p className="nabbi-pwd-strength__label">{strength.label}</p>
          </div>
        ) : null}
        <ul className="m-0 list-none space-y-1 p-0" aria-label="Requisitos">
          {rules.map((r) => (
            <li
              key={r.text}
              className={[
                "text-[12px]",
                r.ok ? "text-primary-dark" : "text-foreground-muted",
              ].join(" ")}>
              {r.ok ? "Cumple: " : "Pendiente: "}
              {r.text}
            </li>
          ))}
        </ul>
        <Field
          id={`${formId}-confirm`}
          label="Confirmar nueva contraseña"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          visible={showConfirm}
          onToggleVisible={() => setShowConfirm((v) => !v)}
        />
        {error ? (
          <p id={errorId} className="text-[13px] font-medium text-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
