"use client";

import Link from "next/link";
import {FieldError} from "@/components/auth/errors/FieldError";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string | null;
}

/** Single terms control — rendered once per flow (personal for client, business for pro/place). */
export function TermsCheckbox({checked, onChange, disabled, error}: TermsCheckboxProps) {
  return (
    <div className="auth-terms-wrap">
      <label className={`auth-terms${error ? " auth-terms--error" : ""}`}>
        <input
          type="checkbox"
          name="acceptedTerms"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="auth-checkbox"
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "auth-terms-error" : undefined}
          onInvalid={(e) => e.preventDefault()}
        />
        <span>
          Acepto los{" "}
          <Link href="/terminos-y-condiciones" className="auth-legal-link">
            términos y condiciones
          </Link>{" "}
          y el{" "}
          <Link href="/aviso-de-privacidad" className="auth-legal-link">
            aviso de privacidad
          </Link>
          .
        </span>
      </label>
      <FieldError id="auth-terms-error" message={error} />
    </div>
  );
}
