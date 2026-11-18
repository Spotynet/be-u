import {isAxiosError} from "axios";
import {buildAppError} from "./formatMessage";
import type {AppError} from "./types";

type JsonRecord = Record<string, unknown>;

const FIELD_KEY_MAP: Record<string, string> = {
  email: "email",
  username: "username",
  first_name: "firstName",
  firstName: "firstName",
  last_name: "lastName",
  lastName: "lastName",
  place_name: "placeName",
  placeName: "placeName",
  phone: "phone",
  category: "categories",
  categories: "categories",
  subcategory: "subcategories",
  subcategories: "subcategories",
  sub_category: "subcategories",
  sub_categories: "subcategories",
  bio: "bio",
  address: "address",
  city: "city",
  country: "country",
  code: "code",
  role: "role",
  accepted_terms: "acceptedTerms",
  acceptedTerms: "acceptedTerms",
};

const MACHINE_CODES = new Set([
  "invalid_code",
  "code_expired",
  "too_many_attempts",
  "no_active_code",
  "email_not_verified",
  "cooldown_active",
  "rate_limited",
  "resend_cooldown",
]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return undefined;
}

function readRetryAfter(error: unknown, data: JsonRecord | undefined): number | undefined {
  if (data) {
    const body =
      typeof data.retryAfter === "number"
        ? data.retryAfter
        : typeof data.retry_after === "number"
          ? data.retry_after
          : undefined;
    if (typeof body === "number" && body >= 0) return Math.ceil(body);
  }
  if (isAxiosError(error)) {
    const header = error.response?.headers?.["retry-after"] ?? error.response?.headers?.["Retry-After"];
    if (typeof header === "string" && header.trim()) {
      const n = Number(header);
      if (!Number.isNaN(n) && n >= 0) return Math.ceil(n);
    }
  }
  return undefined;
}

function mapKnownMessage(raw: string): string | null {
  const lower = raw.toLowerCase();
  if (lower.includes("email already exists") || lower.includes("user with this email")) {
    return "email_taken";
  }
  if (lower.includes("username already exists")) {
    return "username_taken";
  }
  if (lower.includes("email and username are required") || lower.includes("required")) {
    // Too generic — leave to field map when present
    return null;
  }
  return null;
}

function extractFieldErrors(data: JsonRecord): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "code" || key === "message" || key === "error" || key === "detail") continue;
    if (key === "attemptsLeft" || key === "attempts_left") continue;
    if (key === "retryAfter" || key === "retry_after") continue;
    const formKey = FIELD_KEY_MAP[key];
    if (!formKey) continue;
    const text = firstString(value);
    if (!text) continue;
    const known = mapKnownMessage(text);
    if (known === "email_taken" || known === "username_taken") {
      out[formKey] = known;
    } else {
      // Store catalog code when we can; otherwise mark as unknown field message
      out[formKey] = known ?? "unknown";
    }
  }
  return out;
}

function debugOriginal(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[auth parseApiError]", error);
  }
}

/**
 * Normalize Axios / unknown errors into a catalog-backed AppError.
 * Never returns raw backend strings as user-facing message.
 */
export function parseApiError(error: unknown): AppError {
  // Offline (browser)
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return buildAppError("network_offline");
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = isRecord(error.response?.data) ? error.response.data : undefined;
    const retryAfter = readRetryAfter(error, data);

    // No response → network / timeout
    if (!error.response) {
      const code = error.code;
      if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
        return buildAppError("timeout", {status});
      }
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return buildAppError("network_offline");
      }
      return buildAppError("network_error");
    }

    // Machine code from verification / auth endpoints
    const machineCode =
      (typeof data?.code === "string" && data.code) ||
      (typeof data?.error === "string" && MACHINE_CODES.has(data.error) ? data.error : undefined);

    const attemptsLeft =
      typeof data?.attemptsLeft === "number"
        ? data.attemptsLeft
        : typeof data?.attempts_left === "number"
          ? data.attempts_left
          : undefined;

    if (machineCode && MACHINE_CODES.has(machineCode)) {
      const params: Record<string, string | number> = {};
      if (typeof attemptsLeft === "number") params.attemptsLeft = attemptsLeft;
      if (typeof retryAfter === "number") params.seconds = retryAfter;

      let code = machineCode;
      if (machineCode === "cooldown_active") {
        code = retryAfter && retryAfter > 0 ? "resend_cooldown" : "rate_limited";
      }

      // invalid_code without attempts → still show message (attemptsLeft may be 0)
      if (code === "invalid_code" && typeof attemptsLeft !== "number") {
        return buildAppError("invalid_code", {
          status,
          params: {attemptsLeft: "0"},
          attemptsLeft: 0,
          message: "Código incorrecto.",
        });
      }

      return buildAppError(code, {
        status,
        retryAfter,
        attemptsLeft,
        params,
        field: code === "invalid_code" ? "code" : undefined,
      });
    }

    // Plain string / error message mapping
    const rawMessage =
      firstString(data?.error) ||
      firstString(data?.message) ||
      firstString(data?.detail) ||
      (typeof error.response.data === "string" ? error.response.data : undefined);

    if (rawMessage) {
      const known = mapKnownMessage(rawMessage);
      if (known) {
        return buildAppError(known, {status});
      }
    }

    // DRF field errors
    if (data && status === 400) {
      const fieldErrors = extractFieldErrors(data);
      if (Object.keys(fieldErrors).length > 0) {
        const firstField = Object.keys(fieldErrors)[0];
        const firstCode = fieldErrors[firstField];
        return buildAppError(firstCode, {
          status,
          field: firstField,
          fieldErrors,
          scope: "field",
        });
      }
    }

    if (status === 401) {
      return buildAppError("unauthorized", {status});
    }
    if (status === 403) {
      return buildAppError("forbidden", {status});
    }
    if (status === 404) {
      // Avoid account enumeration — generic
      return buildAppError("account_not_found", {status});
    }
    if (status === 409) {
      // Conflict often email/username — prefer email_taken if message hints, else unknown form
      if (rawMessage) {
        const known = mapKnownMessage(rawMessage);
        if (known) return buildAppError(known, {status});
      }
      return buildAppError("email_taken", {status});
    }
    if (status === 429) {
      const seconds = retryAfter ?? 30;
      return buildAppError("rate_limited", {
        status,
        retryAfter: seconds,
        params: {seconds},
      });
    }
    if (typeof status === "number" && status >= 500) {
      return buildAppError("server_error", {status});
    }

    debugOriginal(error);
    return buildAppError("unknown", {status});
  }

  // Non-axios
  if (error instanceof Error && /network|fetch|failed to fetch/i.test(error.message)) {
    return buildAppError("network_error");
  }

  debugOriginal(error);
  return buildAppError("unknown");
}
