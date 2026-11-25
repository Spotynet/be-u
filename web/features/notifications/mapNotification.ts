import {resolveNotificationHref} from "./resolveNotificationHref";
import type {
  ApiNotificationRow,
  AppNotification,
  AppNotificationActor,
  NotificationSubType,
  NotificationType,
} from "./types";

function metaOf(row: ApiNotificationRow): Record<string, unknown> {
  return {
    ...(row.metadata || {}),
    ...(row.data || {}),
    ...(row.payload || {}),
  };
}

export function mapBackendType(raw?: string): NotificationType {
  const t = String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (t.includes("reserva") || t === "reservation") return "reservation";
  if (t.includes("resen") || t === "review") return "review";
  if (t.includes("mensaje") || t === "message") return "message";
  if (t.includes("social") || t.includes("like") || t.includes("follow"))
    return "social";
  if (t.includes("pago") || t.includes("payment")) return "payment";
  if (t.includes("sistema") || t === "system") return "system";
  return "system";
}

function actorFromMeta(
  meta: Record<string, unknown>,
  type: NotificationType,
): AppNotificationActor | undefined {
  const nameKeys = [
    "client_name",
    "provider_name",
    "reviewer_name",
    "liker_name",
    "commenter_name",
    "saver_name",
    "actor_name",
    "sender_name",
  ];
  let name = "";
  for (const k of nameKeys) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) {
      name = v.trim();
      break;
    }
  }
  if (!name) return undefined;

  const id =
    meta.client_id ??
    meta.provider_id ??
    meta.liker_id ??
    meta.commenter_id ??
    meta.saver_id ??
    meta.actor_id ??
    meta.sender_id;

  const avatarRaw =
    meta.avatar_url ?? meta.avatarUrl ?? meta.photo_url ?? meta.photoUrl;
  const avatarUrl =
    typeof avatarRaw === "string" && avatarRaw ? avatarRaw : undefined;

  return {
    id: id as string | number | undefined,
    name,
    avatarUrl,
  };
}

function subTypeFrom(
  meta: Record<string, unknown>,
  type: NotificationType,
  title: string,
): NotificationSubType | undefined {
  const raw = meta.sub_type ?? meta.subType;
  if (typeof raw === "string" && raw) return raw;

  if (type === "reservation") {
    const status = String(meta.status || "").toLowerCase();
    const t = title.toLowerCase();
    if (t.includes("cancel") || status.includes("cancel")) return "cancelled";
    if (t.includes("recordator") || t.includes("reminder")) return "reminder";
    if (t.includes("reprogram") || t.includes("reschedul")) return "rescheduled";
    if (t.includes("confirm")) return "confirmed";
    if (t.includes("solicitud") || meta.action_required === true)
      return "requested";
  }
  return undefined;
}

export function isApiUnread(row: ApiNotificationRow): boolean {
  if (row.is_unread === true) return true;
  if (row.is_read === true || row.read === true) return false;
  const s = String(row.status || "").toLowerCase();
  if (s === "unread") return true;
  if (s === "read") return false;
  return true;
}

export function mapNotification(row: ApiNotificationRow): AppNotification {
  const meta = metaOf(row);
  const rawType = String(row.type || "sistema");
  const type = mapBackendType(rawType);
  const title = row.title?.trim() || "Aviso";
  const body = (row.message || row.body || "").trim() || undefined;
  const createdAt = row.created_at || new Date().toISOString();
  const read = !isApiUnread(row);
  const actor = actorFromMeta(meta, type);
  const subType = subTypeFrom(meta, type, title);
  const href = resolveNotificationHref({type, subType, meta, rawType});

  return {
    id: row.id,
    type,
    subType,
    title,
    body,
    createdAt,
    read,
    readAt: row.read_at ?? null,
    href,
    actor,
    meta,
    rawType,
  };
}

export function parseUnreadCount(data: {
  unread_count?: number;
  unread?: number;
  total_unread?: number;
}): number {
  return (
    Number(data.unread_count) ||
    Number(data.unread) ||
    Number(data.total_unread) ||
    0
  );
}
