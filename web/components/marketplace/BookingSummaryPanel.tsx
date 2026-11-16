"use client";

import {ReactNode} from "react";

export type BookingSummaryLine = {
  label: string;
  value: string;
};

type Props = {
  title?: string;
  providerName?: string;
  serviceName?: string;
  lines?: BookingSummaryLine[];
  totalLabel?: string;
  totalValue?: string;
  ctaLabel?: string;
  onConfirm?: () => void;
  disabled?: boolean;
  busy?: boolean;
  children?: ReactNode;
  className?: string;
  sticky?: boolean;
};

/**
 * Desktop sticky summary / checkout rail.
 */
export function BookingSummaryPanel({
  title = "Resumen",
  providerName,
  serviceName,
  lines = [],
  totalLabel = "Total",
  totalValue,
  ctaLabel = "Confirmar reserva",
  onConfirm,
  disabled = false,
  busy = false,
  children,
  className = "",
  sticky = true,
}: Props) {
  return (
    <aside
      className={[
        "rounded-2xl border border-card-border bg-card p-5 shadow-card",
        sticky ? "lg:sticky lg:top-20" : "",
        className,
      ].join(" ")}>
      <h2 className="m-0 mb-3 text-[17px] font-extrabold tracking-tight text-foreground">
        {title}
      </h2>
      {providerName ? (
        <p className="m-0 mb-1 text-[14px] font-semibold text-foreground">
          {providerName}
        </p>
      ) : null}
      {serviceName ? (
        <p className="m-0 mb-3 text-[13px] text-foreground-secondary">
          {serviceName}
        </p>
      ) : null}

      {lines.length > 0 ? (
        <dl className="m-0 mb-4 flex flex-col gap-2 border-t border-card-border pt-3">
          {lines.map((line) => (
            <div
              key={`${line.label}-${line.value}`}
              className="flex items-start justify-between gap-3 text-[13px]">
              <dt className="text-foreground-muted">{line.label}</dt>
              <dd className="m-0 text-right font-semibold text-foreground">
                {line.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {totalValue ? (
        <div className="mb-4 flex items-center justify-between border-t border-card-border pt-3">
          <span className="text-[14px] font-bold text-foreground">
            {totalLabel}
          </span>
          <span className="text-[18px] font-extrabold text-foreground">
            {totalValue}
          </span>
        </div>
      ) : null}

      {children}

      {onConfirm ? (
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || busy}
          className="mt-2 flex w-full min-h-12 items-center justify-center rounded-xl bg-secondary text-[15px] font-bold text-secondary-foreground transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Confirmando…" : ctaLabel}
        </button>
      ) : null}
    </aside>
  );
}
