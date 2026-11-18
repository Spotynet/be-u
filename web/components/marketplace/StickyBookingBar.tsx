"use client";

import Link from "next/link";

type Props = {
  priceLabel?: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Fixed bottom CTA for mobile store/booking pages.
 * Hidden from lg up (desktop uses BookingSummaryPanel rail).
 */
export function StickyBookingBar({
  priceLabel,
  subtitle,
  ctaLabel = "Reservar",
  href,
  onClick,
  disabled = false,
  className = "",
}: Props) {
  const ctaClass =
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-secondary px-4 text-[15px] font-bold text-secondary-foreground cursor-pointer transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className={`fixed bottom-[56px] left-0 right-0 z-30 border-t border-card-border bg-card/95 px-4 py-3 backdrop-blur-md sm:bottom-0 lg:hidden ${className}`}
      style={{paddingBottom: "calc(12px + env(safe-area-inset-bottom))"}}>
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          {priceLabel ? (
            <div className="truncate text-[16px] font-extrabold text-foreground">
              {priceLabel}
            </div>
          ) : null}
          {subtitle ? (
            <div className="truncate text-[12px] text-foreground-muted">
              {subtitle}
            </div>
          ) : null}
        </div>
        {href && !onClick ? (
          <Link
            href={href}
            aria-disabled={disabled}
            className={`${ctaClass} ${disabled ? "pointer-events-none opacity-50" : ""}`}
            onClick={(e) => {
              if (disabled) e.preventDefault();
            }}>
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            className={ctaClass}
            disabled={disabled}
            onClick={onClick}>
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
