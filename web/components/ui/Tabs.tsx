"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
};

type Props = {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
  /**
   * `cta` (default) — yellow underline (secondary).
   * `brand` — brand-green underline for light panel surfaces (e.g. Mi cuenta).
   */
  tone?: "cta" | "brand";
};

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  className = "",
  tone = "cta",
}: Props) {
  const reactId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id ?? "");
  const active = value ?? internal;
  const listRef = useRef<HTMLDivElement | null>(null);

  const setActive = (id: string) => {
    if (value == null) setInternal(id);
    onChange?.(id);
  };

  const enabled = items.filter((t) => !t.disabled);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = enabled.findIndex((t) => t.id === active);
    if (idx < 0) return;
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = (idx + 1) % enabled.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = (idx - 1 + enabled.length) % enabled.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = enabled.length - 1;
    } else {
      return;
    }
    const id = enabled[next].id;
    setActive(id);
    const btn = listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(`${reactId}-${id}`)}`);
    btn?.focus();
  };

  const panel = items.find((t) => t.id === active);

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-orientation="horizontal"
        className="flex gap-1 border-b border-card-border"
        onKeyDown={onKeyDown}>
        {items.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${reactId}-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${reactId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => setActive(tab.id)}
              className={[
                "relative -mb-px px-3 py-2.5 text-[13px] font-semibold outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-45",
                isActive
                  ? tone === "brand"
                    ? "border-b-2 border-primary text-primary"
                    : "border-b-2 border-secondary text-secondary"
                  : "border-b-2 border-transparent text-foreground-secondary hover:text-foreground",
              ].join(" ")}>
              {tab.label}
            </button>
          );
        })}
      </div>
      {panel ? (
        <div
          id={`${reactId}-panel-${panel.id}`}
          role="tabpanel"
          aria-labelledby={`${reactId}-${panel.id}`}
          className="pt-4"
          tabIndex={0}>
          {panel.content}
        </div>
      ) : null}
    </div>
  );
}
