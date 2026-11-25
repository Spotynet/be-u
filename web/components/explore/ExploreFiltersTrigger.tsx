"use client";

import {AdjustmentsHorizontalIcon} from "@heroicons/react/24/outline";

type Props = {
  activeFilterCount: number;
  onOpen: () => void;
  className?: string;
};

/** Minimal chip to open the filters sheet (hidden by default). */
export function ExploreFiltersTrigger({
  activeFilterCount,
  onOpen,
  className = "",
}: Props) {
  const active = activeFilterCount > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      className={[
        "nabbi-explore-filters-trigger inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)]",
        active
          ? "border border-[color:var(--accent-fill-border)] bg-[color:var(--accent-fill)] text-primary-foreground"
          : "border border-[color:var(--hairline)] text-foreground-secondary hover:text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}>
      <AdjustmentsHorizontalIcon className="h-[18px] w-[18px]" aria-hidden />
      Filtros
      {active ? (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold tabular-nums text-secondary-foreground">
          {activeFilterCount}
        </span>
      ) : null}
    </button>
  );
}
