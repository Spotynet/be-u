"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {errorUtils, notificationApi} from "@/lib/api";
import {useToast} from "@/components/ui/Toast";
import {
  postNotificationsBroadcast,
  subscribeNotificationsBroadcast,
  type NotificationsBroadcast,
} from "./channel";
import {mapNotification, parseUnreadCount} from "./mapNotification";
import type {
  ApiListResponse,
  ApiStats,
  AppNotification,
  NotificationsState,
} from "./types";

const PAGE_SIZE = 20;
const POLL_BASE_MS = 60_000;
const POLL_JITTER = 0.1;
const MAX_BACKOFF_MS = 5 * 60_000;
const LIST_STALE_MS = 30_000;
const MAX_RENDERED = 200;

type TabFilter = "all" | "unread";

type NotificationsContextValue = NotificationsState & {
  tab: TabFilter;
  setTab: (t: TabFilter) => void;
  refresh: () => Promise<void>;
  refreshCount: () => Promise<void>;
  loadMore: () => Promise<void>;
  openList: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markUnread: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
  filteredItems: AppNotification[];
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

function jittered(ms: number): number {
  const j = 1 + (Math.random() * 2 - 1) * POLL_JITTER;
  return Math.round(ms * j);
}

const INITIAL: NotificationsState = {
  items: [],
  unreadCount: 0,
  status: "idle",
  listError: null,
  hasMore: false,
  page: 0,
  refreshing: false,
  offline: false,
};

function useDocumentTitleUnread(unreadCount: number, enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const strip = (t: string) => t.replace(/^\(\d+\+?\)\s*/, "");
    let applying = false;

    const sync = () => {
      if (applying) return;
      const base = strip(document.title) || "nabbi";
      const prefix =
        unreadCount > 0
          ? `(${unreadCount >= 100 ? "99+" : unreadCount}) `
          : "";
      const next = `${prefix}${base}`;
      if (document.title === next) return;
      applying = true;
      document.title = next;
      queueMicrotask(() => {
        applying = false;
      });
    };

    sync();
    const titleEl = document.querySelector("title");
    const obs = titleEl
      ? new MutationObserver(() => {
          if (!applying) sync();
        })
      : null;
    if (titleEl && obs) {
      obs.observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    return () => {
      obs?.disconnect();
      applying = true;
      document.title = strip(document.title);
    };
  }, [unreadCount, enabled]);
}

