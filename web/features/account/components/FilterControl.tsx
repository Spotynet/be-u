"use client";

import {useEffect, useId, useRef, useState} from "react";
import {ChevronDownIcon} from "@heroicons/react/24/outline";

type Option<T extends string> = {id: T; label: string; count?: number};

type Props<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
};

/** Compact filter control — count in the trigger label. */
export function FilterControl<T extends string = string>({
  value,
  onChange,
  options,
  className = "",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const current = options.find((o) => o.id === value) ?? options[0];
  const triggerLabel = current
    ? typeof current.count === "number"
      ? `${current.label} (${current.count})`
      : current.label
    : "Filtro";

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

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 max-w-[220px] items-center gap-1.5 rounded-full border border-card-border bg-card px-3 text-[12px] font-semibold text-foreground outline-none hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary">
        <span className="truncate">{triggerLabel}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-20 mt-1.5 min-w-[180px] overflow-hidden rounded-2xl border border-card-border bg-card py-1 shadow-dropdown">
          {options.map((o) => {
            const selected = o.id === value;
            const label =
              typeof o.count === "number"
                ? `${o.label} (${o.count})`
                : o.label;
            return (
              <li key={o.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={[
                    "flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium outline-none",
                    selected
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-foreground-muted/[0.06]",
                  ].join(" ")}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}>
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
