"use client";

import {Tooltip} from "@/components/ui/Tooltip";
import {SidebarPinIcon} from "./SidebarPinIcon";

type Props = {
  pinned: boolean;
  onToggle: () => void;
  className?: string;
};

/** SearchBar-identical keycap chrome for the "[" shortcut hint. */
function Keycap({children}: {children: string}) {
  return (
    <kbd className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-card-border bg-card text-[11px] font-semibold tabular-nums text-foreground-secondary">
      {children}
    </kbd>
  );
}

export function SidebarPinButton({
  pinned,
  onToggle,
  className = "",
}: Props) {
  const label = pinned ? "Soltar menú" : "Fijar menú";

  const tip = (
    <span className="inline-flex items-center gap-2">
      <span className="text-[12px] font-medium leading-4">{label}</span>
      <Keycap>[</Keycap>
    </span>
  );

  return (
    <Tooltip
      content={tip}
      side="right"
      delay={300}
      tipClassName="rounded-[var(--r-ctl)] px-2.5 py-1.5 shadow-dropdown"
      hoverFineOnly>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "nabbi-sidebar-pin group/pin inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-ctl)]",
          "outline-none transition-[background-color,box-shadow,transform] duration-150",
          "ease-[var(--sidebar-ease,cubic-bezier(.2,.8,.2,1))]",
          "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]",
          "active:scale-[0.96]",
          "motion-reduce:transition-none motion-reduce:active:scale-100",
          pinned
            ? "bg-white/10 text-secondary ring-1 ring-inset ring-white/10 hover:bg-white/14"
            : "bg-transparent text-white/70 hover:bg-white/12 hover:text-white",
          className,
        ].join(" ")}
        aria-label={label}
        aria-pressed={pinned}
        aria-keyshortcuts="[">
        <span
          className={[
            "relative inline-flex h-5 w-5 items-center justify-center",
            "transition-transform duration-150",
            "ease-[var(--sidebar-ease,cubic-bezier(.2,.8,.2,1))]",
            "motion-reduce:transition-none motion-reduce:rotate-0 motion-reduce:scale-100",
            pinned ? "rotate-0 scale-100" : "rotate-45 scale-[0.92]",
          ].join(" ")}>
          {/* Crossfade: outline (unpinned) ↔ filled (pinned) */}
          <span
            className={[
              "absolute inset-0 flex items-center justify-center transition-opacity",
              "duration-[140ms] motion-reduce:duration-[80ms]",
              "ease-[var(--sidebar-ease,cubic-bezier(.2,.8,.2,1))]",
              pinned ? "opacity-0" : "opacity-100",
            ].join(" ")}
            aria-hidden>
            <SidebarPinIcon pinned={false} size={20} />
          </span>
          <span
            className={[
              "absolute inset-0 flex items-center justify-center transition-opacity",
              "duration-[140ms] motion-reduce:duration-[80ms]",
              "ease-[var(--sidebar-ease,cubic-bezier(.2,.8,.2,1))]",
              pinned ? "opacity-100" : "opacity-0",
            ].join(" ")}
            aria-hidden>
            <SidebarPinIcon pinned size={20} />
          </span>
        </span>
      </button>
    </Tooltip>
  );
}
