import type {NotificationSubType, NotificationType} from "./types";

/** Routes that exist in the App Router today — never emit unknown paths. */
const KNOWN = {
  reservation: (id: string | number) => `/reservation/${id}`,
  groupSession: (id: string | number) => `/group-sessions/${id}`,
  post: (id: string | number) => `/post/${id}`,
  profile: (id: string | number) => `/profile/${id}`,
  links: "/links",
  notifications: "/notifications",
  preferences: "/notification-preferences",
} as const;

function idOf(
  meta: Record<string, unknown>,
  ...keys: string[]
): string | number | null {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

type Input = {
  type: NotificationType;
  subType?: NotificationSubType;
  meta: Record<string, unknown>;
  rawType?: string;
};

/**
 * Maps type + metadata to an in-app href, or undefined when no safe destination.
 */
export function resolveNotificationHref(input: Input): string | undefined {
  const {type, meta, rawType} = input;
  const raw = String(rawType || "").toLowerCase();

  const reservationId = idOf(meta, "reservation_id", "reservationId");
  if (reservationId != null) return KNOWN.reservation(reservationId);

  const groupId = idOf(meta, "group_session_id", "groupSessionId");
  if (groupId != null) return KNOWN.groupSession(groupId);

  const postId = idOf(meta, "post_id", "postId");
  if (postId != null) return KNOWN.post(postId);

  const profileId = idOf(
    meta,
    "public_profile_id",
    "publicProfileId",
    "profile_id",
    "profileId",
  );
  if (profileId != null) return KNOWN.profile(profileId);

  const linkId = idOf(meta, "link_id", "linkId");
  if (
    linkId != null ||
    raw.includes("link") ||
    raw.includes("invite") ||
    type === "social" && String(meta.sub_type || "").includes("invite")
  ) {
    return KNOWN.links;
  }

  /* Favorites / saved profile without profile id — no safe destination. */
  if (type === "message") {
    /* No chat route in web inventory yet. */
    return undefined;
  }

  return undefined;
}

export const NOTIFICATION_PREFERENCES_HREF = KNOWN.preferences;
export const NOTIFICATIONS_PAGE_HREF = KNOWN.notifications;
