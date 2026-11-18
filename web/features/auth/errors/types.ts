export type AuthErrorSeverity = "error" | "warning" | "info";
export type AuthErrorScope = "field" | "form" | "toast";

export type AuthErrorAction =
  | {type: "login"}
  | {type: "verify"}
  | {type: "resend"}
  | {type: "custom"; label: string; href?: string};

export interface AuthErrorCatalogEntry {
  message: string;
  severity: AuthErrorSeverity;
  scope: AuthErrorScope;
  field?: string;
  action?: AuthErrorAction;
}

export interface AppError {
  code: string;
  message: string;
  severity: AuthErrorSeverity;
  scope: AuthErrorScope;
  field?: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
  attemptsLeft?: number;
  status?: number;
  action?: AuthErrorAction;
  params?: Record<string, string | number>;
}

/** Form field names used across login + register (camelCase). */
export type AuthFieldName =
  | "email"
  | "role"
  | "firstName"
  | "lastName"
  | "username"
  | "acceptedTerms"
  | "placeName"
  | "phone"
  | "category"
  | "categories"
  | "subcategory"
  | "subcategories"
  | "bio"
  | "address"
  | "city"
  | "country"
  | "code";
