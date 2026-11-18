import type {CountryConfig} from "./countries";
import {getCountryConfig} from "./countries";

/** Digits only, capped at phoneLength; strips dial code / leading 0/01 when pasted. */
export function stripToNationalDigits(
  raw: string,
  dialCode: string,
  phoneLength: number
): string {
  let digits = raw.replace(/\D/g, "");
  const dialDigits = dialCode.replace(/\D/g, "");

  // "+52…" / "52…" international paste
  if (dialDigits && digits.startsWith(dialDigits) && digits.length > phoneLength) {
    digits = digits.slice(dialDigits.length);
  }
  // Local trunk prefixes
  if (digits.startsWith("01") && digits.length > phoneLength) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length > phoneLength) {
    digits = digits.slice(1);
  }

  return digits.slice(0, phoneLength);
}

/** Apply spaced display mask from phoneFormat groups. */
export function formatNationalPhone(
  digits: string,
  phoneFormat: readonly number[]
): string {
  let remaining = digits.replace(/\D/g, "");
  const parts: string[] = [];
  for (const len of phoneFormat) {
    if (!remaining) break;
    parts.push(remaining.slice(0, len));
    remaining = remaining.slice(len);
  }
  if (remaining) parts.push(remaining);
  return parts.join(" ");
}

/** Caret index in formatted string after `digitCount` digits. */
export function caretIndexAfterDigits(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]!)) {
      seen += 1;
      if (seen >= digitCount) return i + 1;
    }
  }
  return formatted.length;
}

export function countDigitsBefore(value: string, caret: number): number {
  let n = 0;
  const end = Math.min(caret, value.length);
  for (let i = 0; i < end; i++) {
    if (/\d/.test(value[i]!)) n += 1;
  }
  return n;
}

/** E.164: dialCode + national digits, e.g. "+525512345678". */
export function toE164(nationalDigits: string, dialCode: string): string {
  const digits = nationalDigits.replace(/\D/g, "");
  if (!digits) return "";
  return `${dialCode}${digits}`;
}

export function phoneMetaForCountry(countryCode: string): CountryConfig | undefined {
  return getCountryConfig(countryCode);
}

export function maxFormattedPhoneLength(phoneFormat: readonly number[], phoneLength: number): number {
  const spaces = Math.max(0, phoneFormat.length - 1);
  // Cap by digit groups + spaces; allow residual if format shorter than length
  return phoneLength + spaces;
}
