import {TextareaHTMLAttributes, forwardRef, useId} from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/** Premium minimal textarea — matches Input soft-fill language */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({label, error, helperText, className = "", id, rows = 4, ...props}, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    const describedBy = error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined;

    return (
      <div className={`nabbi-field${error ? " nabbi-field--error" : ""}`}>
        {label && (
          <label htmlFor={fieldId} className="nabbi-field__label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`nabbi-field__control nabbi-field__control--textarea ${className}`.trim()}
          {...props}
        />
        {error && (
          <p id={`${fieldId}-error`} className="nabbi-field__error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${fieldId}-helper`} className="nabbi-field__hint">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
