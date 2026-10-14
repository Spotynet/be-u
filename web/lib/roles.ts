/** Backend stores roles as CLIENT | PROFESSIONAL | PLACE (see users.models.User.Role). */

export type AppRole = "CLIENT" | "PROFESSIONAL" | "PLACE" | string;

export function normalizeRole(role?: string | null): string {
  return (role || "").toUpperCase();
}

export function isClientRole(role?: string | null): boolean {
  return normalizeRole(role) === "CLIENT";
}

export function isProviderRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === "PROFESSIONAL" || r === "PLACE";
}

/** Post-login / post-register home — social feed for all roles (Phase 2). */
export function homePathForRole(_role?: string | null): string {
  return "/feed";
}
