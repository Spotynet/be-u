"use client";

import {
  ClipboardEvent,
  KeyboardEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {FieldError} from "@/components/auth/errors/FieldError";

export interface OtpCodeInputHandle {
  focusFirst: () => void;
  clear: () => void;
}

interface OtpCodeInputProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** Error message — sets error border + FieldError below */
  error?: string | null;
  /** Trigger shake when this token changes (e.g. invalid_code) */
  shakeToken?: string | number | null;
  length?: number;
  id?: string;
}

const DIGIT_RE = /^\d$/;

/** Six-box OTP entry — shared by register verify and login code step. */
export const OtpCodeInput = forwardRef<OtpCodeInputHandle, OtpCodeInputProps>(
  function OtpCodeInput(
    {
      value,
      onChange,
      disabled = false,
      error = null,
      shakeToken = null,
      length = 6,
      id = "otp",
    },
    ref
  ) {
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const digits = Array.from({length}, (_, i) => value[i] ?? "");
    const [shake, setShake] = useState(false);
    const errorId = `${id}-error`;

    const focusAt = (index: number) => {
      const el = inputsRef.current[index];
      if (el) {
        el.focus();
        el.select();
      }
    };

    useImperativeHandle(ref, () => ({
      focusFirst: () => focusAt(0),
      clear: () => {
        onChange("");
        focusAt(0);
      },
    }));

    useEffect(() => {
      if (shakeToken == null || shakeToken === "") return;
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 250);
      return () => window.clearTimeout(t);
    }, [shakeToken]);

    const setDigit = (index: number, char: string) => {
      const next = digits.slice();
      next[index] = char;
      onChange(next.join("").slice(0, length));
    };

    const handleChange = (index: number, raw: string) => {
      const cleaned = raw.replace(/\D/g, "");
      if (!cleaned) {
        setDigit(index, "");
        return;
      }
      if (cleaned.length > 1) {
        const merged = (value.slice(0, index) + cleaned).replace(/\D/g, "").slice(0, length);
        onChange(merged);
        focusAt(Math.min(merged.length, length - 1));
        return;
      }
      if (!DIGIT_RE.test(cleaned)) return;
      setDigit(index, cleaned);
      if (index < length - 1) focusAt(index + 1);
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          setDigit(index, "");
        } else if (index > 0) {
          e.preventDefault();
          setDigit(index - 1, "");
          focusAt(index - 1);
        }
        return;
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusAt(index - 1);
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusAt(index + 1);
      }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (!pasted) return;
      onChange(pasted);
      focusAt(Math.min(pasted.length, length - 1));
    };

    const hasError = Boolean(error);

    return (
      <div className="otp-code-wrap">
        <div
          className={`otp-code${hasError ? " otp-code--error" : ""}${shake ? " otp-code--shake" : ""}`}
          role="group"
          aria-label="Código de verificación"
          aria-describedby={hasError ? errorId : undefined}>
          {digits.map((digit, index) => (
            <input
              key={`${id}-${index}`}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              id={index === 0 ? id : undefined}
              className="otp-code__cell"
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              disabled={disabled}
              aria-label={`Dígito ${index + 1} de ${length}`}
              aria-invalid={hasError || undefined}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    );
  }
);
