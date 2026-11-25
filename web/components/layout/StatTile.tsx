"use client";

import type {ComponentType, ReactNode, SVGProps} from "react";
import {ArrowTopRightOnSquareIcon} from "@heroicons/react/24/outline";
import {IconButton} from "./IconButton";

type Props = {
  label: string;
  value: string | number;
  context?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Optional expand / navigate control. */
  onExpand?: () => void;
  expandLabel?: string;
  className?: string;
  trailing?: ReactNode;
};

export function StatTile({
  label,
  value,
  context,
  icon: Icon,
  onExpand,
  expandLabel = "Ver detalle",
  className = "",
  trailing,
}: Props) {
  return (
    <div className={["nabbi-stat-tile", className].filter(Boolean).join(" ")}>
      <div className="nabbi-stat-tile__top">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="nabbi-card-header__icon !h-8 !w-8" aria-hidden>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          ) : null}
          <span className="nabbi-stat-tile__label truncate">{label}</span>
        </div>
        {onExpand ? (
          <IconButton aria-label={expandLabel} onClick={onExpand}>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
          </IconButton>
        ) : (
          trailing
        )}
      </div>
      <p className="nabbi-stat-tile__value">{value}</p>
      {context ? <p className="nabbi-stat-tile__context">{context}</p> : null}
    </div>
  );
}
