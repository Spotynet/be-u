import type {ReactNode} from "react";
import type {StatusTone} from "../lib/status";

type Props = {
  children: ReactNode;
  tone?: StatusTone;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
};

const TONE: Record<StatusTone, string> = {
  neutral: "bg-foreground-muted/12 text-foreground-secondary",
  brand: "bg-primary/15 text-primary-dark dark:text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning-foreground",
  error: "bg-error-light text-error",
  info: "bg-accent/15 text-accent",
};

const SIZE = {
  sm: "gap-1 px-2 py-0.5 text-[11px]",
  md: "gap-1.5 px-2.5 py-1 text-[12px]",
  /** 28px height — reservation rows */
  lg: "h-7 gap-1.5 px-2.5 text-[12px] font-medium",
} as const;

export function StatusChip({
  children,
  tone = "neutral",
  size = "sm",
  dot = false,
  className = "",
}: Props) {
  return (
    <span
      className={[
        "inline-flex max-w-full items-center truncate rounded-full font-semibold",
        TONE[tone],
        SIZE[size],
        className,
      ].join(" ")}>
      {dot ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
