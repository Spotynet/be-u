"use client";

import {useCallback, type ReactNode} from "react";
import {FilterChip} from "./FilterChip";
import {ChipRow} from "./ChipRow";

export type ChipOption = {
  id: string;
  label: string;
  count?: number;
};

type Props = {
  options: ChipOption[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multiple?: boolean;
  noneId?: string;
  noneLabel?: string;
  className?: string;
  "aria-label"?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  bleed?: boolean;
  padInline?: string;
  surface?: "card" | "background";
};

export function ChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  noneId = "",
  noneLabel,
  className = "",
  "aria-label": ariaLabel = "Filtros",
  leading,
  trailing,
  bleed = true,
  padInline,
  surface = "card",
}: Props) {
  const selectedSet = new Set(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const noneSelected = multiple
    ? selectedSet.size === 0
    : !value || value === noneId;

  const select = useCallback(
    (id: string) => {
      if (multiple) {
        if (id === noneId) {
          onChange([]);
          return;
        }
        const cur = Array.isArray(value) ? [...value] : [];
        const idx = cur.indexOf(id);
        if (idx >= 0) cur.splice(idx, 1);
        else cur.push(id);
        onChange(cur);
        return;
      }
      onChange(id === value ? noneId : id);
    },
    [multiple, noneId, onChange, value]
  );

  const chips: ChipOption[] = noneLabel
    ? [{id: noneId, label: noneLabel}, ...options]
    : options;

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      {leading}
      <ChipRow
        aria-label={ariaLabel}
        mode={multiple ? "multi" : "single"}
        bleed={bleed}
        padInline={padInline}
        surface={surface}
        className="min-w-0 flex-1">
        {chips.map((chip) => {
          const selected =
            chip.id === noneId ? noneSelected : selectedSet.has(chip.id);
          return (
            <FilterChip
              key={chip.id || "none"}
              label={chip.label}
              selected={selected}
              selectionRole={multiple ? "toggle" : "radio"}
              count={chip.count}
              onClick={() => select(chip.id)}
            />
          );
        })}
      </ChipRow>
      {trailing}
    </div>
  );
}
