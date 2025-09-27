"use client";

import {InputHTMLAttributes, forwardRef, ReactNode} from "react";

interface ThemeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  variant?: "default" | "minimal" | "futuristic";
  size?: "sm" | "md" | "lg";
}

export const ThemeInput = forwardRef<HTMLInputElement, ThemeInputProps>(
  (
    {label, error, helperText, icon, variant = "default", size = "md", className = "", ...props},
    ref
  ) => {
    // Base classes for all variants
    const baseClasses = "w-full transition-all duration-300 focus:outline-none";

    // Size variants
    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-base",
      lg: "px-5 py-4 text-lg",
    };

    // Variant styles
    const variantClasses = {
      default: `
        bg-input border border-input-border rounded-md text-foreground 
        placeholder-foreground-muted focus:ring-2 focus:ring-input-focus 
        focus:border-input-focus hover:border-input-hover
        ${error ? "border-error focus:ring-error focus:border-error" : ""}
      `,

      minimal: `
        bg-transparent border-0 border-b-2 border-border text-foreground 
        placeholder-foreground-muted focus:border-primary focus:outline-none
        ${error ? "border-error focus:border-error" : ""}
      `,

      futuristic: `
        bg-black/50 border border-purple-400/30 rounded-lg text-white 
        placeholder-gray-400 focus:border-purple-400 focus:ring-2 
        focus:ring-purple-400/20 backdrop-blur-sm shadow-lg shadow-purple-500/10
        hover:border-purple-400/50 hover:shadow-purple-500/20
        ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}
      `,
    };

    // Label styles
    const labelClasses = {
      default: "block text-sm font-medium text-foreground mb-2",
      minimal: "block text-sm font-medium text-foreground mb-2",
      futuristic: "block text-sm font-medium text-gray-300 mb-2",
    };

    // Error styles
    const errorClasses = {
      default: "text-sm text-error mt-1",
      minimal: "text-sm text-error mt-1",
      futuristic: "text-sm text-red-400 mt-1",
    };

    // Helper text styles
    const helperClasses = {
      default: "text-sm text-foreground-muted mt-1",
      minimal: "text-sm text-foreground-muted mt-1",
      futuristic: "text-sm text-gray-400 mt-1",
    };

    return (
      <div className="space-y-1">
        {label && <label className={labelClasses[variant]}>{label}</label>}

        <div className="relative">
          <input
            ref={ref}
            className={`
              ${baseClasses}
              ${sizeClasses[size]}
              ${variantClasses[variant]}
              ${icon ? "pr-10" : ""}
              ${className}
            `.trim()}
            {...props}
          />

          {icon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted">
              {icon}
            </div>
          )}
        </div>

        {error && <p className={errorClasses[variant]}>{error}</p>}

        {helperText && !error && <p className={helperClasses[variant]}>{helperText}</p>}
      </div>
    );
  }
);

ThemeInput.displayName = "ThemeInput";
