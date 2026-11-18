"use client";

import {PencilSquareIcon} from "@heroicons/react/24/outline";
import {ROLE_ICONS} from "./AccountStep";
import {ROLE_LABEL, type RegisterRole} from "./types";

interface RoleBadgeProps {
  role: RegisterRole;
  onChangeRole: () => void;
  disabled?: boolean;
}

export function RoleBadge({role, onChangeRole, disabled}: RoleBadgeProps) {
  const roleLabel = ROLE_LABEL[role];
  const RoleIcon = ROLE_ICONS[role];

  return (
    <button
      type="button"
      className="reg-role-badge lp-focus"
      onClick={onChangeRole}
      disabled={disabled}
      aria-label={`Cambiar tipo de cuenta: ${roleLabel}`}>
      <RoleIcon className="reg-role-badge__icon" aria-hidden="true" />
      <span className="reg-role-badge__label">{roleLabel}</span>
      <PencilSquareIcon className="reg-role-badge__edit" aria-hidden="true" />
    </button>
  );
}
