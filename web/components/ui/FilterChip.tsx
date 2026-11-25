"use client";

import {forwardRef, type ComponentType, type ReactNode, type SVGProps} from "react";
import {CheckIcon} from "@heroicons/react/20/solid";

type Props = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  /** Yellow CTA treatment for primary toggles (e.g. Cerca de mí) */
  variant?: "default" | "accent";
  /**
   * `toggle` → aria-pressed (default).
   * `radio` → role="radio" + aria-checked for single-select ChipRow.
   */
  selectionRole?: "toggle" | "radio";
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  count?: number;
  removable?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
};

/**
 * Pill filter chip — 32px fine / 36px coarse, reserved check slot (no layout shift).
 */
export const FilterChip = forwardRef<HTMLButtonElement, Props>(
  function FilterChip(
    {
      label,
      selected = false,
      onClick,
      variant = "default",
      selectionRole = "toggle",
      icon: Icon,
      count,
      removable,
      onRemove,
      disabled,
      className = "",
      children,
      tabIndex,
      onKeyDown,
    },
    ref
  ) {
    const accent = variant === "accent";
    const isRadio = selectionRole === "radio";

    return (
      <button
        ref={ref}
        type="button"
        role={isRadio ? "radio" : "button"}
        disabled={disabled}
        aria-checked={isRadio ? selected : undefined}
        aria-pressed={isRadio ? undefined : selected}
        onClick={onClick}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        className={[
          "nabbi-filter-chip",
          selected && accent ? "nabbi-filter-chip--accent-on" : "",
          selected && !accent ? "nabbi-filter-chip--on" : "",
          !selected ? "nabbi-filter-chip--off" : "",
          className,
        ].join(" ")}>
        {!accent ? (
          <span className="nabbi-filter-chip__icon" aria-hidden>
            <CheckIcon
              className={[
                "h-4 w-4",
                selected ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
          </span>
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        <span className="whitespace-nowrap">{children ?? label}</span>
        {count != null && count > 0 ? (
          <span
            className={[
              "nabbi-filter-chip__count",
              selected && accent ? "nabbi-filter-chip__count--on-accent" : "",
            ].join(" ")}>
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
        {removable ? (
          <span
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="nabbi-filter-chip__remove"
            aria-hidden>
            ×
          </span>
        ) : null}
      </button>
    );
  }
);
