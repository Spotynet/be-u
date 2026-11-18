"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import type {AppError, AuthErrorSeverity} from "./types";

export interface AuthToastItem {
  id: string;
  message: string;
  severity: AuthErrorSeverity;
}

const DISMISS_MS = 5000;

export function useAuthToast() {
  const [toasts, setToasts] = useState<AuthToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const paused = useRef(false);
  const remaining = useRef<Map<string, number>>(new Map());

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
        window.setTimeout(() => dismiss(id), ms)
      );
    },
    [dismiss]
  );

  const push = useCallback(
    (error: Pick<AppError, "message" | "severity"> | {message: string; severity?: AuthErrorSeverity}) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: AuthToastItem = {
        id,
        message: error.message,
        severity: error.severity ?? "error",
      };
      setToasts((prev) => [...prev.slice(-2), item]);
      schedule(id, DISMISS_MS);
      return id;
    },
    [schedule]
  );

  const pause = useCallback(() => {
    paused.current = true;
    timers.current.forEach((_, id) => {
      const until = remaining.current.get(id);
      if (until != null) remaining.current.set(id, Math.max(0, until - Date.now()));
      clearTimer(id);
    });
  }, []);

  const resume = useCallback(() => {
    paused.current = false;
    remaining.current.forEach((left, id) => {
      schedule(id, left > 0 ? left : DISMISS_MS);
    });
  }, [schedule]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  return {toasts, push, dismiss, pause, resume};
}
