import type {RegisterStepId} from "@/components/auth/register/types";
import type {AuthFieldName} from "./types";

/** Which register step owns each field (for server-error navigation). */
export const FIELD_STEP_MAP: Record<AuthFieldName, RegisterStepId> = {
  email: "account",
  role: "account",
  firstName: "personal",
  lastName: "personal",
  username: "personal",
  acceptedTerms: "personal", // overridden for pro/place in resolveStepForField
  placeName: "business",
  phone: "personal",
  category: "business",
  categories: "business",
  subcategory: "business",
  subcategories: "business",
  bio: "business",
  address: "business",
  city: "business",
  country: "personal",
  code: "verify",
};

export function resolveStepForField(
  field: string,
  role: "client" | "professional" | "place"
): RegisterStepId {
  if (field === "acceptedTerms") {
    return role === "client" ? "personal" : "business";
  }
  return FIELD_STEP_MAP[field as AuthFieldName] ?? "account";
}
