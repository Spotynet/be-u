"use client";

/**
 * Single source of truth for Topbar LocationPill, drawer LocationRow,
 * and Explorar “Cerca de mí”.
 *
 * Persistence: `nabbi:location:v2:{userId}` — coords rounded to 3 decimals,
 * no accuracy, GPS TTL 24h. SSR-safe (empty until hydrate). Cross-tab via `storage`.
 * Never prompts geolocation on mount — only on user action.
 */

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
import {googleMapsApi} from "@/lib/api";

export type LocationCoords = {lat: number; lng: number; accuracy?: number};
export type LocationSource = "gps" | "manual" | "profile" | "none";
export type PermissionState =
  | "granted"
  | "prompt"
  | "denied"
  | "unsupported"
  | "unknown";
export type LocationStatus = "idle" | "locating" | "ready" | "error";
export type RadiusKm = 1 | 3 | 5 | 10 | 25 | 50;

export const RADIUS_OPTIONS: RadiusKm[] = [1, 3, 5, 10, 25, 50];

export type LocationState = {
  source: LocationSource;
  permission: PermissionState;
  status: LocationStatus;
  coords: LocationCoords | null;
  label: string;
  city: string;
  radiusKm: RadiusKm;
  /** “Cerca de mí” — drives Explorar nearby filter. Alias: `nearby`. */
  enabled: boolean;
  updatedAt: number | null;
  stale: boolean;
  geoError: string | null;
  hydrated: boolean;
  /** Increment to open the shared popover from Explorar / elsewhere. */
  popoverNonce: number;
};

/** @deprecated Prefer LocationState */
export type LocationFilterState = LocationState;

type ManualInput = {label: string; city: string; coords?: LocationCoords | null};

type LocationFilterContextValue = LocationState & {
  /** @deprecated use `enabled` */
  nearby: boolean;
  geoLoading: boolean;
  setNearby: (v: boolean) => void;
  setEnabled: (v: boolean) => void;
  toggleEnabled: () => void;
  setCoords: (c: LocationCoords | null) => void;
  setRadiusKm: (r: RadiusKm) => void;
  setCity: (city: string) => void;
  setGeoError: (msg: string | null) => void;
  requestGeolocation: () => void;
  requestGps: () => void;
  setManual: (input: ManualInput) => void;
  apply: (
    patch: Partial<
      Pick<LocationState, "enabled" | "coords" | "radiusKm" | "city" | "label">
    > & {nearby?: boolean},
  ) => void;
  clearLocation: () => void;
  clear: () => void;
  restoreCleared: () => void;
  hasClearSnapshot: boolean;
  openPopover: () => void;
};

const GPS_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = "nabbi:location:v2:";
const LEGACY_KEY = "nabbi-location-filter";

const DEFAULT: LocationState = {
  source: "none",
  permission: "unknown",
  status: "idle",
  coords: null,
  label: "",
  city: "",
  radiusKm: 5,
  enabled: false,
  updatedAt: null,
  stale: false,
  geoError: null,
  hydrated: false,
  popoverNonce: 0,
};

const LocationFilterContext = createContext<LocationFilterContextValue | null>(
  null,
);

function storageKey(userId?: number | string | null) {
  return `${STORAGE_PREFIX}${userId ?? "guest"}`;
}

function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

function roundCoords(c: LocationCoords): LocationCoords {
  return {lat: roundCoord(c.lat), lng: roundCoord(c.lng)};
}

function normalizeRadius(n: unknown): RadiusKm {
  const v = Number(n);
  return (RADIUS_OPTIONS.includes(v as RadiusKm) ? v : 5) as RadiusKm;
}

type StoredBlob = {
  source?: LocationSource;
  coords?: {lat: number; lng: number} | null;
  label?: string;
  city?: string;
  radiusKm?: number;
  enabled?: boolean;
  nearby?: boolean;
  updatedAt?: number | null;
};

