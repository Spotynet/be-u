/** Backend stores roles as CLIENT | PROFESSIONAL | PLACE (see users.models.User.Role). */

import {getAppHomePath} from "@/lib/appHome";

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

/** Spanish UI label for a user role — never print the raw enum. */
export function roleLabelEs(role?: string | null): string {
  const r = normalizeRole(role);
  if (r === "PROFESSIONAL") return "Profesional";
  if (r === "PLACE") return "Lugar";
  if (r === "CLIENT") return "Cliente";
  return "Usuario";
}

/**
 * Post-login / post-register home.
 * Desktop/tablet → /explore (marketplace); mobile → /feed (social).
 */
export function homePathForRole(_role?: string | null): string {
  return getAppHomePath();
}
