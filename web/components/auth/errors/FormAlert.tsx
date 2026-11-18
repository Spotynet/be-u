"use client";

import Link from "next/link";
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type {AppError, AuthErrorAction} from "@/features/auth/errors";

interface FormAlertProps {
  error?: AppError | null;
  /** Convenience when you only have a message + severity */
  message?: string | null;
  severity?: AppError["severity"];
  action?: AuthErrorAction;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ICONS = {
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
} as const;

function actionLabel(action: AuthErrorAction): string {
  if (action.type === "login") return "Iniciar sesión";
  if (action.type === "verify") return "Verificar correo";
  if (action.type === "resend") return "Reenviar código";
  return action.label;
}

/** Form-level banner — restrained left accent (DesignSystem Feedback). */
export function FormAlert({
  error,
  message,
  severity = "error",
  action,
  onAction,
  onDismiss,
  className = "",
}: FormAlertProps) {
  const sev = error?.severity ?? severity;
  const text = error?.message ?? message;
  const act = error?.action ?? action;
  if (!text) return null;

  const Icon = ICONS[sev];
  const role = sev === "info" ? "status" : "alert";
  const live = sev === "info" ? "polite" : "assertive";

  return (
    <div
      id="auth-form-alert"
      className={`auth-form-alert auth-form-alert--${sev} ${className}`.trim()}
      role={role}
      aria-live={live}
      tabIndex={-1}>
      <Icon className="auth-form-alert__icon" aria-hidden="true" />
      <div className="auth-form-alert__body">
        <p className="auth-form-alert__message">{text}</p>
        {act ? (
          act.type === "login" && !onAction ? (
            <Link href="/login" className="auth-form-alert__action lp-focus" prefetch>
              {actionLabel(act)}
            </Link>
          ) : (
            <button
              type="button"
              className="auth-form-alert__action lp-focus"
              onClick={onAction}>
              {actionLabel(act)}
            </button>
          )
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="auth-form-alert__dismiss lp-focus"
          aria-label="Cerrar aviso"
          onClick={onDismiss}>
          <XMarkIcon aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
