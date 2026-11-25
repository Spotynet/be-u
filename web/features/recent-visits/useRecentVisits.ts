"use client";

import {useCallback, useEffect, useSyncExternalStore} from "react";

export type RecentVisitKind = "professional" | "place";

export type RecentVisit = {
  id: number;
  kind: RecentVisitKind;
  href: string;
  name: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
  visitedAt: number;
};

const MAX = 10;
const KEY_PREFIX = "nabbi:recent-visits:v1:";

type Store = {
  userId: string | number | null;
  items: RecentVisit[];
};

let memory: Store = {userId: null, items: []};
const listeners = new Set<() => void>();

function keyFor(userId: string | number) {
  return `${KEY_PREFIX}${userId}`;
}

function emit() {
  listeners.forEach((l) => l());
}

function read(userId: string | number | null): RecentVisit[] {
  if (userId == null || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentVisit[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX);
  } catch {
    return [];
  }
}

function write(userId: string | number, items: RecentVisit[]) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* quota / private mode */
  }
}

function setStore(next: Store) {
  memory = next;
  emit();
}

function ensureUser(userId: string | number | null) {
  if (memory.userId === userId) return;
  setStore({userId, items: read(userId)});
}

export function recordVisit(
  userId: string | number | null | undefined,
  entry: Omit<RecentVisit, "visitedAt"> & {visitedAt?: number},
) {
  if (userId == null) return;
  ensureUser(userId);
  const visitedAt = entry.visitedAt ?? Date.now();
  const next = [
    {...entry, visitedAt},
    ...memory.items.filter((i) => i.id !== entry.id),
  ].slice(0, MAX);
  write(userId, next);
  setStore({userId, items: next});
}

export function clearRecentVisits(userId: string | number | null | undefined) {
  if (userId == null) return;
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    /* ignore */
  }
  setStore({userId, items: []});
}

/** Clear all versioned recent-visit keys (logout). */
export function clearAllRecentVisits() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  setStore({userId: null, items: []});
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || !e.key.startsWith(KEY_PREFIX)) return;
    if (memory.userId != null && e.key === keyFor(memory.userId)) {
      setStore({userId: memory.userId, items: read(memory.userId)});
    } else {
      onChange();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getSnapshot(): RecentVisit[] {
  return memory.items;
}

function getServerSnapshot(): RecentVisit[] {
  return [];
}

export function useRecentVisits(userId: string | number | null | undefined) {
  useEffect(() => {
    if (userId == null) {
      setStore({userId: null, items: []});
      return;
    }
    ensureUser(userId);
  }, [userId]);

  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const clear = useCallback(() => {
    clearRecentVisits(userId ?? null);
  }, [userId]);

  const record = useCallback(
    (entry: Omit<RecentVisit, "visitedAt"> & {visitedAt?: number}) => {
      recordVisit(userId ?? null, entry);
    },
    [userId],
  );

  return {items, clear, record};
}
