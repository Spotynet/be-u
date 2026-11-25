"use client";

import Link from "next/link";
import type {ReactNode} from "react";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import {Card} from "@/components/ui/Card";
import {Skeleton} from "@/components/ui/Skeleton";
import {MiniBars} from "./MiniBars";
import type {StatusTone} from "../lib/status";

type Delta = {
  label: string;
  tone?: StatusTone;
  direction?: "up" | "down" | "flat";
};

type Props = {
  label: string;
  value: number | string;
  delta?: Delta | null;
  bars?: number[] | null;
  barsSummary?: string;
  emptyHint?: string;
  href?: string;
  valueTone?: "primary" | "success" | "error" | "foreground";
  loading?: boolean;
  className?: string;
  icon?: ReactNode;
};

const VALUE_TONE = {
  primary: "text-primary",
  success: "text-success",
  error: "text-error",
  foreground: "text-foreground",
} as const;

const DELTA_TONE: Record<StatusTone, string> = {
  neutral: "bg-foreground-muted/12 text-foreground-secondary",
  brand: "bg-primary/15 text-primary-dark dark:text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning-foreground",
  error: "bg-error-light text-error",
  info: "bg-accent/15 text-accent",
};

const BAR_TONE = {
  primary: {tone: "bg-primary", muted: "bg-primary/20"},
  success: {tone: "bg-success", muted: "bg-success/20"},
  error: {tone: "bg-error", muted: "bg-error/20"},
  foreground: {tone: "bg-foreground-muted", muted: "bg-foreground-muted/25"},
} as const;

export function StatCard({
  label,
  value,
  delta,
  bars,
  barsSummary,
  emptyHint,
  href,
  valueTone = "foreground",
  loading = false,
  className = "",
  icon,
}: Props) {
  const showBars = Array.isArray(bars) && bars.length >= 2;
  const barColors = BAR_TONE[valueTone];

  const inner = loading ? (
    <>
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="mb-2 h-8 w-16" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </>
  ) : (
    <div className="flex min-w-0 items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="truncate text-[13px] font-medium text-foreground-secondary">
            {label}
          </p>
        </div>
        <p
          className={[
            "mt-1 text-[32px] font-semibold leading-9 tabular-nums tracking-tight",
            VALUE_TONE[valueTone],
          ].join(" ")}>
          {value}
        </p>
        {delta ? (
          <span
            className={[
              "mt-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              DELTA_TONE[delta.tone || "neutral"],
            ].join(" ")}>
            {delta.direction === "up" ? (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" aria-hidden />
            ) : null}
            {delta.direction === "down" ? (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" aria-hidden />
            ) : null}
            {delta.label}
          </span>
        ) : emptyHint && (value === 0 || value === "0") ? (
          <p className="mt-2 text-[12px] text-foreground-muted">{emptyHint}</p>
        ) : null}
      </div>
      {showBars ? (
        <MiniBars
          values={bars!}
          toneClass={barColors.tone}
          mutedClass={barColors.muted}
          summary={barsSummary}
          className="shrink-0"
        />
      ) : null}
    </div>
  );

  const shell = [
    "min-w-[220px] flex-1 snap-start rounded-[20px] border-card-border/60 shadow-card @min-[480px]:min-w-0",
    className,
  ].join(" ");

  const card = (
    <Card padding="md" hover={Boolean(href)} className={shell}>
      {inner}
    </Card>
  );

  if (href && !loading) {
    return (
      <Link href={href} className="block min-w-[220px] flex-1 no-underline @min-[480px]:min-w-0">
        {card}
      </Link>
    );
  }

  return card;
}
