import {ButtonHTMLAttributes, ReactNode} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Design system: primary = yellow CTA; secondary = forest/sage */
  variant?: "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "ghost" | "outline";
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
    "inline-flex items-center justify-center gap-2 font-semibold rounded-full cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    // DS primary CTA = yellow + ink — premium: flat, no glow
    primary:
      "bg-secondary text-secondary-foreground hover:bg-secondary-hover focus-visible:ring-secondary",
    secondary:
      "bg-primary-dark text-white hover:bg-primary focus-visible:ring-primary",
    accent: "bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:ring-accent",
    success: "bg-success text-success-foreground hover:bg-success-light focus-visible:ring-success",
    warning: "bg-warning text-warning-foreground hover:bg-warning-light focus-visible:ring-warning",
    error: "bg-error text-error-foreground hover:bg-error-light focus-visible:ring-error",
    ghost: "text-foreground hover:bg-background-secondary focus-visible:ring-primary font-medium",
    outline:
      "border border-border bg-transparent text-foreground hover:bg-background-secondary focus-visible:ring-primary font-medium",
  };

  const sizeClasses = {
    sm: "px-4 py-2.5 text-sm min-h-11",
    md: "px-6 py-3.5 text-[15px] min-h-12",
    lg: "px-8 py-4 text-base min-h-12",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}>
      {children}
    </button>
  );
};
