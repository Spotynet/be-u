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
      className={`nabbi-stack-row flex-nowrap overflow-x-auto pb-0.5 ${className}`}
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
            className={`nabbi-chip ${active ? "nabbi-chip-active" : ""}`}>
            {chip.name}
          </button>
        );
      })}
    </div>
  );
}