export function NotificationsProvider({children}: {children: ReactNode}) {
  const {isAuthenticated, user} = useAuth();
  const toast = useToast();
  const [state, setState] = useState<NotificationsState>(INITIAL);
  const [tab, setTab] = useState<TabFilter>("all");
  const stateRef = useRef(state);
  stateRef.current = state;

  const statsAbort = useRef<AbortController | null>(null);
  const listAbort = useRef<AbortController | null>(null);
  const statsInflight = useRef<Promise<void> | null>(null);
  const backoffRef = useRef(POLL_BASE_MS);
  const selfBroadcast = useRef(false);

  const reset = useCallback(() => {
    statsAbort.current?.abort();
    listAbort.current?.abort();
    setState(INITIAL);
    setTab("all");
    backoffRef.current = POLL_BASE_MS;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) reset();
  }, [isAuthenticated, user?.id, reset]);

  useDocumentTitleUnread(state.unreadCount, Boolean(isAuthenticated));

  const applyUnread = useCallback((n: number, broadcast = true) => {
    setState((s) => ({...s, unreadCount: Math.max(0, n)}));
    if (broadcast) {
      selfBroadcast.current = true;
      postNotificationsBroadcast({
        kind: "unread",
        unreadCount: Math.max(0, n),
        at: Date.now(),
      });
      queueMicrotask(() => {
        selfBroadcast.current = false;
      });
    }
  }, []);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    if (statsInflight.current) return statsInflight.current;

    statsAbort.current?.abort();
    const ac = new AbortController();
    statsAbort.current = ac;

    const run = (async () => {
      try {
        const res = await notificationApi.getStats();
        if (ac.signal.aborted) return;
        const count = parseUnreadCount((res.data || {}) as ApiStats);
        applyUnread(count);
        backoffRef.current = POLL_BASE_MS;
        setState((s) => ({...s, offline: false}));
      } catch (err) {
        if (ac.signal.aborted) return;
        const offline =
          typeof navigator !== "undefined" && navigator.onLine === false;
        setState((s) => ({...s, offline}));
        backoffRef.current = Math.min(
          MAX_BACKOFF_MS,
          Math.round(backoffRef.current * 1.8),
        );
        void err;
      } finally {
        statsInflight.current = null;
      }
    })();

    statsInflight.current = run;
    return run;
  }, [isAuthenticated, applyUnread]);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (!isAuthenticated) return;
      listAbort.current?.abort();
      const ac = new AbortController();
      listAbort.current = ac;

      const hasCache = stateRef.current.items.length > 0;
      if (!append) {
        setState((s) => ({
          ...s,
          status: hasCache ? s.status : "loading",
          refreshing: hasCache,
          listError: null,
        }));
      }

      try {
        const res = await notificationApi.getNotifications({
          page,
          page_size: PAGE_SIZE,
        });
        if (ac.signal.aborted) return;

        const data = (res.data || {}) as ApiListResponse;
        const mapped = (data.results || []).map((row) =>
          mapNotification(row as import("./types").ApiNotificationRow),
        );
        const hasMore = Boolean(data.next);

        setState((s) => {
          const merged = append
            ? [...s.items, ...mapped.filter((n) => !s.items.some((x) => x.id === n.id))]
            : mapped;
          const capped = merged.slice(0, MAX_RENDERED);
          return {
            ...s,
            items: capped,
            hasMore: hasMore && capped.length < MAX_RENDERED,
            page,
            status: "ready",
            listError: null,
            refreshing: false,
            lastSyncedAt: Date.now(),
            offline: false,
          };
        });
        backoffRef.current = POLL_BASE_MS;
      } catch (err) {
        if (ac.signal.aborted) return;
        const offline =
          typeof navigator !== "undefined" && navigator.onLine === false;
        setState((s) => ({
          ...s,
          status: s.items.length ? "ready" : "error",
          listError: errorUtils.getErrorMessage(err),
          refreshing: false,
          offline,
        }));
      }
    },
    [isAuthenticated],
  );

  const refresh = useCallback(async () => {
    await Promise.all([refreshCount(), fetchPage(1, false)]);
  }, [refreshCount, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!stateRef.current.hasMore) return;
    await fetchPage(stateRef.current.page + 1, true);
  }, [fetchPage]);

  const openList = useCallback(async () => {
    const stale =
      !stateRef.current.lastSyncedAt ||
      Date.now() - stateRef.current.lastSyncedAt > LIST_STALE_MS;
    if (stale || stateRef.current.items.length === 0) {
      await fetchPage(1, false);
    }
    await refreshCount();
  }, [fetchPage, refreshCount]);

  const markRead = useCallback(
    async (id: number) => {
      const prev = stateRef.current;
      const target = prev.items.find((n) => n.id === id);
      if (target?.read) return;

      const nextUnread = Math.max(0, prev.unreadCount - (target && !target.read ? 1 : target ? 0 : 1));
      setState((s) => ({
        ...s,
        items: s.items.map((n) =>
          n.id === id ? {...n, read: true, readAt: new Date().toISOString()} : n,
        ),
        unreadCount: nextUnread,
      }));
      selfBroadcast.current = true;
      postNotificationsBroadcast({
        kind: "read",
        id,
        unreadCount: nextUnread,
        at: Date.now(),
      });
      queueMicrotask(() => {
        selfBroadcast.current = false;
      });

      try {
        await notificationApi.markAsRead(id);
      } catch (err) {
        setState(prev);
        toast.error("No pudimos actualizar el aviso. Intenta de nuevo.");
        void err;
      }
    },
    [toast],
  );

  const markUnread = useCallback(
    async (id: number) => {
      const prev = stateRef.current;
      const target = prev.items.find((n) => n.id === id);
      if (target && !target.read) return;

      const nextUnread = prev.unreadCount + 1;
      setState((s) => ({
        ...s,
        items: s.items.map((n) =>
          n.id === id ? {...n, read: false, readAt: null} : n,
        ),
        unreadCount: nextUnread,
      }));
      selfBroadcast.current = true;
      postNotificationsBroadcast({
        kind: "unread-one",
        id,
        unreadCount: nextUnread,
        at: Date.now(),
      });
      queueMicrotask(() => {
        selfBroadcast.current = false;
      });

      try {
        await notificationApi.markAsUnread(id);
      } catch (err) {
        setState(prev);
        toast.error("No pudimos actualizar el aviso. Intenta de nuevo.");
        void err;
      }
    },
    [toast],
  );

  const markAllRead = useCallback(async () => {
    const prev = stateRef.current;
    if (prev.unreadCount === 0) return;

    setState((s) => ({
      ...s,
      items: s.items.map((n) => ({
        ...n,
        read: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    }));
    selfBroadcast.current = true;
    postNotificationsBroadcast({
      kind: "read-all",
      unreadCount: 0,
      at: Date.now(),
    });
    queueMicrotask(() => {
      selfBroadcast.current = false;
    });

    try {
      await notificationApi.markAllAsRead();
      toast.success("Todos los avisos marcados como leídos");
    } catch (err) {
      setState(prev);
      toast.error("No pudimos actualizar el aviso. Intenta de nuevo.");
      void err;
    }
  }, [toast]);

  const remove = useCallback(
    async (id: number) => {
      const prev = stateRef.current;
      const target = prev.items.find((n) => n.id === id);
      if (!target) return;
      const nextUnread = target.read
        ? prev.unreadCount
        : Math.max(0, prev.unreadCount - 1);

      setState((s) => ({
        ...s,
        items: s.items.filter((n) => n.id !== id),
        unreadCount: nextUnread,
      }));
      selfBroadcast.current = true;
      postNotificationsBroadcast({
        kind: "remove",
        id,
        unreadCount: nextUnread,
        at: Date.now(),
      });
      queueMicrotask(() => {
        selfBroadcast.current = false;
      });

      try {
        await notificationApi.deleteNotification(id);
      } catch (err) {
        setState(prev);
        toast.error("No pudimos actualizar el aviso. Intenta de nuevo.");
        void err;
      }
    },
    [toast],
  );

  /* Poll unread count while visible. */
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let timer: number | null = null;

    const clear = () => {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      clear();
      timer = window.setTimeout(async () => {
        if (cancelled) return;
        if (document.visibilityState === "visible") {
          await refreshCount();
        }
        if (!cancelled) schedule();
      }, jittered(backoffRef.current));
    };

    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refreshCount();
        schedule();
      } else {
        clear();
      }
    };

    const onOnline = () => {
      void refreshCount();
      schedule();
    };

    void refreshCount();
    schedule();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      clear();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      statsAbort.current?.abort();
      listAbort.current?.abort();
    };
  }, [isAuthenticated, refreshCount]);

  /* Cross-tab sync. */
  useEffect(() => {
    if (!isAuthenticated) return;
    return subscribeNotificationsBroadcast((msg: NotificationsBroadcast) => {
      if (selfBroadcast.current) return;
      setState((s) => {
        switch (msg.kind) {
          case "unread":
            return {...s, unreadCount: msg.unreadCount};
          case "read":
            return {
              ...s,
              unreadCount: msg.unreadCount,
              items: s.items.map((n) =>
                n.id === msg.id
                  ? {...n, read: true, readAt: new Date().toISOString()}
                  : n,
              ),
            };
          case "unread-one":
            return {
              ...s,
              unreadCount: msg.unreadCount,
              items: s.items.map((n) =>
                n.id === msg.id ? {...n, read: false, readAt: null} : n,
              ),
            };
          case "read-all":
            return {
              ...s,
              unreadCount: 0,
              items: s.items.map((n) => ({
                ...n,
                read: true,
                readAt: n.readAt || new Date().toISOString(),
              })),
            };
          case "remove":
            return {
              ...s,
              unreadCount: msg.unreadCount,
              items: s.items.filter((n) => n.id !== msg.id),
            };
          case "refresh":
            return s;
          default:
            return s;
        }
      });
      if (msg.kind === "refresh") void refreshCount();
    });
  }, [isAuthenticated, refreshCount]);

  const filteredItems = useMemo(() => {
    if (tab === "unread") return state.items.filter((n) => !n.read);
    return state.items;
  }, [state.items, tab]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      ...state,
      tab,
      setTab,
      refresh,
      refreshCount,
      loadMore,
      openList,
      markRead,
      markUnread,
      markAllRead,
      remove,
      filteredItems,
    }),
    [
      state,
      tab,
      refresh,
      refreshCount,
      loadMore,
      openList,
      markRead,
      markUnread,
      markAllRead,
      remove,
      filteredItems,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}

/** Safe for chrome that may render outside the provider briefly. */
export function useNotificationsOptional(): NotificationsContextValue | null {
  return useContext(NotificationsContext);
}
