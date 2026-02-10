import {useState, useEffect, useCallback} from "react";
import {Alert} from "react-native";
import {Notification, NotificationFilters, NotificationType} from "../types";
import {notificationApi} from "@/lib/api";

// Map backend notification types to Spanish frontend types (now both use Spanish)
const mapNotificationType = (backendType: string): NotificationType => {
  // Backend now uses Spanish types, so we can use them directly
  if (["reserva", "reseña", "sistema", "mensaje"].includes(backendType)) {
    return backendType as NotificationType;
  }
  return "sistema"; // Default fallback
};

// Normalize status so UI always sees "read" | "unread"
const normalizeStatus = (s: string | undefined): "read" | "unread" =>
  s === "read" || (typeof s === "string" && s.toLowerCase() === "read") ? "read" : "unread";

export const useNotifications = (filters?: NotificationFilters) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total_count: number;
    unread_count: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  } | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare API parameters
      const params: any = {};
      if (filters?.type) params.type = filters.type;
      if (filters?.status) params.status = filters.status;
      if (filters?.dateFrom) params.date_from = filters.dateFrom;
      if (filters?.dateTo) params.date_to = filters.dateTo;

      // Fetch notifications
      const response = await notificationApi.getNotifications(params);
      const payload = response.data?.results ?? response.data ?? [];

      // Transform API response to match our Notification interface
      const transformedNotifications: Notification[] = (Array.isArray(payload) ? payload : []).map((item: any) => ({
        id: item.id,
        type: mapNotificationType(item.type),
        title: item.title,
        message: item.message,
        timestamp: item.created_at,
        status: normalizeStatus(item.status),
        relatedId: item.content_object?.id || item.metadata?.reservation_id,
        metadata: {
          ...(item.metadata || {}),
          // Ensure reservation_id is available in metadata
          reservation_id: item.metadata?.reservation_id || item.content_object?.id,
        },
      }));

      setNotifications(transformedNotifications);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);

      // Handle 404 or API not available as empty state instead of error
      if (
        err.status === 404 ||
        err.message?.includes("404") ||
        err.message?.includes("not found")
      ) {
        setNotifications([]);
        setError(null);
        // Set empty stats when API is not available
        setStats({
          total_count: 0,
          unread_count: 0,
          by_type: {},
          by_status: {read: 0, unread: 0},
        });
      } else {
        setError(err?.message || "Error al cargar las notificaciones");
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationApi.getStats();
      setStats(response.data ?? null);
    } catch (err: any) {
      console.error("Error fetching notification stats:", err);

      // Handle 404 or API not available as empty stats
      if (
        err.status === 404 ||
        err.message?.includes("404") ||
        err.message?.includes("not found")
      ) {
        setStats({
          total_count: 0,
          unread_count: 0,
          by_type: {},
          by_status: {read: 0, unread: 0},
        });
      }
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await notificationApi.markAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {...notification, status: "read" as const}
              : notification
          )
        );

        // Update stats
        if (stats) {
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  unread_count: Math.max(0, prev.unread_count - 1),
                  by_status: {
                    ...prev.by_status,
                    read: (prev.by_status.read || 0) + 1,
                    unread: Math.max(0, (prev.by_status.unread || 0) - 1),
                  },
                }
              : null
          );
        }
      } catch (err: any) {
        console.error("Error marking notification as read:", err);
        Alert.alert("Error", err.message || "No se pudo marcar la notificación como leída");
      }
    },
    [stats]
  );

  const markAsUnread = useCallback(
    async (notificationId: number) => {
      try {
        await notificationApi.markAsUnread(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {...notification, status: "unread" as const}
              : notification
          )
        );

        // Update stats
        if (stats) {
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  unread_count: prev.unread_count + 1,
                  by_status: {
                    ...prev.by_status,
                    read: Math.max(0, (prev.by_status.read || 0) - 1),
                    unread: (prev.by_status.unread || 0) + 1,
                  },
                }
              : null
          );
        }
      } catch (err: any) {
        console.error("Error marking notification as unread:", err);
        Alert.alert("Error", err.message || "No se pudo marcar la notificación como no leída");
      }
    },
    [stats]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update first so the UI updates immediately (dots disappear)
    setNotifications((prev) =>
      prev.length === 0 ? prev : prev.map((n) => ({...n, status: "read" as const}))
    );
    setStats((prev) =>
      prev
        ? {
            ...prev,
            unread_count: 0,
            by_status: { ...prev.by_status, read: prev.total_count, unread: 0 },
          }
        : null
    );

    try {
      await notificationApi.markAllAsRead();
      // Only refetch stats so header badge updates; do not refetch list to avoid overwriting with cached/stale data
      await fetchStats();
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      // Revert: refetch list and stats so UI shows server state
      await fetchStats();
      await fetchNotifications();
      Alert.alert(
        "Error",
        err?.response?.data?.detail || err?.message || "No se pudieron marcar todas las notificaciones como leídas"
      );
    }
  }, [fetchStats, fetchNotifications]);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        await notificationApi.deleteNotification(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );

        // Update stats
        if (stats) {
          const deletedNotification = notifications.find((n) => n.id === notificationId);
          const wasUnread = deletedNotification?.status === "unread";

          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  total_count: prev.total_count - 1,
                  unread_count: wasUnread ? Math.max(0, prev.unread_count - 1) : prev.unread_count,
                  by_status: {
                    ...prev.by_status,
                    [deletedNotification?.status || "read"]: Math.max(
                      0,
                      (prev.by_status[deletedNotification?.status || "read"] || 0) - 1
                    ),
                  },
                }
              : null
          );
        }
      } catch (err: any) {
        console.error("Error deleting notification:", err);
        Alert.alert("Error", err.message || "No se pudo eliminar la notificación");
      }
    },
    [notifications, stats]
  );

  const bulkAction = useCallback(
    async (notificationIds: number[], action: "mark_read" | "mark_unread" | "delete") => {
      try {
        await notificationApi.bulkAction({
          notification_ids: notificationIds,
          action,
        });

        // Refresh notifications after bulk action
        await fetchNotifications();
        await fetchStats();
      } catch (err: any) {
        console.error("Error performing bulk action:", err);
        Alert.alert("Error", err.message || "No se pudo realizar la acción en lote");
      }
    },
    [fetchNotifications, fetchStats]
  );

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  // Calculate unread count from local state as fallback
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return {
    notifications,
    isLoading,
    error,
    unreadCount: stats?.unread_count ?? unreadCount,
    stats,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    bulkAction,
    refreshNotifications: fetchNotifications,
  };
};
