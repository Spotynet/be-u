"use client";

import {useEffect, useId, useRef, useState} from "react";
import {CheckIcon, ChevronDownIcon} from "@heroicons/react/24/outline";
import {Tooltip} from "@/components/ui/Tooltip";
import type {ExploreSortKey} from "@/features/explore";

type Props = {
  count: number;
  loading: boolean;
  sort: ExploreSortKey;
  onSort: (s: ExploreSortKey) => void;
  hasLocation: boolean;
};

const OPTIONS: {id: ExploreSortKey; label: string}[] = [
  {id: "relevance", label: "Relevancia"},
  {id: "rating", label: "Mejor valorados"},
  {id: "distance", label: "Más cercanos"},
];

export function ExploreResultsHeader({
  count,
  loading,
  sort,
  onSort,
  hasLocation,
}: Props) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const label =
    OPTIONS.find((o) => o.id === sort)?.label || "Relevancia";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const countLabel = loading
    ? "Cargando..."
    : count === 1
      ? "1 resultado"
      : `${count} resultados`;

  return (
    <div className="nabbi-explore-results-header" ref={rootRef}>
      {loading ? (
        <span
          className="inline-flex h-6 w-28 animate-pulse rounded-full bg-background-secondary motion-reduce:animate-none"
          aria-hidden
        />
      ) : (
        <p className="m-0 text-[15px] font-semibold tabular-nums text-foreground">
          {countLabel}
        </p>
      )}

      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-foreground hover:border hover:border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
          {label}
          <ChevronDownIcon className="h-4 w-4 text-foreground-muted" aria-hidden />
        </button>
        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Ordenar"
            className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[200px] rounded-[var(--r-tile)] border border-card-border bg-card p-2 shadow-card">
            {OPTIONS.map((opt) => {
              const disabled = opt.id === "distance" && !hasLocation;
              const selected = sort === opt.id;
              const item = (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onSort(opt.id);
                    setOpen(false);
                  }}
                  className={
                    selected
                      ? "flex h-9 w-full items-center justify-between rounded-[var(--r-control)] bg-primary-light px-3 text-left text-[13px] font-semibold text-primary-dark"
                      : "flex h-9 w-full items-center justify-between rounded-[var(--r-control)] px-3 text-left text-[13px] font-medium text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-foreground-muted"
                  }>
                  {opt.label}
                  {selected ? (
                    <CheckIcon className="h-4 w-4" aria-hidden />
                  ) : null}
                </button>
              );
              if (disabled) {
                return (
                  <li key={opt.id} role="presentation">
                    <Tooltip content="Activa Cerca de mí" side="left" hoverFineOnly>
                      {item}
                    </Tooltip>
                  </li>
                );
              }
              return (
                <li key={opt.id} role="presentation">
                  {item}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
