/**
 * Social-center (right rail) policy + breakpoints — single source of truth.
 */

/** Can dock full panel (State A). */
export const SHELL_RAIL_OPEN_PX = 1280;
export const SHELL_RAIL_OPEN_MQ = `(min-width: ${SHELL_RAIL_OPEN_PX}px)`;

/** Can show mini rail (State B); expand → overlay C. */
export const SHELL_RAIL_MINI_PX = 1024;
export const SHELL_RAIL_MINI_MQ = `(min-width: ${SHELL_RAIL_MINI_PX}px)`;

/** Edge handle for drawer (768–1023). */
export const SHELL_RAIL_EDGE_PX = 768;
export const SHELL_RAIL_EDGE_MQ = `(min-width: ${SHELL_RAIL_EDGE_PX}px)`;

export const SHELL_RAIL_WIDE_PX = 1760;
export const SHELL_RAIL_WIDE_MQ = `(min-width: ${SHELL_RAIL_WIDE_PX}px)`;

/** @deprecated use SHELL_RAIL_OPEN_MQ — kept for rare imports */
export const SHELL_RAIL_PX = SHELL_RAIL_OPEN_PX;
export const SHELL_RAIL_MQ = SHELL_RAIL_OPEN_MQ;

export const RAIL_LS_KEY_V1 = "nabbi:rail:v1";
export const RAIL_LS_KEY = "nabbi:rail:v2";

export const RAIL_WIDTH_OPEN = 340;
export const RAIL_WIDTH_WIDE = 380;
export const RAIL_WIDTH_MINI = 64;
/** @deprecated */
export const RAIL_WIDTH_DEFAULT = RAIL_WIDTH_OPEN;

export const RAIL_PANEL_ID = "centro-social";

export type DockedPreference = "open" | "mini";

export type RailMode =
  | "hidden"
  | "open"
  | "mini"
  | "overlay"
  | "drawer";

/** Prefixes where docked/mini rail is hidden; bell/toggle open drawer. */
export const RAIL_OPT_OUT_PREFIXES = [
  "/explore",
  "/notification-preferences",
  "/booking",
  "/posts/create",
  "/delete-account",
  "/calendar/callback",
  "/dashboard",
] as const;

export type RailPolicy = "visible" | "hidden";

export function railPolicyForPath(pathname: string): RailPolicy {
  const path = pathname.split("?")[0] || "/";
  for (const prefix of RAIL_OPT_OUT_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return "hidden";
  }
  return "visible";
}

export type RailSectionId =
  | "notifications"
  | "upcoming"
  | "activity"
  | "suggestions";

export const RAIL_SECTION_IDS: Record<RailSectionId, string> = {
  notifications: "nabbi-social-notifications",
  upcoming: "nabbi-social-upcoming",
  activity: "nabbi-social-activity",
  suggestions: "nabbi-social-suggestions",
};

export function readDockedPreference(): DockedPreference {
  if (typeof window === "undefined") return "open";
  try {
    const v2 = localStorage.getItem(RAIL_LS_KEY);
    if (v2 === "open" || v2 === "mini") return v2;
    const v1 = localStorage.getItem(RAIL_LS_KEY_V1);
    if (v1 != null) {
      const migrated: DockedPreference =
        v1 === "0" || v1 === "closed" ? "mini" : "open";
      localStorage.setItem(RAIL_LS_KEY, migrated);
      localStorage.removeItem(RAIL_LS_KEY_V1);
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return "open";
}

export function writeDockedPreference(docked: DockedPreference) {
  try {
    localStorage.setItem(RAIL_LS_KEY, docked);
    localStorage.removeItem(RAIL_LS_KEY_V1);
  } catch {
    /* ignore */
  }
}
