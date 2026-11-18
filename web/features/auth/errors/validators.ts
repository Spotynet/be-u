import {getCountryConfig, isCountryCode} from "@/features/auth/constants/countries";
import type {AuthErrorCode} from "./authErrorCatalog";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
/** Letters (incl. latin accents) and spaces — names */
const NAME_RE = /^[\p{L}\s'’-]+$/u;
/** letters, numbers, `.` `_` — strip leading @ for check */
const USERNAME_RE = /^[a-zA-Z0-9._]+$/;
const CODE_RE = /^\d{6}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

export function validateEmail(value: string): AuthErrorCode | null {
  const v = value.trim();
  if (!v) return "email_required";
  if (!EMAIL_RE.test(v)) return "email_invalid";
  return null;
}

export function validateRole(value: string | null | undefined): AuthErrorCode | null {
  if (!value) return "role_required";
  return null;
}

export function validateName(
  value: string,
  which: "first" | "last"
): AuthErrorCode | null {
  const v = value.trim();
  if (!v) return which === "first" ? "first_name_required" : "last_name_required";
  if (v.length < 2) return "name_too_short";
  if (!NAME_RE.test(v)) return "name_invalid_chars";
  return null;
}

/** First name is required; last name optional but validated when present. */
export function validateFirstName(value: string): AuthErrorCode | null {
  return validateName(value, "first");
}

export function validateLastName(value: string): AuthErrorCode | null {
  const v = value.trim();
  if (!v) return null;
  if (v.length < 2) return "name_too_short";
  if (!NAME_RE.test(v)) return "name_invalid_chars";
  return null;
}

export function validateUsername(value: string): AuthErrorCode | null {
  const v = normalizeUsername(value);
  if (!v) return "username_required";
  if (v.length < 3) return "username_too_short";
  if (v.length > 150) return "username_invalid";
  if (!USERNAME_RE.test(v)) return "username_invalid";
  return null;
}

export function validateTerms(accepted: boolean): AuthErrorCode | null {
  return accepted ? null : "terms_required";
}

export function validateCode(value: string): AuthErrorCode | null {
  const v = value.replace(/\D/g, "").slice(0, 6);
  if (!CODE_RE.test(v)) return "code_incomplete";
  return null;
}

export function validatePlaceName(value: string): AuthErrorCode | null {
  const v = value.trim();
  if (!v) return "place_name_required";
  if (v.length < 2) return "name_too_short";
  return null;
}

export function validateCategory(value: string): AuthErrorCode | null {
  return value.trim() ? null : "categories_required";
}

export function validateSubcategory(value: string): AuthErrorCode | null {
  return value.trim() ? null : "subcategories_required";
}

/** Multi-select: at least one category. */
export function validateCategories(values: string[]): AuthErrorCode | null {
  return values.length > 0 ? null : "categories_required";
}

/** Multi-select: at least one subcategory. */
export function validateSubcategories(values: string[]): AuthErrorCode | null {
  return values.length > 0 ? null : "subcategories_required";
}

export function validateSelectionMin(
  values: unknown[],
  min: number
): AuthErrorCode | null {
  if (values.length >= min) return null;
  if (min <= 1) return "selection_required";
  return "selection_min";
}

export function validateSelectionMax(
  values: unknown[],
  max: number
): AuthErrorCode | null {
  return values.length <= max ? null : "selection_max";
}

/** Required country select — value must be a known COUNTRIES code. */
export function validateCountry(value: string): AuthErrorCode | null {
  const v = value.trim();
  if (!v) return "country_required";
  if (!isCountryCode(v)) return "country_invalid";
  return null;
}

/**
 * Optional phone — empty OK; non-empty must match country's phoneLength (national digits).
 * Returns code + params for catalog interpolation.
 */
export function validatePhone(
  nationalDigits: string,
  countryCode: string
): {code: AuthErrorCode; params?: Record<string, string | number>} | null {
  const digits = nationalDigits.replace(/\D/g, "");
  if (!digits) return null;
  const meta = getCountryConfig(countryCode);
  const len = meta?.phoneLength ?? 10;
  if (digits.length !== len) {
    return {code: "phone_too_short", params: {digits: len}};
  }
  return null;
}

/** Optional address fields — only flag when clearly overlong. */
export function validateOptionalAddressPart(
  value: string,
  field: "address" | "city" | "country"
): AuthErrorCode | null {
  const v = value.trim();
  if (!v) return null;
  if (field === "country") {
    // Country is required on personal; this path is legacy length-only.
    return validateCountry(v);
  }
  if (v.length > 200) {
    if (field === "address") return "address_invalid";
    return "city_invalid";
  }
  return null;
}
