/**
 * Device-only presentational preferences (SSR-safe).
 * Namespace: nabbi.client-prefs.v1
 */

export type ClientPreferences = {
  /** Force-disable motion app-wide via html[data-reduce-motion]. */
  reduceMotion?: boolean;
};

const STORAGE_KEY = "nabbi.client-prefs.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readClientPreferences(): ClientPreferences {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ClientPreferences;
    return {
      reduceMotion: Boolean(parsed.reduceMotion),
    };
  } catch {
    return {};
  }
}

export function writeClientPreferences(patch: Partial<ClientPreferences>): ClientPreferences {
  const next = {...readClientPreferences(), ...patch};
  if (canUseStorage()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  }
  applyClientPreferences(next);
  return next;
}

/** Apply to documentElement. Safe no-op on SSR. */
export function applyClientPreferences(prefs: ClientPreferences = readClientPreferences()): void {
  if (typeof document === "undefined") return;
  if (prefs.reduceMotion) {
    document.documentElement.setAttribute("data-reduce-motion", "1");
  } else {
    document.documentElement.removeAttribute("data-reduce-motion");
  }
}
