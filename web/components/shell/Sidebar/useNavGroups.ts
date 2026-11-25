"use client";

import {useCallback, useEffect, useState} from "react";
import {NAV_GROUPS_LS_PREFIX} from "@/components/shell/shell-config";

type OpenMap = Record<string, boolean>;

function storageKey(userId?: number | string | null): string | null {
  if (userId == null) return null;
  return `${NAV_GROUPS_LS_PREFIX}${userId}`;
}

function readMap(userId?: number | string | null): OpenMap {
  const key = storageKey(userId);
  if (!key || typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as OpenMap;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeMap(userId: number | string | null | undefined, map: OpenMap) {
  const key = storageKey(userId);
  if (!key || typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Persist collapsible nav group open state per user. */
export function useNavGroups(userId?: number | string | null) {
  const [openMap, setOpenMap] = useState<OpenMap>({});

  useEffect(() => {
    setOpenMap(readMap(userId));
  }, [userId]);

  const isOpen = useCallback(
    (groupKey: string, fallback = false) =>
      openMap[groupKey] !== undefined ? Boolean(openMap[groupKey]) : fallback,
    [openMap],
  );

  const setOpen = useCallback(
    (groupKey: string, open: boolean) => {
      setOpenMap((prev) => {
        const next = {...prev, [groupKey]: open};
        writeMap(userId, next);
        return next;
      });
    },
    [userId],
  );

  const toggle = useCallback(
    (groupKey: string, fallback = false) => {
      setOpen(groupKey, !isOpen(groupKey, fallback));
    },
    [isOpen, setOpen],
  );

  return {isOpen, setOpen, toggle};
}
