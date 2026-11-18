"use client";

import {useEffect, useState} from "react";

interface RateLimitNoticeProps {
  /** Seconds remaining; when 0, calls onDone and hides. */
  seconds: number;
  onDone?: () => void;
  /** Optional prefix — defaults to catalog-like rate limit copy. */
  label?: string;
  className?: string;
}

function formatSeconds(total: number): string {
  if (total >= 60) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return `${total} s`;
}

/** Live countdown used with 429 / resend cooldown. */
export function RateLimitNotice({
  seconds,
  onDone,
  label = "Espera {time} e inténtalo de nuevo.",
  className = "",
}: RateLimitNoticeProps) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil(seconds)));

  useEffect(() => {
    setLeft(Math.max(0, Math.ceil(seconds)));
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      onDone?.();
      return;
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, onDone]);

  if (left <= 0) return null;

  const text = label.replace("{time}", formatSeconds(left));

  return (
    <p className={`auth-rate-limit ${className}`.trim()} role="status" aria-live="polite">
      {text}
    </p>
  );
}

/** Hook-friendly countdown state shared with disabled buttons. */
export function useCountdown(initial: number) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil(initial)));

  useEffect(() => {
    setLeft(Math.max(0, Math.ceil(initial)));
  }, [initial]);

  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  return {
    left,
    active: left > 0,
    reset: (n: number) => setLeft(Math.max(0, Math.ceil(n))),
    clear: () => setLeft(0),
  };
}
