"use client";

import {MAIN_CATEGORIES} from "@/constants/categories";
import {ChipRow} from "@/components/ui/ChipRow";
import {FilterChip} from "@/components/ui/FilterChip";

type Chip = {id: string; name: string};

type Props = {
  value?: string;
  onChange: (id: string) => void;
  categories?: readonly Chip[];
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  bleed?: boolean;
  padInline?: string;
  surface?: "card" | "background";
};

export function CategoryChipBar({
  value = "",
  onChange,
  categories = MAIN_CATEGORIES,
  includeAll = true,
  allLabel = "Todas",
  className = "",
  bleed = true,
  padInline,
  surface = "background",
}: Props) {
  const chips: Chip[] = includeAll
    ? [{id: "", name: allLabel}, ...categories]
    : [...categories];

  return (
    <ChipRow
      aria-label="Categorías"
      mode="single"
      bleed={bleed}
      padInline={padInline}
      surface={surface}
      className={className}>
      {chips.map((chip) => (
        <FilterChip
          key={chip.id || "all"}
          label={chip.name}
          selected={value === chip.id}
          selectionRole="radio"
          onClick={() => onChange(chip.id)}
        />
      ))}
    </ChipRow>
  );
}
