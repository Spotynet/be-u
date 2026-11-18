"use client";

import {ExclamationCircleIcon} from "@heroicons/react/24/outline";

interface FieldErrorProps {
  id?: string;
  message?: string | null;
}

/** Inline field error — icon + text, enter animation, no reserved empty space. */
export function FieldError({id, message}: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="auth-field-error" role="alert">
      <ExclamationCircleIcon className="auth-field-error__icon" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
