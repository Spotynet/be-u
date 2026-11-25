"use client";

import type {ReactNode} from "react";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function UserMenuGroup({label, children, className = ""}: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className={["nabbi-user-menu__group", className].filter(Boolean).join(" ")}>
      <p className="nabbi-user-menu__group-label">{label}</p>
      <div className="nabbi-user-menu__rows">{children}</div>
    </div>
  );
}
