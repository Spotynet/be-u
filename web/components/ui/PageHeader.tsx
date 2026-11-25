"use client";

import {useEffect, useId, useRef, type ReactNode} from "react";
import {
  usePageHeaderVisibility,
  type PageHeaderChrome,
} from "@/components/shell/usePageHeader";

type Props = {
  title: string;
  /**
   * Legacy eyebrow (11px uppercase). Ignored when `variant="compact"`.
   * @deprecated Prefer compact headers without section overlines.
   */
  label?: string;
  /** Legacy multi-line subtitle. Prefer `description` on compact. */
  subtitle?: string;
  /** Compact: optional single-line context. Hidden below 640px. */
  description?: string;
  actions?: ReactNode;
  /** Inline badge/text after the title (data only). */
  meta?: ReactNode;
  /**
   * `legacy` (default) — tall header with optional eyebrow; other pages stay as-is.
   * `compact` — title + optional description + actions; condensed topbar title.
   * `banner` — Feed dark gradient card.
   */
  variant?: PageHeaderChrome;
  /** Compact only: optional 1px hairline under the header. Default false. */
  divider?: boolean;
  className?: string;
};

/**
 * Page chrome header.
 * @deprecated Prefer `PageHeaderRow` from `@/components/layout` on migrated pages.
 * - **legacy** (default): label + h1 + subtitle — en transición.
 * - **compact**: title-only rhythm.
 * - **banner**: Feed gradient card.
 */
export function PageHeader({
  title,
  label,
  subtitle,
  description,
  actions,
  meta,
  variant = "legacy",
  divider = false,
  className = "",
}: Props) {
  const headerRef = useRef<HTMLElement | null>(null);
  const descId = useId();
  const {registerHeaderEl, setHeaderChrome} = usePageHeaderVisibility();

  const isCompact = variant === "compact";

  useEffect(() => {
    setHeaderChrome(variant);
    if (isCompact) {
      registerHeaderEl(headerRef.current);
    } else {
      registerHeaderEl(null);
    }
    return () => {
      registerHeaderEl(null);
      setHeaderChrome(null);
    };
  }, [registerHeaderEl, setHeaderChrome, title, variant, isCompact]);

  if (variant === "banner") {
    return (
      <header
        ref={headerRef}
        className={[
          "nabbi-page-header nabbi-page-header--banner mb-5 overflow-hidden rounded-[22px] border border-card-border bg-gradient-to-br from-primary-dark via-primary-dark to-primary px-4 py-4 text-white shadow-card sm:px-5",
          className,
        ].join(" ")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {label ? (
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">
                {label}
              </p>
            ) : null}
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[30px]">
                {title}
              </h1>
              {meta ? (
                <div className="inline-flex items-baseline" aria-live="polite">
                  {meta}
                </div>
              ) : null}
            </div>
            {description || subtitle ? (
              <p
                id={descId}
                className="mt-1.5 mb-0 max-w-xl text-[14px] leading-relaxed text-white/80">
                {description || subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
    );
  }

  if (isCompact) {
    const compactDesc = description || subtitle;
    return (
      <header
        ref={headerRef}
        className={[
          "nabbi-page-header nabbi-page-header--compact flex flex-col gap-3 pb-5 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-5 sm:pt-7",
          divider ? "border-b border-card-border" : "",
          className,
        ].join(" ")}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[30px]">
              {title}
            </h1>
            {meta ? (
              <div
                className="inline-flex items-baseline text-foreground-secondary"
                aria-live="polite">
                {meta}
              </div>
            ) : null}
          </div>
          {compactDesc ? (
            <p
              id={descId}
              className="mt-1 hidden max-w-[60ch] truncate text-[14px] text-foreground-secondary sm:block">
              {compactDesc}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </header>
    );
  }

  /* —— legacy (default) —— */
  const legacySub = subtitle || description;
  return (
    <header
      ref={headerRef}
      className={[
        "nabbi-page-header nabbi-page-header--legacy flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      ].join(" ")}>
      <div className="min-w-0">
        {label ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-secondary">
            {label}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-foreground sm:text-[28px]">
            {title}
          </h1>
          {meta ? <div className="inline-flex items-center">{meta}</div> : null}
        </div>
        {legacySub ? (
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-foreground-secondary">
            {legacySub}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
