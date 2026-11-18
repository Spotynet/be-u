import {
  InputHTMLAttributes,
  ReactNode,
  forwardRef,
  useEffect,
  useId,
  useState,
} from "react";
import {FieldError} from "@/components/auth/errors/FieldError";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Optional leading icon inside the control (e.g. mail / user). */
  leadingIcon?: ReactNode;
}

/** Premium minimal text field — soft fill, inset focus, quiet label */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      className = "",
      id,
      required,
      onInvalid,
      "aria-required": ariaRequired,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;
    const [shake, setShake] = useState(false);

    useEffect(() => {
      if (!error) return;
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 250);
      return () => window.clearTimeout(t);
    }, [error]);

    return (
      <div
        className={`nabbi-field${error ? " nabbi-field--error" : ""}${shake ? " nabbi-field--shake" : ""}${leadingIcon ? " nabbi-field--icon" : ""}`}>
        {label && (
          <label htmlFor={inputId} className="nabbi-field__label">
            {label}
          </label>
        )}
        <div className="nabbi-field__control-wrap">
          {leadingIcon ? (
            <span className="nabbi-field__icon" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={`nabbi-field__control ${className}`.trim()}
            {...props}
            required={required}
            aria-required={ariaRequired ?? (required ? true : undefined)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onInvalid={(e) => {
              // Never show the browser's native validation bubble.
              e.preventDefault();
              onInvalid?.(e);
            }}
          />
        </div>
        <FieldError id={`${inputId}-error`} message={error} />
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="nabbi-field__hint">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
