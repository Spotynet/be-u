/** Extensible country list for register — add entries here as we expand. */
export const COUNTRIES = [
  {
    code: "MX",
    label: "México",
    dialCode: "+52",
    phoneLength: 10,
    /** National display groups, e.g. "55 1234 5678". */
    phoneFormat: [2, 4, 4] as const,
  },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
export type CountryConfig = (typeof COUNTRIES)[number];

export const DEFAULT_COUNTRY: CountryCode = "MX";

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRIES.some((c) => c.code === value);
}

export function getCountryConfig(code: string): CountryConfig | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/** Backend User.country is free-text (CharField); send the display label. */
export function countryLabelForCode(code: string): string | undefined {
  return getCountryConfig(code)?.label;
}
