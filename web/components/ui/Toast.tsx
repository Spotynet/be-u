"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export type ToastTone = "success" | "error" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
};

export type ToastPushOptions = {
  action?: ToastAction;
  /** Auto-dismiss ms. Default 4000. */
  duration?: number;
};

type ToastContextValue = {
  push: (
    message: string,
    tone?: ToastTone,
    options?: ToastPushOptions,
  ) => string;
  success: (message?: string, options?: ToastPushOptions) => string;
  error: (message?: string, options?: ToastPushOptions) => string;
  info: (message?: string, options?: ToastPushOptions) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 4000;

const ICONS = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  info: InformationCircleIcon,
} as const;

const TONE_CLASS: Record<ToastTone, string> = {
  success: "border-success/30 bg-card text-foreground",
  error: "border-error/35 bg-card text-foreground",
  info: "border-primary/30 bg-card text-foreground",
};

const ICON_CLASS: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-error",
  info: "text-primary",
};

const DEFAULTS: Record<ToastTone, string> = {
  success: "Listo",
  error: "Algo salió mal. Inténtalo de nuevo.",
  info: "Información",
};

export function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const remaining = useRef<Map<string, number>>(new Map());
  const paused = useRef(false);

  const clearTimer = (id: string) => {
    const t = timers.current.get(id);
    if (t != null) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  };

  const dismiss = useCallback((id: string) => {
    clearTimer(id);
    remaining.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback(
    (id: string, ms: number) => {
      clearTimer(id);
      remaining.current.set(id, Date.now() + ms);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), ms),
      );
    },
    [dismiss],
  );

  const push = useCallback(
    (
      message: string,
      tone: ToastTone = "info",
      options?: ToastPushOptions,
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        ...prev.slice(-3),
        {id, message, tone, action: options?.action},
      ]);
      schedule(id, options?.duration ?? DISMISS_MS);
      return id;
    },
    [schedule],
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (m, options) =>
        push(m ?? DEFAULTS.success, "success", options),
      error: (m, options) => push(m ?? DEFAULTS.error, "error", options),
      info: (m, options) => push(m ?? DEFAULTS.info, "info", options),
      dismiss,
    }),
    [push, dismiss],
  );

  const pause = () => {
    paused.current = true;
    timers.current.forEach((_, id) => {
      const until = remaining.current.get(id);
      if (until != null)
        remaining.current.set(id, Math.max(0, until - Date.now()));
      clearTimer(id);
    });
  };

  const resume = () => {
    paused.current = false;
    remaining.current.forEach((left, id) => {
      schedule(id, left > 0 ? left : DISMISS_MS);
    });
  };

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="z-shell-toast pointer-events-none fixed inset-x-0 top-[calc(4rem+0.75rem)] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:items-end"
        aria-live="polite"
        aria-relevant="additions text"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className={[
                "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-card sm:w-[360px]",
                TONE_CLASS[t.tone],
              ].join(" ")}>
              <Icon
                className={`mt-0.5 h-5 w-5 shrink-0 ${ICON_CLASS[t.tone]}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug">
                  {t.message}
                </p>
                {t.action ? (
                  <button
                    type="button"
                    className="mt-1.5 text-[13px] font-bold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}>
                    {t.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg p-1 text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label="Cerrar"
                onClick={() => dismiss(t.id)}>
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
