"use client";

import {useId, useMemo, useRef} from "react";
import {AtSymbolIcon, GlobeAltIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/ui/Input";
import {CustomDropdown, type DropdownOption} from "@/components/ui/CustomDropdown";
import {COUNTRIES, getCountryConfig} from "@/features/auth/constants/countries";
import {
  caretIndexAfterDigits,
  countDigitsBefore,
  formatNationalPhone,
  maxFormattedPhoneLength,
  stripToNationalDigits,
} from "@/features/auth/constants/phoneFormat";
import {FieldError} from "@/components/auth/errors/FieldError";
import {RoleBadge} from "./RoleBadge";
import {TermsCheckbox} from "./TermsCheckbox";
import type {RegisterFormData} from "./types";

export const REGISTER_PERSONAL_FORM_ID = "register-step-personal-form";

interface PersonalStepProps {
  formData: RegisterFormData;
  showTerms: boolean;
  fieldErrors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onPhoneChange: (nationalDigits: string) => void;
  onBlur: (field: string) => void;
  onContinue: (e: React.FormEvent) => void;
  onChangeRole: () => void;
  isLoading: boolean;
  titleId: string;
}

function emitFieldChange(
  onChange: PersonalStepProps["onChange"],
  name: string,
  value: string
) {
  onChange({
    target: {name, value, type: "text"},
  } as React.ChangeEvent<HTMLSelectElement>);
}

export function PersonalStep({
  formData,
  showTerms,
  fieldErrors,
  touched,
  onChange,
  onPhoneChange,
  onBlur,
  onContinue,
  onChangeRole,
  isLoading,
  titleId,
}: PersonalStepProps) {
  const err = (field: string) =>
    touched[field] || fieldErrors[field] ? fieldErrors[field] : undefined;

  const phoneId = useId();
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const countryMeta = getCountryConfig(formData.country) ?? COUNTRIES[0];
  const phoneDisplay = formatNationalPhone(formData.phone, countryMeta.phoneFormat);
  const phoneError = err("phone");
  const phoneMaxLen = maxFormattedPhoneLength(
    countryMeta.phoneFormat,
    countryMeta.phoneLength
  );

  const countryOptions = useMemo<DropdownOption[]>(
    () => COUNTRIES.map((c) => ({value: c.code, label: c.label})),
    []
  );

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const digitsBefore = countDigitsBefore(el.value, el.selectionStart ?? el.value.length);
    const national = stripToNationalDigits(
      el.value,
      countryMeta.dialCode,
      countryMeta.phoneLength
    );
    onPhoneChange(national);
    const formatted = formatNationalPhone(national, countryMeta.phoneFormat);
    requestAnimationFrame(() => {
      const input = phoneInputRef.current;
      if (!input) return;
      const pos = caretIndexAfterDigits(formatted, digitsBefore);
      input.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="reg-step reg-step--personal">
      <div className="auth-form-header auth-form-header--compact">
        <div className="reg-title-row">
          <h1
            id={titleId}
            className="auth-title auth-title--embedded reg-title-row__title"
            tabIndex={-1}
            aria-live="polite">
            Cuéntanos de ti
          </h1>
          <RoleBadge role={formData.role} onChangeRole={onChangeRole} disabled={isLoading} />
        </div>
      </div>

      <form
        id={REGISTER_PERSONAL_FORM_ID}
        className="auth-form auth-form--step-details"
        noValidate
        onSubmit={onContinue}>
        <div className="auth-field-row">
          <Input
            label="Nombre"
            name="firstName"
            placeholder="Ana"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={onChange}
            onBlur={() => onBlur("firstName")}
            disabled={isLoading}
            required
            error={err("firstName")}
          />
          <Input
            label="Apellido"
            name="lastName"
            placeholder="García"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={onChange}
            onBlur={() => onBlur("lastName")}
            disabled={isLoading}
            error={err("lastName")}
          />
        </div>

        <Input
          label="Nombre de usuario"
          name="username"
          placeholder="@ana"
          autoComplete="username"
          value={formData.username}
          onChange={onChange}
          onBlur={() => onBlur("username")}
          disabled={isLoading}
          required
          error={err("username")}
          leadingIcon={<AtSymbolIcon className="nabbi-field__icon-svg" />}
        />

        <CustomDropdown
          label="País"
          id="auth-country"
          name="country"
          value={formData.country || null}
          onChange={(value) => emitFieldChange(onChange, "country", value ?? "")}
          onBlur={() => onBlur("country")}
          options={countryOptions}
          searchable="auto"
          disabled={isLoading}
          required
          error={err("country")}
          placeholder="Selecciona un país"
          leadingIcon={<GlobeAltIcon className="nabbi-field__icon-svg" />}
        />

        <div className={`nabbi-field${phoneError ? " nabbi-field--error" : ""}`}>
          <label htmlFor={phoneId} className="nabbi-field__label">
            Teléfono <span className="nabbi-field__label-optional">(opcional)</span>
          </label>
          <div
            className={`auth-phone${phoneError ? " auth-phone--error" : ""}`.trim()}>
            <span className="auth-phone__prefix" aria-hidden="true">
              {countryMeta.dialCode}
            </span>
            <input
              ref={phoneInputRef}
              id={phoneId}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="55 1234 5678"
              maxLength={phoneMaxLen}
              value={phoneDisplay}
              onChange={handlePhoneInput}
              onBlur={() => onBlur("phone")}
              disabled={isLoading}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={phoneError ? `${phoneId}-error` : undefined}
              className="auth-phone__input nabbi-field__control"
            />
          </div>
          <FieldError id={`${phoneId}-error`} message={phoneError} />
        </div>

        {showTerms ? (
          <TermsCheckbox
            checked={formData.acceptedTerms}
            onChange={onChange}
            disabled={isLoading}
            error={err("acceptedTerms")}
          />
        ) : null}
      </form>
    </div>
  );
}
