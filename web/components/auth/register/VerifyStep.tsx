"use client";

import {useEffect, useRef, useState} from "react";
import {OtpCodeInput, type OtpCodeInputHandle} from "@/components/auth/OtpCodeInput";
import {FormAlert} from "@/components/auth/errors/FormAlert";
import type {AppError} from "@/features/auth/errors";

export const REGISTER_STEP_3_FORM_ID = "register-step-3-form";

interface VerifyStepProps {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onChangeEmail: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => Promise<void> | void;
  initialResendSeconds?: number;
  codeError?: string | null;
  formError?: AppError | null;
  shakeToken?: string | number | null;
  otpDisabled?: boolean;
  isLoading: boolean;
  titleId: string;
  onClearFormError?: () => void;
}

export function VerifyStep({
  email,
  code,
  onCodeChange,
  onChangeEmail,
  onSubmit,
  onResend,
  initialResendSeconds = 30,
  codeError,
  formError,
  shakeToken,
  otpDisabled = false,
  isLoading,
  titleId,
  onClearFormError,
}: VerifyStepProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialResendSeconds);
  const [resending, setResending] = useState(false);
  const otpRef = useRef<OtpCodeInputHandle>(null);

  useEffect(() => {
    setSecondsLeft(initialResendSeconds);
  }, [initialResendSeconds, email]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (shakeToken != null && shakeToken !== "") {
      otpRef.current?.focusFirst();
    }
  }, [shakeToken]);

  const canResend = secondsLeft <= 0 && !isLoading && !resending;

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      await onResend();
      setSecondsLeft(initialResendSeconds > 0 ? initialResendSeconds : 30);
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
  const secs = Math.max(secondsLeft, 0) % 60;
  const countdown = `${minutes}:${secs.toString().padStart(2, "0")}`;

  const showResendAction =
    formError?.action?.type === "resend" ||
    formError?.code === "code_expired" ||
    formError?.code === "too_many_attempts" ||
    formError?.code === "no_active_code";

  return (
    <div className="reg-step reg-step--verify">
      <div className="auth-form-header">
        <h1
          id={titleId}
          className="auth-title auth-title--embedded"
          tabIndex={-1}
          aria-live="polite">
          Verifica tu correo
        </h1>
        <p className="auth-subtitle">
          Enviamos un código de 6 dígitos a{" "}
          <strong className="auth-subtitle__em">{email}</strong>. Escríbelo para continuar.
        </p>
        <button
          type="button"
          className="auth-text-action lp-focus auth-text-action--primary auth-text-action--start"
          onClick={onChangeEmail}
          disabled={isLoading || resending}>
          Cambiar correo
        </button>
      </div>

      <form id={REGISTER_STEP_3_FORM_ID} className="auth-form" noValidate onSubmit={onSubmit}>
        <OtpCodeInput
          ref={otpRef}
          value={code}
          onChange={onCodeChange}
          disabled={isLoading || resending || otpDisabled}
          error={codeError}
          shakeToken={shakeToken}
          id="register-otp"
        />

        {formError && !codeError ? (
          <FormAlert
            error={formError}
            onAction={showResendAction ? () => void handleResend() : undefined}
            onDismiss={onClearFormError}
          />
        ) : null}

        <button
          type="button"
          className="auth-text-action lp-focus auth-text-action--primary"
          onClick={handleResend}
          disabled={!canResend}>
          {canResend
            ? "¿No recibiste el código? Reenviar"
            : `Reenviar en ${countdown}`}
        </button>
      </form>
    </div>
  );
}
