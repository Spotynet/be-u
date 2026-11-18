"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {Squares2X2Icon, TagIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/ui/Input";
import {
  CustomMultiSelect,
  type DropdownOption,
} from "@/components/ui/CustomMultiSelect";
import {Textarea} from "@/components/ui/Textarea";
import {MAIN_CATEGORIES, ROLE_FIELD_CONFIG, SUB_CATEGORIES} from "./registerConfig";
import {RoleBadge} from "./RoleBadge";
import {TermsCheckbox} from "./TermsCheckbox";
import type {RegisterFormData} from "./types";

export const REGISTER_BUSINESS_FORM_ID = "register-step-business-form";

interface BusinessStepProps {
  formData: RegisterFormData;
  fieldErrors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onCategoriesChange: (values: string[]) => void;
  onSubcategoriesChange: (values: string[]) => void;
  onBlur: (field: string) => void;
  onContinue: (e: React.FormEvent) => void;
  onChangeRole: () => void;
  isLoading: boolean;
  titleId: string;
}

export function BusinessStep({
  formData,
  fieldErrors,
  touched,
  onChange,
  onCategoriesChange,
  onSubcategoriesChange,
  onBlur,
  onContinue,
  onChangeRole,
  isLoading,
  titleId,
}: BusinessStepProps) {
  const cfg = ROLE_FIELD_CONFIG[formData.role];
  const title =
    formData.role === "place" ? "Tu negocio" : "Tu perfil profesional";
  const err = (field: string) =>
    touched[field] || fieldErrors[field] ? fieldErrors[field] : undefined;

  const [orphanNotice, setOrphanNotice] = useState<string | null>(null);
  const prevCatsRef = useRef<string[]>(formData.categories);
  const subsRef = useRef(formData.subcategories);
  subsRef.current = formData.subcategories;

  const categoryOptions = useMemo<DropdownOption[]>(
    () => MAIN_CATEGORIES.map((c) => ({value: c.id, label: c.name})),
    []
  );

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of MAIN_CATEGORIES) m.set(c.id, c.name);
    return m;
  }, []);

  const subcategoryOptions = useMemo<DropdownOption[]>(() => {
    const opts: DropdownOption[] = [];
    for (const catId of formData.categories) {
      const group = categoryNameById.get(catId) ?? catId;
      for (const s of SUB_CATEGORIES[catId] || []) {
        opts.push({value: s.id, label: s.name, group});
      }
    }
    return opts;
  }, [formData.categories, categoryNameById]);

  // When a parent category is removed, drop orphan subcategories + notice
  useEffect(() => {
    const prev = prevCatsRef.current;
    const removed = prev.filter((c) => !formData.categories.includes(c));
    prevCatsRef.current = formData.categories;
    if (!removed.length) return;

    const allowed = new Set(
      formData.categories.flatMap((c) => (SUB_CATEGORIES[c] || []).map((s) => s.id))
    );
    const current = subsRef.current;
    const kept = current.filter((id) => allowed.has(id));
    const dropped = current.length - kept.length;
    if (dropped <= 0) return;

    onSubcategoriesChange(kept);
    const names = removed.map((id) => categoryNameById.get(id) ?? id).join(", ");
    setOrphanNotice(
      dropped === 1
        ? `Quitamos 1 subcategoría de ${names}.`
        : `Quitamos ${dropped} subcategorías de ${names}.`
    );
  }, [formData.categories, onSubcategoriesChange, categoryNameById]);

  useEffect(() => {
    if (!orphanNotice) return;
    const t = window.setTimeout(() => setOrphanNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [orphanNotice]);

  const subsDisabled = isLoading || formData.categories.length === 0;

  return (
    <div className="reg-step reg-step--business">
      <div className="auth-form-header auth-form-header--compact">
        <div className="reg-title-row">
          <h1
            id={titleId}
            className="auth-title auth-title--embedded reg-title-row__title"
            tabIndex={-1}
            aria-live="polite">
            {title}
          </h1>
          <RoleBadge role={formData.role} onChangeRole={onChangeRole} disabled={isLoading} />
        </div>
      </div>

      <form
        id={REGISTER_BUSINESS_FORM_ID}
        className="auth-form auth-form--step-details"
        noValidate
        onSubmit={onContinue}>
        {cfg.usesPlaceName ? (
          <Input
            label="Nombre del lugar"
            name="placeName"
            placeholder="Nombre de tu salón o negocio"
            value={formData.placeName}
            onChange={onChange}
            onBlur={() => onBlur("placeName")}
            disabled={isLoading}
            required
            error={err("placeName")}
          />
        ) : null}

        {cfg.showCategory ? (
          <>
            <CustomMultiSelect
              label="Categorías"
              id="auth-category"
              name="categories"
              value={formData.categories}
              onChange={(values) => onCategoriesChange(values)}
              onBlur={() => onBlur("categories")}
              options={categoryOptions}
              searchable="auto"
              disabled={isLoading}
              required
              min={1}
              error={err("categories")}
              placeholder="Selecciona una o más categorías"
              leadingIcon={<Squares2X2Icon className="nabbi-field__icon-svg" />}
            />
            <CustomMultiSelect
              label="Subcategorías"
              id="auth-subcategory"
              name="subcategories"
              value={formData.subcategories}
              onChange={(values) => onSubcategoriesChange(values)}
              onBlur={() => onBlur("subcategories")}
              options={subcategoryOptions}
              searchable="auto"
              disabled={subsDisabled}
              disabledReason={
                formData.categories.length === 0
                  ? "Elige primero una categoría."
                  : undefined
              }
              required
              min={1}
              error={err("subcategories")}
              placeholder="Selecciona una o más subcategorías"
              leadingIcon={<TagIcon className="nabbi-field__icon-svg" />}
            />
            {orphanNotice ? (
              <p className="cms-notice" role="status" aria-live="polite">
                {orphanNotice}
              </p>
            ) : null}
          </>
        ) : null}

        {cfg.showBio ? (
          <Textarea
            label="Bio (opcional)"
            id="auth-bio"
            name="bio"
            placeholder="Cuéntale a tus clientes qué haces"
            value={formData.bio}
            onChange={onChange}
            disabled={isLoading}
            rows={3}
          />
        ) : null}

        <div className="reg-field-group">
          <Input
            label="Dirección (opcional)"
            name="address"
            placeholder="Calle y número"
            autoComplete="street-address"
            value={formData.address}
            onChange={onChange}
            onBlur={() => onBlur("address")}
            disabled={isLoading}
            error={err("address")}
          />
          <Input
            label="Ciudad (opcional)"
            name="city"
            placeholder="Ciudad"
            autoComplete="address-level2"
            value={formData.city}
            onChange={onChange}
            onBlur={() => onBlur("city")}
            disabled={isLoading}
            error={err("city")}
          />
        </div>

        <TermsCheckbox
          checked={formData.acceptedTerms}
          onChange={onChange}
          disabled={isLoading}
          error={err("acceptedTerms")}
        />
      </form>
    </div>
  );
}
