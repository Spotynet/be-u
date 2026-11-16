"use client";

import {MAIN_CATEGORIES} from "@/constants/categories";

type Chip = {id: string; name: string};

type Props = {
  value?: string;
  onChange: (id: string) => void;
  categories?: readonly Chip[];
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
};

export function CategoryChipBar({
  value = "",
  onChange,
  categories = MAIN_CATEGORIES,
  includeAll = true,
  allLabel = "Todos",
  className = "",
}: Props) {
  const chips: Chip[] = includeAll
    ? [{id: "", name: allLabel}, ...categories]
    : [...categories];

  return (
    <div
      className={`nabbi-stack-row flex-nowrap overflow-x-auto pb-1 ${className}`}
      role="tablist"
      aria-label="Categorías">
      {chips.map((chip) => {
        const active = value === chip.id;
        return (
          <button
            key={chip.id || "all"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(chip.id)}
            className={[
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors",
              active
                ? "border border-primary bg-primary text-primary-foreground"
                : "border border-card-border bg-background text-foreground hover:bg-background-secondary",
            ].join(" ")}>
            {chip.name}
          </button>
        );
      })}
    </div>
  );
}
