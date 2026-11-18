"use client";

import {useCallback, useState} from "react";
import {AUTH_ERROR_CATALOG, type AuthErrorCode} from "./authErrorCatalog";
import {buildAppError, formatAuthMessage} from "./formatMessage";
import type {AppError} from "./types";
import {scrollFormFieldIntoView} from "@/hooks/useScrollFade";

export interface UseFormErrorsResult {
  fieldErrors: Record<string, string>;
  formError: AppError | null;
  setFieldError: (field: string, codeOrMessage: string, params?: Record<string, string | number>) => void;
  clearField: (field: string) => void;
  setFromApiError: (error: AppError) => void;
  setFormError: (error: AppError | null) => void;
  clearAll: () => void;
  focusFirstError: (opts?: {
    formId?: string;
    fieldOrder?: string[];
    refs?: Record<string, HTMLElement | null>;
  }) => void;
}

function isCatalogCode(code: string): code is AuthErrorCode {
  return code in AUTH_ERROR_CATALOG;
}

function resolveMessage(
  codeOrMessage: string,
  params?: Record<string, string | number>
): string {
  if (isCatalogCode(codeOrMessage)) {
    return formatAuthMessage(AUTH_ERROR_CATALOG[codeOrMessage].message, params);
  }
  return codeOrMessage;
}

export function useFormErrors(): UseFormErrorsResult {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormErrorState] = useState<AppError | null>(null);

  const setFieldError = useCallback(
    (field: string, codeOrMessage: string, params?: Record<string, string | number>) => {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: resolveMessage(codeOrMessage, params),
      }));
    },
    []
  );

  const clearField = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = {...prev};
      delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFieldErrors({});
    setFormErrorState(null);
  }, []);

  const setFormError = useCallback((error: AppError | null) => {
    setFormErrorState(error);
  }, []);

  const setFromApiError = useCallback((error: AppError) => {
    if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
      const mapped: Record<string, string> = {};
      for (const [field, code] of Object.entries(error.fieldErrors)) {
        mapped[field] = resolveMessage(code, error.params);
      }
      setFieldErrors((prev) => ({...prev, ...mapped}));
      if (error.scope === "form" || error.action) {
        setFormErrorState(error);
      } else {
        setFormErrorState(null);
      }
      return;
    }

    if (error.scope === "field" && error.field) {
      setFieldErrors((prev) => ({
        ...prev,
        [error.field!]: error.message,
      }));
      setFormErrorState(error.action ? error : null);
      return;
    }

    setFormErrorState(error);
  }, []);

  const focusFirstError = useCallback(
    (opts?: {
      formId?: string;
      fieldOrder?: string[];
      refs?: Record<string, HTMLElement | null>;
    }) => {
      requestAnimationFrame(() => {
        const order = opts?.fieldOrder ?? Object.keys(fieldErrors);
        const firstField = order.find((f) => fieldErrors[f]);
        if (firstField && opts?.refs?.[firstField]) {
          opts.refs[firstField]?.focus();
          opts.refs[firstField]?.scrollIntoView({block: "center", behavior: "smooth"});
          return;
        }
        if (opts?.formId) {
          const form = document.getElementById(opts.formId);
          scrollFormFieldIntoView(form, {preferName: firstField});
        }
        if (!firstField && formError) {
          document.getElementById("auth-form-alert")?.focus();
        }
      });
    },
    [fieldErrors, formError]
  );

  return {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    setFromApiError,
    setFormError,
    clearAll,
    focusFirstError,
  };
}

export {buildAppError};
