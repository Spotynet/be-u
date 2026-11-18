export type RegisterRole = "client" | "professional" | "place";

/** Logical steps — order depends on role. */
export type RegisterStepId = "account" | "personal" | "business" | "verify";

export interface RegisterFormData {
  role: RegisterRole;
  firstName: string;
  lastName: string;
  placeName: string;
  username: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  address: string;
  country: string;
  /** Selected main category ids (multi). */
  categories: string[];
  /** Selected subcategory ids (multi), scoped to selected categories. */
  subcategories: string[];
  acceptedTerms: boolean;
}

export const ROLE_LABEL: Record<RegisterRole, string> = {
  client: "Cliente",
  professional: "Profesional",
  place: "Lugar",
};

export function stepsForRole(role: RegisterRole): RegisterStepId[] {
  if (role === "client") {
    return ["account", "personal", "verify"];
  }
  return ["account", "personal", "business", "verify"];
}
