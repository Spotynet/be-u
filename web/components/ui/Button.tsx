import {ButtonHTMLAttributes, ReactNode} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary-hover focus:ring-secondary",
    accent: "bg-accent text-accent-foreground hover:bg-accent-hover focus:ring-accent",
    success: "bg-success text-success-foreground hover:bg-success-light focus:ring-success",
    warning: "bg-warning text-warning-foreground hover:bg-warning-light focus:ring-warning",
    error: "bg-error text-error-foreground hover:bg-error-light focus:ring-error",
    ghost: "text-foreground hover:bg-background-secondary focus:ring-primary",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}>
      {children}
    </button>
  );
};

