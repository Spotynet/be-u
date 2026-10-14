"use client";

import {useCallback, useState} from "react";
import {groupSessionApi, errorUtils} from "@/lib/api";

export function useGroupSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (params?: Parameters<typeof groupSessionApi.list>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await groupSessionApi.list(params);
      const list = res.data?.results || [];
      setSessions(list);
      return list;
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {sessions, loading, error, load, setSessions};
}
