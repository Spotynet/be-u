"use client";

import {useCallback, useState} from "react";
import {calendarApi, getCalendarRedirectUri, errorUtils} from "@/lib/api";

type Status = {
  is_connected: boolean;
  calendar_id: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  is_active: boolean;
};

export function useGoogleCalendar() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await calendarApi.getStatus();
      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setStatus(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    const redirectUri = getCalendarRedirectUri();
    const res = await calendarApi.getAuthUrl(redirectUri);
    const authUrl = res.data?.auth_url;
    if (!authUrl) throw new Error("No se obtuvo URL de autorización");
    window.location.href = authUrl;
  }, []);

  const disconnect = useCallback(async () => {
    await calendarApi.disconnect();
    await load();
  }, [load]);

  const sync = useCallback(async () => {
    await calendarApi.syncAvailability();
    await load();
  }, [load]);

  return {status, loading, error, load, connect, disconnect, sync};
}
