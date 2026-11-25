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
import {
  useNotificationsOptional,
  type AppNotification,
} from "@/features/notifications";
import {
  errorUtils,
  providerApi,
  reservationApi,
} from "@/lib/api";
import {useRailOptional} from "./RailProvider";

export type UpcomingReservation = {
  id: number;
  date: string;
  time?: string | null;
  serviceTitle: string;
  counterpartName: string;
  status: string;
  href: string;
};

export type SuggestedProfile = {
  id: number;
  name: string;
  href: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
  kind: "professional" | "place";
};

type SectionState<T> = {
  items: T[];
  loading: boolean;
  error: string | null;
};

type SocialCenterValue = {
  upcoming: SectionState<UpcomingReservation>;
  suggestions: SectionState<SuggestedProfile>;
  notifications: AppNotification[];
  notificationsLoading: boolean;
  unreadCount: number;
  refreshUpcoming: () => Promise<void>;
  refreshSuggestions: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const SocialCenterContext = createContext<SocialCenterValue | null>(null);

function mapReservation(raw: Record<string, unknown>): UpcomingReservation | null {
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;
  const date = String(
    raw.date || raw.reservation_date || raw.start_date || "",
  );
  if (!date) return null;
  const service =
    (raw.service as Record<string, unknown> | undefined) ||
    (raw.service_detail as Record<string, unknown> | undefined) ||
    {};
  const serviceTitle = String(
    raw.service_name ||
      raw.service_title ||
      service.name ||
      service.title ||
      "Servicio",
  );
  const counterpartName = String(
    raw.provider_name ||
      raw.public_profile_name ||
      raw.place_name ||
      raw.professional_name ||
      raw.client_name ||
      "—",
  );
  return {
    id,
    date,
    time: (raw.time || raw.start_time || raw.hour || null) as string | null,
    serviceTitle,
    counterpartName,
    status: String(raw.status || "PENDING"),
    href: `/reservation/${id}`,
  };
}

function mapSuggestion(raw: Record<string, unknown>): SuggestedProfile | null {
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;
  const type = String(raw.profile_type || raw.type || "").toUpperCase();
  const kind: "professional" | "place" =
    type === "PLACE" ? "place" : "professional";
  const name = String(
    raw.display_name || raw.name || raw.business_name || "Perfil",
  );
  const cats = raw.categories;
  const catLabel = Array.isArray(cats)
    ? String((cats[0] as {name?: string})?.name || cats[0] || "")
    : String(raw.category || raw.city || "");
  return {
    id,
    name,
    href: `/profile/${id}`,
    avatarUrl: (raw.image || raw.avatar_url || raw.photo || null) as
      | string
      | null,
    subtitle: catLabel || null,
    kind,
  };
}

export function SocialCenterProvider({children}: {children: ReactNode}) {
  const {isAuthenticated} = useAuth();
  const notifications = useNotificationsOptional();
  const rail = useRailOptional();

  const [upcoming, setUpcoming] = useState<SectionState<UpcomingReservation>>({
    items: [],
    loading: false,
    error: null,
  });
  const [suggestions, setSuggestions] = useState<SectionState<SuggestedProfile>>(
    {
      items: [],
      loading: false,
      error: null,
    },
  );

  const upcomingAbort = useRef<AbortController | null>(null);
  const suggestAbort = useRef<AbortController | null>(null);
  /** Stable access — NotificationsProvider value identity changes every update. */
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const refreshUpcoming = useCallback(async () => {
    if (!isAuthenticated) return;
    upcomingAbort.current?.abort();
    const ac = new AbortController();
    upcomingAbort.current = ac;
    setUpcoming((s) => ({...s, loading: true, error: null}));
    try {
      const res = await reservationApi.getMyReservations({filter: "upcoming"});
      if (ac.signal.aborted) return;
      const rows = (res.data?.results || []) as Record<string, unknown>[];
      const items = rows
        .map(mapReservation)
        .filter((x): x is UpcomingReservation => Boolean(x))
        .slice(0, 2);
      setUpcoming({items, loading: false, error: null});
    } catch (err) {
      if (ac.signal.aborted) return;
      setUpcoming({
        items: [],
        loading: false,
        error: errorUtils.getErrorMessage(err),
      });
    }
  }, [isAuthenticated]);

  const refreshSuggestions = useCallback(async () => {
    if (!isAuthenticated) return;
    suggestAbort.current?.abort();
    const ac = new AbortController();
    suggestAbort.current = ac;
    setSuggestions((s) => ({...s, loading: true, error: null}));
    try {
      let rows: Record<string, unknown>[] = [];
      try {
        const rec = await providerApi.getRecommendations({limit: 3});
        const data = rec.data;
        rows = Array.isArray(data)
          ? data
          : data?.results || data?.profiles || [];
      } catch {
        const fallback = await providerApi.getPublicProfiles({
          page: 1,
          page_size: 3,
        });
        rows = (fallback.data?.results || []) as Record<string, unknown>[];
      }
      if (ac.signal.aborted) return;
      const items = rows
        .map(mapSuggestion)
        .filter((x): x is SuggestedProfile => Boolean(x))
        .slice(0, 3);
      setSuggestions({items, loading: false, error: null});
    } catch (err) {
      if (ac.signal.aborted) return;
      setSuggestions({
        items: [],
        loading: false,
        error: errorUtils.getErrorMessage(err),
      });
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async () => {
    await notificationsRef.current?.openList?.();
  }, []);

  const railMode = rail?.mode ?? "hidden";
  const railActive =
    railMode === "open" ||
    railMode === "mini" ||
    railMode === "overlay" ||
    railMode === "drawer";

  /* Fetch once when auth + rail surface becomes active (mode string is stable). */
  useEffect(() => {
    if (!isAuthenticated || !railActive) return;
    void refreshUpcoming();
    void refreshSuggestions();
    void refreshNotifications();
  }, [
    isAuthenticated,
    railMode,
    railActive,
    refreshUpcoming,
    refreshSuggestions,
    refreshNotifications,
  ]);

  /* Poll every 60s while a rail surface is mounted. */
  useEffect(() => {
    if (!isAuthenticated || !railActive) return;
    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === "visible") {
        await refreshNotifications();
        await refreshUpcoming();
      }
      if (!cancelled) {
        timer = window.setTimeout(tick, 60_000);
      }
    };
    timer = window.setTimeout(tick, 60_000);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      upcomingAbort.current?.abort();
      suggestAbort.current?.abort();
    };
  }, [isAuthenticated, railActive, refreshNotifications, refreshUpcoming]);

  const value = useMemo<SocialCenterValue>(
    () => ({
      upcoming,
      suggestions,
      notifications: notifications?.items ?? [],
      notificationsLoading: notifications?.status === "loading",
      unreadCount: notifications?.unreadCount ?? 0,
      refreshUpcoming,
      refreshSuggestions,
      refreshNotifications,
      markRead: async (id) => {
        await notificationsRef.current?.markRead?.(id);
      },
      markAllRead: async () => {
        await notificationsRef.current?.markAllRead?.();
      },
    }),
    [
      upcoming,
      suggestions,
      notifications?.items,
      notifications?.status,
      notifications?.unreadCount,
      refreshUpcoming,
      refreshSuggestions,
      refreshNotifications,
    ],
  );

  return (
    <SocialCenterContext.Provider value={value}>
      {children}
    </SocialCenterContext.Provider>
  );
}

export function useSocialCenter(): SocialCenterValue {
  const ctx = useContext(SocialCenterContext);
  if (!ctx) {
    throw new Error("useSocialCenter must be used within SocialCenterProvider");
  }
  return ctx;
}

export function useSocialCenterOptional(): SocialCenterValue | null {
  return useContext(SocialCenterContext);
}
