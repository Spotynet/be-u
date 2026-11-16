"use client";

import {ReactNode} from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`mb-3 flex flex-wrap items-end justify-between gap-2 ${className}`}>
      <div className="min-w-0">
        <h2 className="nabbi-page-title mb-0 text-[clamp(1.15rem,3vw,1.45rem)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="nabbi-page-sub mb-0 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
