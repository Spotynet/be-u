"use client";

import {useCallback, useState} from "react";
import {profileCustomizationApi, errorUtils} from "@/lib/api";
import type {DaySchedule} from "../ScheduleEditor";

export function useAvailabilitySchedule() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await profileCustomizationApi.getAvailabilitySchedule();
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : raw?.schedule || raw?.results || [];
      setSchedule(list);
      return list as DaySchedule[];
    } catch (err) {
      const msg = errorUtils.getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (next: DaySchedule[]) => {
    setSaving(true);
    setError(null);
    try {
      await profileCustomizationApi.updateAvailabilitySchedule(next);
      setSchedule(next);
    } catch (err) {
      const msg = errorUtils.getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {schedule, loading, saving, error, load, save, setSchedule};
}
