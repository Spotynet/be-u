"use client";

import {useState} from "react";
import {AppleIcon} from "@/components/icons/AppleIcon";
import {GoogleIcon} from "@/components/icons/GoogleIcon";
import {handleSocialLogin, type SocialProvider} from "@/features/auth/socialLogin";
import {buildAppError, type AppError} from "@/features/auth/errors";

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: "Google",
  apple: "Apple",
};

interface AuthSocialButtonsProps {
  /** Login-only — register no longer shows social buttons. */
  mode?: "login";
  disabled?: boolean;
  /** Preferred: catalog-backed AppError (toast / form). */
  onAppError?: (error: AppError) => void;
  /** @deprecated Prefer onAppError */
  onMessage?: (message: string) => void;
}

export function AuthSocialButtons({
  disabled = false,
  onAppError,
  onMessage,
}: AuthSocialButtonsProps) {
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const locked = disabled || busy !== null;

  const onProvider = (provider: SocialProvider) => {
    if (locked) return;
    setBusy(provider);
    // Stub only — no API. Surface via catalog social_unavailable.
    handleSocialLogin(provider);
    const appErr = buildAppError("social_unavailable", {
      params: {proveedor: PROVIDER_LABEL[provider]},
    });
    onAppError?.(appErr);
    onMessage?.(appErr.message);
    window.setTimeout(() => setBusy(null), 180);
  };

  return (
    <div className="auth-social">
      <div className="auth-social__divider" role="separator" aria-label="O continúa con">
        <span className="auth-social__divider-line" aria-hidden="true" />
        <span className="auth-social__divider-label">O continúa con</span>
        <span className="auth-social__divider-line" aria-hidden="true" />
      </div>

      <div className="auth-social__grid">
        <button
          type="button"
          className="auth-social__btn lp-focus"
          aria-label="Continuar con Google"
          disabled={locked}
          onClick={() => onProvider("google")}>
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button
          type="button"
          className="auth-social__btn lp-focus"
          aria-label="Continuar con Apple"
          disabled={locked}
          onClick={() => onProvider("apple")}>
          <AppleIcon />
          <span>Apple</span>
        </button>
      </div>
    </div>
  );
}
