"use client";

import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type {AuthToastItem} from "@/features/auth/errors";

interface AuthToastRegionProps {
  toasts: AuthToastItem[];
  onDismiss: (id: string) => void;
  onPause: () => void;
  onResume: () => void;
}

const ICONS = {
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
} as const;

/** Fixed aria-live toast stack for transient auth notices. */
export function AuthToastRegion({toasts, onDismiss, onPause, onResume}: AuthToastRegionProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="auth-toast-region"
      aria-live="polite"
      aria-relevant="additions text"
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}>
      {toasts.map((toast) => {
        const Icon = ICONS[toast.severity];
        return (
          <div
            key={toast.id}
            className={`auth-toast auth-toast--${toast.severity}`}
            role="status">
            <Icon className="auth-toast__icon" aria-hidden="true" />
            <p className="auth-toast__message">{toast.message}</p>
            <button
              type="button"
              className="auth-toast__dismiss lp-focus"
              aria-label="Cerrar"
              onClick={() => onDismiss(toast.id)}>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
