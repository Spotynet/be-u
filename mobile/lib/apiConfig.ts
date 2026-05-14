/**
 * Single source of truth for the Django API base URL (path includes `/api`).
 * Set `EXPO_PUBLIC_API_URL` in `mobile/.env` (e.g. dev vs staging vs prod).
 */

const DEFAULT_API_BASE = "https://nabbi-api-dev.spotynet.com/api";

export function getApiBaseUrl(): string {
  const raw =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
    DEFAULT_API_BASE;
  return raw.replace(/\/+$/, "");
}

/** Origin only (no `/api`) — for resolving relative media URLs. */
export function getApiOrigin(): string {
  const base = getApiBaseUrl();
  return base.endsWith("/api") ? base.slice(0, -4) : base.replace(/\/api\/?$/, "");
}