function readStored(userId?: number | string | null): Partial<LocationState> {
  if (typeof window === "undefined") return {};
  try {
    let raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      /* one-time migrate legacy unscoped key */
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        raw = legacy;
        try {
          localStorage.setItem(storageKey(userId), legacy);
          localStorage.removeItem(LEGACY_KEY);
        } catch {
          /* ignore */
        }
      }
    }
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredBlob;
    const coords =
      parsed.coords &&
      typeof parsed.coords.lat === "number" &&
      typeof parsed.coords.lng === "number"
        ? roundCoords(parsed.coords)
        : null;
    const updatedAt =
      typeof parsed.updatedAt === "number" ? parsed.updatedAt : null;
    const source = parsed.source ?? (coords ? "gps" : parsed.city ? "manual" : "none");
    const stale =
      source === "gps" &&
      updatedAt != null &&
      Date.now() - updatedAt > GPS_TTL_MS;
    return {
      source,
      coords,
      label: typeof parsed.label === "string" ? parsed.label : "",
      city: typeof parsed.city === "string" ? parsed.city : "",
      radiusKm: normalizeRadius(parsed.radiusKm),
      enabled: Boolean(parsed.enabled ?? parsed.nearby),
      updatedAt,
      stale,
    };
  } catch {
    return {};
  }
}

function writeStored(userId: number | string | null | undefined, state: LocationState) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredBlob = {
      source: state.source,
      coords: state.coords
        ? {lat: roundCoord(state.coords.lat), lng: roundCoord(state.coords.lng)}
        : null,
      label: state.label,
      city: state.city,
      radiusKm: state.radiusKm,
      enabled: state.enabled,
      updatedAt: state.updatedAt,
    };
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function clearStored(userId?: number | string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}

const reverseCache = new Map<string, string>();

