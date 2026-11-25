"use client";

type Props = {
  visible: boolean;
};

export function SavedHint({visible}: Props) {
  return (
    <span
      className={["nabbi-settings-saved", visible ? "is-visible" : ""].join(" ")}
      aria-live="polite">
      {visible ? "Guardado" : ""}
    </span>
  );
}
