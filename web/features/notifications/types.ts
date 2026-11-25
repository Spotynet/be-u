/**
 * Normalized notification types for the web app.
 * Backend stores Spanish keys: reserva | reseña | sistema | mensaje | social.
 */

export type NotificationType =
  | "reservation"
  | "review"
  | "system"
  | "message"
  | "social"
  | "payment";

export type NotificationSubType =
  | "like"
  | "comment"
  | "mention"
  | "saved"
  | "requested"
  | "confirmed"
  | "cancelled"
  | "reminder"
  | "rescheduled"
  | string;

export type AppNotificationActor = {
  id?: string | number;
  name: string;
  avatarUrl?: string;
};

export type AppNotification = {
  id: number;
  type: NotificationType;
  subType?: NotificationSubType;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
  readAt?: string | null;
  href?: string;
  actor?: AppNotificationActor;
  meta: Record<string, unknown>;
  /** Raw backend type string for debugging / filters. */
  rawType: string;
};

export type NotificationsStatus = "idle" | "loading" | "ready" | "error";

export type NotificationsState = {
  items: AppNotification[];
  unreadCount: number;
  status: NotificationsStatus;
  listError: string | null;
  hasMore: boolean;
  page: number;
  lastSyncedAt?: number;
  /** Thin progress while refreshing with cached items. */
  refreshing: boolean;
  offline: boolean;
};

/** Raw API row (snake_case + optional aliases). */
export type ApiNotificationRow = {
  id: number;
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  status?: string;
  is_unread?: boolean;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  updated_at?: string;
  read_at?: string | null;
  time_ago?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

export type ApiStats = {
  total_count?: number;
  unread_count?: number;
  unread?: number;
  total_unread?: number;
  by_type?: Record<string, number>;
  by_status?: Record<string, number>;
};

export type ApiListResponse = {
  results?: ApiNotificationRow[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};
