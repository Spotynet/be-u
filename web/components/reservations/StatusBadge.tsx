"use client";

import {
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import {
  getReservationStatusConfig,
  type StatusTone,
} from "./statusConfig";

type Size = "sm" | "md";

type Props = {
  status: string;
  size?: Size;
  className?: string;
};

const TONE_SHELL: Record<StatusTone, string> = {
  warning:
    "bg-warning-light/90 text-warning-foreground border-warning/25 dark:bg-warning/15 dark:text-warning dark:border-warning/30",
  success:
    "bg-success-light/90 text-success border-success/25 dark:bg-success/15 dark:text-success dark:border-success/30",
  brand:
    "bg-primary/12 text-primary-dark border-primary/20 dark:bg-primary/15 dark:text-primary dark:border-primary/30",
  danger:
    "bg-error-light/90 text-error border-error/25 dark:bg-error/15 dark:text-error dark:border-error/30",
  neutral:
    "bg-foreground-muted/12 text-foreground-secondary border-card-border dark:bg-foreground-muted/15",
};

const TONE_DOT: Record<StatusTone, string> = {
  warning: "bg-warning",
  success: "bg-success",
  brand: "bg-primary",
  danger: "bg-error",
  neutral: "bg-foreground-muted",
};

const TONE_ICON: Record<StatusTone, string> = {
  warning: "text-warning",
  success: "text-success",
  brand: "text-primary",
  danger: "text-error",
  neutral: "text-foreground-muted",
};

const SIZE: Record<Size, string> = {
  md: "h-7 gap-1.5 px-3 text-[12px]",
  /** 24px — mobile / dense */
  sm: "h-6 gap-1 px-2.5 text-[12px]",
};

/**
 * Reservation status pill — always driven by `statusConfig`.
 * Never pass ad-hoc colors from the page.
 */
export function StatusBadge({status, size = "md", className = ""}: Props) {
  const cfg = getReservationStatusConfig(status);

  return (
    <span
      className={[
        "inline-flex max-w-full items-center rounded-full border font-medium",
        SIZE[size],
        TONE_SHELL[cfg.tone],
        className,
      ].join(" ")}
      title={`Estado: ${cfg.label}`}>
      {cfg.icon === "check" ? (
        <CheckCircleIcon
          className={`h-3.5 w-3.5 shrink-0 ${TONE_ICON[cfg.tone]}`}
          aria-hidden
        />
      ) : cfg.icon === "x" ? (
        <XCircleIcon
          className={`h-3.5 w-3.5 shrink-0 ${TONE_ICON[cfg.tone]}`}
          aria-hidden
        />
      ) : (
        <span
          className={[
            "h-1.5 w-1.5 shrink-0 rounded-full",
            TONE_DOT[cfg.tone],
            cfg.pulse
              ? "nabbi-status-badge__pulse motion-reduce:animate-none"
              : "",
          ].join(" ")}
          aria-hidden
        />
      )}
      <span className="whitespace-nowrap">{cfg.label}</span>
    </span>
  );
}
