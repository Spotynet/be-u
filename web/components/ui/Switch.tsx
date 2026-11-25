"use client";

import {forwardRef, useId, type InputHTMLAttributes} from "react";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "role" | "checked" | "size"
> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  /** Optional id for aria-labelledby / describedby wiring from the row. */
  labelId?: string;
  describedBy?: string;
};

/**
 * Brand switch — 44×26 track, 20px thumb, role="switch".
 * Visual track via adjacent-sibling CSS (static); native checkbox is sr-only.
 */
export const Switch = forwardRef<HTMLInputElement, Props>(function Switch(
  {
    checked,
    onCheckedChange,
    disabled,
    className = "",
    labelId,
    describedBy,
    id: idProp,
    onClick,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <span
      className={["nabbi-switch", checked ? "is-on" : "is-off", className].join(
        " ",
      )}>
      <input
        {...rest}
        ref={ref}
        id={id}
        type="checkbox"
        role="switch"
        className="nabbi-switch__input peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        onChange={(e) => {
          if (disabled) return;
          onCheckedChange(e.target.checked);
        }}
        onClick={onClick}
      />
      <span className="nabbi-switch__track" aria-hidden>
        <span className="nabbi-switch__thumb" />
      </span>
    </span>
  );
});
