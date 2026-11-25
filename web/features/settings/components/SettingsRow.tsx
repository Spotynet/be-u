"use client";

import {useId, type ComponentType, type ReactNode, type SVGProps} from "react";
import {Switch} from "@/components/ui/Switch";

type Props = {
  title: string;
  description?: string;
  /** Absolute date for relative descriptions (title attr). */
  descriptionTitle?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** When set, renders a Switch on the right; whole row toggles. */
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Custom trailing control (link, button, etc.). */
  trailing?: ReactNode;
  className?: string;
  danger?: boolean;
  /** Larger 40px icon tile (channel cells). */
  dense?: boolean;
  /**
   * `switch` (default when checked) — control always right.
   * `wide` — buttons/dropdowns stack under text when card &lt; 420px.
   * `badge` — compact trailing, stays right.
   */
  control?: "switch" | "wide" | "badge";
  /** Allow title to wrap (device names, emails) instead of ellipsis. */
  titleWrap?: boolean;
};

export function SettingsRow({
  title,
  description,
  descriptionTitle,
  icon: Icon,
  checked,
  onCheckedChange,
  disabled,
  trailing,
  className = "",
  danger = false,
  dense = false,
  control: controlProp,
  titleWrap = false,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const switchId = useId();
  const isSwitch = typeof checked === "boolean" && !!onCheckedChange;
  const isOn = isSwitch && checked;
  const control = controlProp ?? (isSwitch ? "switch" : "wide");

  const body = (
    <>
      {Icon ? (
        <span
          className={[
            "nabbi-settings-row__tile",
            dense ? "nabbi-settings-row__tile--lg" : "",
            danger ? "nabbi-settings-row__tile--danger" : "",
            isOn ? "is-on" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
      ) : (
        <span className="nabbi-settings-row__tile-spacer" aria-hidden />
      )}
      <span className="nabbi-settings-row__text min-w-0">
        <span
          id={titleId}
          className={[
            "nabbi-settings-row__title",
            titleWrap ? "nabbi-settings-row__title--wrap" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          title={titleWrap ? title : undefined}>
          {title}
        </span>
        {description ? (
          <span
            id={descId}
            className="nabbi-settings-row__desc"
            title={descriptionTitle ?? description}>
            {description}
          </span>
        ) : null}
      </span>
      <span className="nabbi-settings-row__control">
        {isSwitch ? (
          <Switch
            id={switchId}
            checked={checked!}
            onCheckedChange={onCheckedChange!}
            disabled={disabled}
            labelId={titleId}
            describedBy={description ? descId : undefined}
          />
        ) : (
          trailing
        )}
      </span>
    </>
  );

  const rowClass = [
    "nabbi-settings-row",
    dense ? "nabbi-settings-row--channel" : "",
    control === "wide" ? "nabbi-settings-row--wide-control" : "",
    control === "badge" ? "nabbi-settings-row--badge" : "",
    disabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isSwitch) {
    return (
      <label
        htmlFor={switchId}
        className={rowClass}
        aria-describedby={description ? descId : undefined}>
        {body}
      </label>
    );
  }

  return <div className={rowClass}>{body}</div>;
}
