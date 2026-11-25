"use client";

import type {ReactNode} from "react";
import {Tooltip} from "@/components/ui/Tooltip";

type Props = {
  label: string;
  value: ReactNode;
  trailing?: ReactNode;
  truncate?: boolean;
  className?: string;
};

export function InfoField({
  label,
  value,
  trailing,
  truncate = true,
  className = "",
}: Props) {
  const valueNode =
    truncate && typeof value === "string" ? (
      <Tooltip content={value} side="top" delay={400}>
        <span className="block truncate text-[14px] font-medium leading-5 text-foreground">
          {value}
        </span>
      </Tooltip>
    ) : (
      <span className="block text-[14px] font-medium leading-5 text-foreground">
        {value}
      </span>
    );

  return (
    <div
      className={[
        "flex min-w-0 items-start gap-2 rounded-2xl bg-foreground-muted/[0.06] px-3.5 py-3",
        className,
      ].join(" ")}>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
          {label}
        </p>
        <div className="mt-1 min-w-0">{valueNode}</div>
      </div>
      {trailing ? <div className="shrink-0 self-center">{trailing}</div> : null}
    </div>
  );
}
