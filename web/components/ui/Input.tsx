import {InputHTMLAttributes, forwardRef} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({label, error, helperText, className = "", ...props}, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-input border border-input-border rounded-md text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-input-focus focus:border-input-focus transition-colors ${
            error ? "border-error focus:ring-error" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
        {helperText && !error && <p className="text-sm text-foreground-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

