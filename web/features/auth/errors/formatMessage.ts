import {getCatalogEntry} from "./authErrorCatalog";
import type {AppError, AuthErrorCatalogEntry} from "./types";

/** Replace `{key}` placeholders in catalog messages. */
export function formatAuthMessage(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function buildAppError(
  code: string,
  overrides?: Partial<Omit<AppError, "code" | "message">> & {
    message?: string;
    params?: Record<string, string | number>;
  }
): AppError {
  const entry: AuthErrorCatalogEntry = getCatalogEntry(code);
  const params = overrides?.params;
  return {
    code,
    message: formatAuthMessage(overrides?.message ?? entry.message, params),
    severity: overrides?.severity ?? entry.severity,
    scope: overrides?.scope ?? entry.scope,
    field: overrides?.field ?? entry.field,
    fieldErrors: overrides?.fieldErrors,
    retryAfter: overrides?.retryAfter,
    attemptsLeft: overrides?.attemptsLeft,
    status: overrides?.status,
    action: overrides?.action ?? entry.action,
    params,
  };
}
