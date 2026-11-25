"use client";

import Link from "next/link";
import type {ComponentType, SVGProps} from "react";
import {ArrowUpRightIcon} from "@heroicons/react/24/outline";
import {Card} from "@/components/ui/Card";
import {Skeleton} from "@/components/ui/Skeleton";

export type KpiTone = "neutral" | "brand" | "success" | "danger" | "accent";

type Props = {
  label: string;
  value: number | string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: KpiTone;
  href?: string;
  /** Context line — real data only. */
  hint?: string | null;
  loading?: boolean;
  /**
   * `premium` (default) — neutral numerals, toned icon tile, hover lift.
   * `default` — legacy layout (icon top-right, toned value).
   */
  variant?: "premium" | "default";
  className?: string;
};

const TONE_TILE: Record<KpiTone, string> = {
  neutral: "bg-foreground-muted/12 text-foreground-secondary",
  brand: "bg-primary/12 text-primary",
  success: "bg-success-light text-success",
  danger: "bg-error-light text-error",
  accent: "bg-secondary/25 text-secondary-foreground",
};

const TONE_VALUE_LEGACY: Record<KpiTone, string> = {
  neutral: "text-foreground",
  brand: "text-primary",
  success: "text-success",
  danger: "text-error",
  accent: "text-foreground",
};

/**
 * KPI card — real values only. No fake delta chips or sparklines.
 * Premium: numerals always `text-foreground`; tone on icon tile only.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  href,
  hint,
  loading = false,
  variant = "premium",
  className = "",
}: Props) {
  const aria = `${label}: ${value}`;
  const premium = variant === "premium";

  const body = loading ? (
    premium ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-3 w-28" />
      </div>
    ) : (
      <div className="flex items-center gap-3 @min-[480px]:block">
        <Skeleton className="h-8 w-8 shrink-0 rounded-[10px]" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-14" />
        </div>
      </div>
    )
  ) : premium ? (
    <div className="relative">
      {href ? (
        <ArrowUpRightIcon
          className="pointer-events-none absolute right-0 top-0 h-4 w-4 text-foreground-muted opacity-0 transition-opacity duration-[180ms] group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        />
      ) : null}
      <div className="flex items-center gap-2.5">
        <span
          className={[
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            TONE_TILE[tone],
          ].join(" ")}
          aria-hidden>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <p className="min-w-0 truncate text-[13px] font-medium text-foreground-secondary">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[32px] font-semibold leading-9 tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[12px] text-foreground-muted">{hint}</p>
      ) : null}
    </div>
  ) : (
    <div className="relative flex items-center gap-3 @min-[480px]:block">
      <span
        className={[
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] @min-[480px]:absolute @min-[480px]:right-0 @min-[480px]:top-0",
          TONE_TILE[tone],
        ].join(" ")}
        aria-hidden>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 @min-[480px]:pr-10">
        <p className="truncate text-[13px] font-medium text-foreground-secondary">
          {label}
        </p>
        <p
          className={[
            "mt-0.5 text-[32px] font-semibold leading-9 tracking-tight tabular-nums @max-[479px]:text-[24px] @max-[479px]:leading-8",
            TONE_VALUE_LEGACY[tone],
          ].join(" ")}>
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-[12px] text-foreground-muted">{hint}</p>
        ) : null}
      </div>
    </div>
  );

  const shell = [
    "nabbi-kpi-card border-card-border",
    premium
      ? "rounded-2xl shadow-card !p-5"
      : "rounded-[20px] border-card-border/60 shadow-card",
    href && !loading && premium
      ? "transition-[transform,box-shadow,border-color] duration-[180ms] ease-out group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-card-hover group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
      : href && !loading
        ? "transition-[transform,border-color] duration-150 hover:-translate-y-px hover:border-primary/30"
        : "",
    className,
  ].join(" ");

  const card = (
    <Card
      padding={premium ? "none" : "md"}
      className={shell}
      aria-label={aria}>
      {body}
    </Card>
  );

  if (href && !loading) {
    return (
      <Link
        href={href}
        className={[
          "nabbi-kpi-card-link group block no-underline outline-none",
          "focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-primary",
        ].join(" ")}
        aria-label={aria}>
        {card}
      </Link>
    );
  }

  return card;
}
