"use client";

import {FormEvent, KeyboardEvent, useId, useRef} from "react";
import {
  BuildingStorefrontIcon,
  BriefcaseIcon,
  CheckIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {Input} from "@/components/ui/Input";
import {FieldError} from "@/components/auth/errors/FieldError";
import {ROLE_OPTIONS} from "./registerConfig";
import type {RegisterRole} from "./types";

export const REGISTER_ACCOUNT_FORM_ID = "register-step-account-form";

export const ROLE_ICONS = {
  client: UserIcon,
  professional: BriefcaseIcon,
  place: BuildingStorefrontIcon,
} as const;

interface AccountStepProps {
  email: string;
  role: RegisterRole;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailBlur: () => void;
  onRoleChange: (role: RegisterRole) => void;
  onContinue: (e: FormEvent) => void;
  emailError?: string | null;
  roleError?: string | null;
  isLoading: boolean;
  titleId: string;
  emailInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function AccountStep({
  email,
  role,
  onEmailChange,
  onEmailBlur,
  onRoleChange,
  onContinue,
  emailError,
  roleError,
  isLoading,
  titleId,
  emailInputRef,
}: AccountStepProps) {
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusRole = (index: number) => {
    refs.current[index]?.focus();
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const last = ROLE_OPTIONS.length - 1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = index === last ? 0 : index + 1;
      onRoleChange(ROLE_OPTIONS[next].value);
      focusRole(next);
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = index === 0 ? last : index - 1;
      onRoleChange(ROLE_OPTIONS[prev].value);
      focusRole(prev);
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onRoleChange(ROLE_OPTIONS[index].value);
    }
  };

  return (
    <form
      id={REGISTER_ACCOUNT_FORM_ID}
      className="reg-step reg-step--account auth-form auth-form--step-details"
      noValidate
      onSubmit={onContinue}>
      <div className="auth-form-header auth-form-header--compact">
        <h1
          id={titleId}
          className="auth-title auth-title--embedded"
          tabIndex={-1}
          aria-live="polite">
          Crea tu cuenta
        </h1>
      </div>

      <Input
        ref={emailInputRef}
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ana@email.com"
        value={email}
        onChange={onEmailChange}
        onBlur={onEmailBlur}
        disabled={isLoading}
        required
        error={emailError || undefined}
        leadingIcon={<EnvelopeIcon className="nabbi-field__icon-svg" />}
      />

      <div className="reg-account-roles">
        <p className="auth-field-label" id={`${groupId}-label`}>
          Tipo de cuenta
        </p>
        <div
          className={`reg-role-list${roleError ? " reg-role-list--error" : ""}`}
          role="radiogroup"
          aria-labelledby={`${groupId}-label`}
          aria-invalid={roleError ? true : undefined}
          aria-describedby={roleError ? `${groupId}-error` : undefined}
          id={groupId}>
          {ROLE_OPTIONS.map((option, index) => {
            const selected = role === option.value;
            const Icon = ROLE_ICONS[option.value];
            return (
              <button
                key={option.value}
                type="button"
                ref={(el) => {
                  refs.current[index] = el;
                }}
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                className={`reg-role-card lp-focus${selected ? " is-selected" : ""}`}
                onClick={() => onRoleChange(option.value)}
                onKeyDown={(e) => onKeyDown(index, e)}>
                <span className="reg-role-card__icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="reg-role-card__body">
                  <span className="reg-role-card__title">{option.title}</span>
                  <span className="reg-role-card__desc">{option.description}</span>
                </span>
                <span className="reg-role-card__check" aria-hidden="true">
                  {selected ? <CheckIcon /> : null}
                </span>
              </button>
            );
          })}
        </div>
        <FieldError id={`${groupId}-error`} message={roleError} />
      </div>
    </form>
  );
}
