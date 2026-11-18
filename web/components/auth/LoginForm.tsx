"use client";

import {useRef, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {EnvelopeIcon} from "@heroicons/react/24/outline";
import {NabbiLogo} from "@/components/brand/NabbiLogo";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {
  buildAppError,
  parseApiError,
  useAuthToast,
  useFormErrors,
  useOnlineStatus,
  validateCode,
  validateEmail,
} from "@/features/auth/errors";
import {homePathForRole} from "@/lib/roles";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {FormAlert} from "@/components/auth/errors/FormAlert";
import {AuthToastRegion} from "@/components/auth/errors/AuthToastRegion";
import {RateLimitNotice, useCountdown} from "@/components/auth/errors/RateLimitNotice";
import {OtpCodeInput, type OtpCodeInputHandle} from "@/components/auth/OtpCodeInput";

const EMAIL_DOMAIN_CHIPS = ["@gmail.com", "@outlook.com", "@icloud.com"] as const;

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onNeedsRegistration?: (email: string) => void;
  spacious?: boolean;
  embedded?: boolean;
}

export const LoginForm = ({
  onSwitchToRegister,
  onNeedsRegistration,
  spacious = false,
  embedded = false,
}: LoginFormProps) => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [otpShake, setOtpShake] = useState(0);
  const [otpLocked, setOtpLocked] = useState(false);
  const {requestEmailCode, loginWithEmailCode, clearError, isLoading} = useAuth();
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<OtpCodeInputHandle>(null);
  const online = useOnlineStatus();
  const errors = useFormErrors();
  const toast = useAuthToast();
  const rateLimit = useCountdown(0);

  const showDomainChips =
    step === "email" && email.length > 0 && !email.includes("@");

  const resetMessages = () => {
    errors.clearAll();
    setSuccessMessage(null);
    if (clearError) clearError();
  };

  const appendDomain = (domain: string) => {
    const local = email.trim();
    if (!local || local.includes("@")) return;
    setEmail(`${local}${domain}`);
    errors.clearField("email");
    requestAnimationFrame(() => emailInputRef.current?.focus());
  };

  const handleApiError = (err: unknown) => {
    const appErr = parseApiError(err);
    if (appErr.scope === "toast") {
      toast.push(appErr);
      return appErr;
    }
    if (appErr.code === "rate_limited" || appErr.code === "resend_cooldown") {
      rateLimit.reset(appErr.retryAfter ?? 30);
    }
    if (appErr.code === "invalid_code") {
      setCode("");
      setOtpShake((n) => n + 1);
      otpRef.current?.focusFirst();
      errors.setFromApiError(appErr);
      return appErr;
    }
    if (appErr.code === "too_many_attempts" || appErr.code === "code_expired") {
      setOtpLocked(true);
    }
    if (appErr.code === "email_not_verified") {
      errors.setFromApiError(appErr);
      return appErr;
    }
    errors.setFromApiError(appErr);
    return appErr;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setTouched((t) => ({...t, email: true}));

    const emailCode = validateEmail(email);
    if (emailCode) {
      errors.setFieldError("email", emailCode);
      emailInputRef.current?.focus();
      return;
    }
    if (!online) {
      errors.setFormError(buildAppError("network_offline"));
      return;
    }
    if (rateLimit.active) return;

    try {
      const trimmed = email.trim();
      await requestEmailCode(trimmed);
      setEmail(trimmed);
      setStep("code");
      setOtpLocked(false);
      setSuccessMessage("Te enviamos un código de 6 dígitos a tu correo.");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setTouched((t) => ({...t, code: true}));

    const codeErr = validateCode(code);
    if (codeErr) {
      errors.setFieldError("code", codeErr);
      otpRef.current?.focusFirst();
      return;
    }
    if (!online) {
      errors.setFormError(buildAppError("network_offline"));
      return;
    }

    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
    try {
      const result = await loginWithEmailCode({email, code: normalizedCode});
      if (result === "requires_registration") {
        if (onNeedsRegistration) onNeedsRegistration(email);
        else router.push(`/register?email=${encodeURIComponent(email)}`);
        return;
      }
      const next =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      if (next && next.startsWith("/")) {
        router.push(next);
        return;
      }
      const {authApi} = await import("@/lib/api");
      try {
        const profile = await authApi.getProfile();
        router.push(homePathForRole(profile.data.user?.role));
      } catch {
        router.push("/feed");
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleResendCode = async () => {
    resetMessages();
    if (!online) {
      errors.setFormError(buildAppError("network_offline"));
      return;
    }
    if (rateLimit.active) return;
    try {
      await requestEmailCode(email);
      setCode("");
      setOtpLocked(false);
      setSuccessMessage("Te enviamos un nuevo código.");
    } catch (err) {
      handleApiError(err);
    }
  };

  const emailError =
    touched.email || errors.fieldErrors.email ? errors.fieldErrors.email : undefined;
  const offlineAlert = !online ? buildAppError("network_offline") : null;
  const formBanner = offlineAlert || errors.formError;

  return (
    <div
      className={`auth-form-panel${spacious ? " auth-form-panel--spacious" : ""}${embedded ? " auth-form-panel--embedded" : ""}`}>
      {!embedded ? (
        <NabbiLogo variant="auth-mobile" href={null} />
      ) : null}

      <div className="auth-form-header">
        <h1
          id="auth-form-title"
          className={`auth-title${embedded ? " auth-title--embedded" : ""}`}
          tabIndex={-1}
          aria-live="polite">
          {step === "email"
            ? embedded
              ? "Entra con tu correo"
              : "Iniciar sesión"
            : "Ingresa el código"}
        </h1>
        <p className="auth-subtitle">
          {step === "email" ? (
            "Te enviamos un código a tu correo para entrar. Sin contraseñas."
          ) : (
            <>
              Código enviado a <strong className="auth-subtitle__em">{email}</strong>.
            </>
          )}
        </p>
      </div>

      <form
        className="auth-form"
        noValidate
        onSubmit={step === "email" ? handleEmailSubmit : handleCodeSubmit}>
        {step === "email" ? (
          <div className="auth-field-stack">
            <Input
              ref={emailInputRef}
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="ana@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                errors.clearField("email");
                if (errors.formError) errors.setFormError(null);
              }}
              onBlur={() => {
                setTouched((t) => ({...t, email: true}));
                const code = validateEmail(email);
                if (code) errors.setFieldError("email", code);
                else errors.clearField("email");
              }}
              disabled={isLoading || rateLimit.active}
              error={emailError}
              leadingIcon={<EnvelopeIcon className="nabbi-field__icon-svg" />}
            />
            {showDomainChips ? (
              <div
                className="auth-domain-chips"
                role="group"
                aria-label="Dominios de correo sugeridos">
                {EMAIL_DOMAIN_CHIPS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    className="auth-domain-chip lp-focus"
                    onClick={() => appendDomain(domain)}
                    disabled={isLoading}>
                    {domain}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="auth-field-stack">
            <OtpCodeInput
              ref={otpRef}
              value={code}
              onChange={(next) => {
                setCode(next);
                errors.clearField("code");
                if (errors.formError) errors.setFormError(null);
              }}
              disabled={isLoading || otpLocked}
              error={errors.fieldErrors.code}
              shakeToken={otpShake}
              id="login-otp"
            />
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading || rateLimit.active || !online}
              className="auth-text-action lp-focus auth-text-action--primary">
              Reenviar código
            </button>
          </div>
        )}

        {successMessage && !formBanner ? (
          <FormAlert message={successMessage} severity="info" />
        ) : null}

        {formBanner ? (
          <FormAlert
            error={formBanner}
            onAction={
              formBanner.action?.type === "resend"
                ? () => void handleResendCode()
                : formBanner.action?.type === "verify"
                  ? () =>
                      router.push(
                        `/register?email=${encodeURIComponent(email.trim())}`
                      )
                  : undefined
            }
            onDismiss={offlineAlert ? undefined : () => errors.setFormError(null)}
          />
        ) : null}

        {rateLimit.active ? (
          <RateLimitNotice
            seconds={rateLimit.left}
            onDone={() => rateLimit.clear()}
            label="Demasiados intentos. Espera {time} e inténtalo de nuevo."
          />
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading || !online || rateLimit.active || (step === "code" && otpLocked)}
          className="w-full auth-cta">
          {isLoading ? (
            <span className="auth-btn-loading">
              <span className="auth-spinner" aria-hidden="true" />
              {step === "email" ? "Enviando código..." : "Verificando código..."}
            </span>
          ) : !online ? (
            "Sin conexión"
          ) : step === "email" ? (
            "Enviar código"
          ) : (
            "Verificar código"
          )}
        </Button>

        {step === "code" ? (
          <button
            type="button"
            className="auth-text-action lp-focus auth-text-action--muted"
            onClick={() => {
              setStep("email");
              setCode("");
              setOtpLocked(false);
              resetMessages();
            }}
            disabled={isLoading}>
            Usar otro correo
          </button>
        ) : null}

        <p className="auth-footer-note auth-footer-note--after-cta">
          ¿No tienes cuenta?{" "}
          {onSwitchToRegister ? (
            <button
              type="button"
              className="auth-inline-switch lp-focus"
              onClick={() => {
                resetMessages();
                onSwitchToRegister();
              }}
              aria-label="Crear cuenta: ir al formulario de registro">
              Crear cuenta
            </button>
          ) : (
            <Link
              href="/register"
              prefetch
              className="auth-inline-switch lp-focus"
              aria-label="Crear cuenta: ir al formulario de registro">
              Crear cuenta
            </Link>
          )}
        </p>
      </form>

      <AuthToastRegion
        toasts={toast.toasts}
        onDismiss={toast.dismiss}
        onPause={toast.pause}
        onResume={toast.resume}
      />
    </div>
  );
};
