"use client";

import {memo} from "react";
import {CheckIcon} from "@heroicons/react/24/outline";
import type {DropdownOption, OptionRenderFn} from "./types";

type Props<T extends string | number> = {
  option: DropdownOption<T>;
  selected: boolean;
  active: boolean;
  onPick: () => void;
  onHover: () => void;
  id: string;
  renderOption?: OptionRenderFn<T>;
  /** multi-select: leading checkbox instead of trailing check */
  checkbox?: boolean;
};

function OptionRowInner<T extends string | number>({
  option,
  selected,
  active,
  onPick,
  onHover,
  id,
  renderOption,
  checkbox = false,
}: Props<T>) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      className={`cd-option${selected ? " is-selected" : ""}${active ? " is-active" : ""}${option.disabled ? " is-disabled" : ""}${checkbox ? " cd-option--check" : ""}`}
      onMouseEnter={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        if (!option.disabled) onPick();
      }}>
      {renderOption ? (
        renderOption(option, {selected, active})
      ) : (
        <>
          {checkbox ? (
            <span
              className={`cd-checkbox${selected ? " is-checked" : ""}`}
              aria-hidden="true">
              {selected ? <CheckIcon /> : null}
            </span>
          ) : null}
          {option.icon ? <span className="cd-option__icon">{option.icon}</span> : null}
          <span className="cd-option__text">
            <span className="cd-option__label">{option.label}</span>
            {option.description ? (
              <span className="cd-option__desc">{option.description}</span>
            ) : null}
          </span>
          {!checkbox && selected ? (
            <CheckIcon className="cd-option__check" aria-hidden="true" />
          ) : null}
        </>
      )}
    </div>
  );
}

export const OptionRow = memo(OptionRowInner) as typeof OptionRowInner;
