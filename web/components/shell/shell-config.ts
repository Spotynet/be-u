/**
 * Shell feature flags.
 *
 * When `CLIENT_USES_SIDEBAR` is true, CLIENT gets the same frame+sidebar +
 * in-panel Topbar layout as PROFESSIONAL/PLACE (primary nav lives in the
 * sidebar; `ClientFrameBar` is not rendered on lg+).
 * When false, CLIENT keeps the dark header bar with soft nav pills and no sidebar.
 */
export const CLIENT_USES_SIDEBAR = true;

/**
 * When false, `MobileBottomNav` is not rendered and main content does not
 * reserve bottom padding for it. Primary mobile nav = header burger + drawer.
 */
export const SHOW_MOBILE_BOTTOM_NAV = false;

/**
 * Shell `lg` boundary — must match Tailwind `lg` everywhere.
 * Overlay owners (bell, location, user-menu) mount conditionally on this query;
 * never hide a portaled overlay owner with CSS alone.
 */
export const SHELL_LG_PX = 1024;
export const SHELL_LG_MQ = `(min-width: ${SHELL_LG_PX}px)`;

/** Cookie: `pinned` | `unpinned` (legacy `expanded`→pinned, `collapsed`→unpinned). */
export const SIDEBAR_COOKIE = "nabbi_sidebar";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Parse cookie / legacy values → pinned boolean. Safe for server + client. */
export function parseSidebarCookieValue(
  value: string | undefined | null,
): boolean | null {
  if (value === "pinned" || value === "expanded") return true;
  if (value === "unpinned" || value === "collapsed") return false;
  return null;
}

/** Legacy localStorage key prefix (migrated once → cookie, then deleted). */
export const SIDEBAR_LS_PREFIX = "nabbi-sidebar-collapsed-";

/** Docked expanded / peek panel width. */
export const SIDEBAR_WIDTH_EXPANDED = 264;
/** Unpinned rail width (icons only). Panel inset uses this; peek does not change it. */
export const SIDEBAR_WIDTH_RAIL = 72;

export const SIDEBAR_PEEK_OPEN_DELAY_MS = 120;
export const SIDEBAR_PEEK_CLOSE_DELAY_MS = 220;
export const SIDEBAR_WIDTH_MS = 220;
export const SIDEBAR_LABEL_MS = 140;
export const SIDEBAR_EASE = "cubic-bezier(.2,.8,.2,1)";

export const NAV_GROUPS_LS_PREFIX = "nabbi:nav-groups:v1:";
