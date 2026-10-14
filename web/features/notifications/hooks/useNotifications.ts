"use client";

import {useCallback, useState} from "react";
import {notificationApi, errorUtils} from "@/lib/api";

export function useNotifications(params?: {status?: string}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications(params);
      setItems(res.data?.results || []);
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params?.status]);

  const loadStats = useCallback(async () => {
    try {
      const res = await notificationApi.getStats();
      const data = res.data || {};
      setUnreadCount(
        Number(data.unread) || Number(data.unread_count) || Number(data.total_unread) || 0
      );
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    await notificationApi.markAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? {...n, status: "read", is_read: true, read: true} : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationApi.markAllAsRead();
    await load();
  }, [load]);

  return {
    items,
    loading,
    error,
    unreadCount,
    load,
    loadStats,
    markAsRead,
    markAllAsRead,
    setItems,
  };
}