async function reverseLabel(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<{label: string; city: string}> {
  const key = `${roundCoord(lat)},${roundCoord(lng)}`;
  const cached = reverseCache.get(key);
  if (cached) {
    return {label: cached, city: cached.split(",")[0]?.trim() || cached};
  }
  try {
    const res = await googleMapsApi.reverseGeocode(lat, lng);
    if (signal?.aborted) return {label: "Cerca de ti", city: ""};
    const city = (res.data?.city as string) || "";
    const address = (res.data?.address as string) || "";
    const label =
      city ||
      address.split(",").slice(0, 2).join(",").trim() ||
      "Cerca de ti";
    reverseCache.set(key, label);
    return {label, city: city || label};
  } catch {
    return {label: "Cerca de ti", city: ""};
  }
}

function detectPermissionSupport(): PermissionState {
  if (typeof navigator === "undefined") return "unknown";
  if (!navigator.geolocation) return "unsupported";
  if (!window.isSecureContext) return "unsupported";
  return "unknown";
}

export function LocationFilterProvider({children}: {children: ReactNode}) {
  const {user, isAuthenticated} = useAuth();
  const [state, setState] = useState<LocationState>(DEFAULT);
  const clearSnap = useRef<LocationState | null>(null);
  const clearTimer = useRef<number | null>(null);
  const [hasClearSnapshot, setHasClearSnapshot] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const prevAuth = useRef(isAuthenticated);
  const lastUserId = useRef(user?.id);

  /* Hydrate after mount (SSR-safe). */
  useEffect(() => {
    const stored = readStored(user?.id);
    setState((s) => ({
      ...s,
      ...stored,
      permission: detectPermissionSupport(),
      status: stored.coords || stored.city ? "ready" : "idle",
      hydrated: true,
      geoError: null,
    }));
  }, [user?.id]);

  /* Persist */
  useEffect(() => {
    if (!state.hydrated) return;
    writeStored(user?.id, state);
  }, [
    state.hydrated,
    state.source,
    state.coords,
    state.label,
    state.city,
    state.radiusKm,
    state.enabled,
    state.updatedAt,
    user?.id,
  ]);

  /* Cross-tab sync */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(user?.id) || !e.newValue) return;
      try {
        const stored = readStored(user?.id);
        setState((s) => ({
          ...s,
          ...stored,
          status: stored.coords || stored.city ? "ready" : s.status,
        }));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user?.id]);

  /* Permissions API subscribe — never prompts */
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setState((s) => ({
        ...s,
        permission:
          typeof navigator !== "undefined" && navigator.geolocation
            ? "unknown"
            : "unsupported",
      }));
      return;
    }
    let cancelled = false;
    let statusRef: PermissionStatus | null = null;
    let onChange: (() => void) | null = null;

    navigator.permissions
      .query({name: "geolocation" as PermissionName})
      .then((status) => {
        if (cancelled) return;
        statusRef = status;
        const map = (): PermissionState => {
          if (status.state === "granted") return "granted";
          if (status.state === "denied") return "denied";
          if (status.state === "prompt") return "prompt";
          return "unknown";
        };
        setState((s) => ({...s, permission: map()}));
        onChange = () => setState((s) => ({...s, permission: map()}));
        status.addEventListener("change", onChange);
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          permission: navigator.geolocation ? "unknown" : "unsupported",
        }));
      });

    return () => {
      cancelled = true;
      if (statusRef && onChange) {
        statusRef.removeEventListener("change", onChange);
      }
    };
  }, []);

  /* Clear on logout */
  useEffect(() => {
    if (user?.id != null) lastUserId.current = user.id;
    if (prevAuth.current && !isAuthenticated) {
      clearStored(lastUserId.current);
      clearStored("guest");
      setState({...DEFAULT, hydrated: true, permission: detectPermissionSupport()});
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, user?.id]);

  const setEnabled = useCallback((v: boolean) => {
    setState((s) => ({...s, enabled: v, geoError: v ? s.geoError : null}));
  }, []);

  const setNearby = setEnabled;

  const toggleEnabled = useCallback(() => {
    setState((s) => {
      if (!s.enabled && !s.coords && !s.city) {
        return {...s, popoverNonce: s.popoverNonce + 1};
      }
      return {...s, enabled: !s.enabled};
    });
  }, []);

  const setCoords = useCallback((c: LocationCoords | null) => {
    setState((s) => ({
      ...s,
      coords: c ? roundCoords(c) : null,
      status: c || s.city ? "ready" : "idle",
    }));
  }, []);

  const setRadiusKm = useCallback((r: RadiusKm) => {
    setState((s) => ({...s, radiusKm: normalizeRadius(r)}));
  }, []);

  const setCity = useCallback((city: string) => {
    setState((s) => ({
      ...s,
      city,
      label: city || s.label,
      source: city ? (s.source === "gps" ? s.source : "manual") : s.source,
      status: city || s.coords ? "ready" : "idle",
    }));
  }, []);

  const setGeoError = useCallback((msg: string | null) => {
    setState((s) => ({...s, geoError: msg}));
  }, []);

  const requestGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({
        ...s,
        permission: "unsupported",
        status: "error",
        geoError:
          "Tu navegador no permite detectar la ubicación. Elige tu ciudad manualmente.",
        enabled: false,
      }));
      return;
    }
    if (!window.isSecureContext) {
      setState((s) => ({
        ...s,
        permission: "unsupported",
        status: "error",
        geoError:
          "Tu navegador no permite detectar la ubicación. Elige tu ciudad manualmente.",
      }));
      return;
    }

    setState((s) => ({...s, status: "locating", geoError: null}));
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = roundCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        const {label, city} = await reverseLabel(
          coords.lat,
          coords.lng,
          ac.signal,
        );
        if (ac.signal.aborted) return;
        setState((s) => ({
          ...s,
          source: "gps",
          permission: "granted",
          status: "ready",
          coords,
          label,
          city: city || s.city,
          enabled: true,
          updatedAt: Date.now(),
          stale: false,
          geoError: null,
        }));
      },
      (err) => {
        if (ac.signal.aborted) return;
        if (err.code === err.PERMISSION_DENIED) {
          setState((s) => ({
            ...s,
            permission: "denied",
            status: "error",
            enabled: false,
            geoError:
              "El acceso a la ubicación está bloqueado en tu navegador.",
          }));
          return;
        }
        const msg =
          err.code === err.POSITION_UNAVAILABLE
            ? "No pudimos obtener tu ubicación. Inténtalo de nuevo."
            : "Se agotó el tiempo al obtener tu ubicación. Inténtalo de nuevo.";
        setState((s) => ({
          ...s,
          status: "error",
          geoError: msg,
        }));
      },
      {enableHighAccuracy: false, timeout: 8000, maximumAge: 300000},
    );
  }, []);

  const requestGeolocation = requestGps;

  const setManual = useCallback((input: ManualInput) => {
    setState((s) => ({
      ...s,
      source: "manual",
      status: "ready",
      label: input.label,
      city: input.city,
      coords: input.coords ? roundCoords(input.coords) : s.coords,
      enabled: true,
      updatedAt: Date.now(),
      stale: false,
      geoError: null,
    }));
  }, []);

  const apply = useCallback(
    (
      patch: Partial<
        Pick<LocationState, "enabled" | "coords" | "radiusKm" | "city" | "label">
      > & {nearby?: boolean},
    ) => {
      setState((s) => ({
        ...s,
        ...patch,
        enabled: patch.enabled ?? patch.nearby ?? s.enabled,
        radiusKm: patch.radiusKm != null ? normalizeRadius(patch.radiusKm) : s.radiusKm,
        geoError: null,
        status: "ready",
      }));
    },
    [],
  );

  const clear = useCallback(() => {
    setState((s) => {
      clearSnap.current = s;
      setHasClearSnapshot(true);
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => {
        clearSnap.current = null;
        setHasClearSnapshot(false);
      }, 5000);
      return {
        ...s,
        source: "none",
        status: "idle",
        coords: null,
        label: "",
        city: "",
        enabled: false,
        updatedAt: null,
        stale: false,
        geoError: null,
      };
    });
  }, []);

  const clearLocation = clear;

  const restoreCleared = useCallback(() => {
    if (!clearSnap.current) return;
    setState({...clearSnap.current, hydrated: true});
    clearSnap.current = null;
    setHasClearSnapshot(false);
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
  }, []);

  const openPopover = useCallback(() => {
    setState((s) => ({...s, popoverNonce: s.popoverNonce + 1}));
  }, []);

  /* Silent GPS refresh when stale + granted + popover intent handled in popover */
  const refreshIfStale = useCallback(() => {
    setState((s) => {
      if (
        s.stale &&
        s.permission === "granted" &&
        s.source === "gps" &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        queueMicrotask(() => requestGps());
      }
      return s;
    });
  }, [requestGps]);

  useEffect(() => {
    if (!state.hydrated || !state.stale) return;
    if (state.permission !== "granted") return;
    refreshIfStale();
  }, [state.hydrated, state.stale, state.permission, refreshIfStale]);

  const value = useMemo<LocationFilterContextValue>(
    () => ({
      ...state,
      nearby: state.enabled,
      geoLoading: state.status === "locating",
      setNearby,
      setEnabled,
      toggleEnabled,
      setCoords,
      setRadiusKm,
      setCity,
      setGeoError,
      requestGeolocation,
      requestGps,
      setManual,
      apply,
      clearLocation,
      clear,
      restoreCleared,
      hasClearSnapshot,
      openPopover,
    }),
    [
      state,
      setNearby,
      setEnabled,
      toggleEnabled,
      setCoords,
      setRadiusKm,
      setCity,
      setGeoError,
      requestGeolocation,
      requestGps,
      setManual,
      apply,
      clearLocation,
      clear,
      restoreCleared,
      hasClearSnapshot,
      openPopover,
    ],
  );

  return (
    <LocationFilterContext.Provider value={value}>
      {children}
    </LocationFilterContext.Provider>
  );
}

export function useLocationFilter(): LocationFilterContextValue {
  const ctx = useContext(LocationFilterContext);
  if (!ctx) {
    throw new Error("useLocationFilter must be used within LocationFilterProvider");
  }
  return ctx;
}

export function useLocationFilterOptional(): LocationFilterContextValue | null {
  return useContext(LocationFilterContext);
}
