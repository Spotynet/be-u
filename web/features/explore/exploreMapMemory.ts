/**
 * sessionStorage memory for Explorar map (no localStorage, no PII).
 * Key: nabbi:explore-map:v1 — TTL 30 min; invalidated when filter signature differs.
 */

export const EXPLORE_MAP_MEMORY_KEY = "nabbi:explore-map:v1";
const TTL_MS = 30 * 60 * 1000;

export type ExploreMapMemory = {
  savedAt: number;
  filterSignature: string;
  center: {lat: number; lng: number};
  zoom: number;
  selectedId: number | null;
  /** Legacy field; writers always persist "mapa". "lista" is normalized on read. */
  view: "lista" | "mapa";
  listScrollTop: number;
};

/** Normalize legacy list-only preference — map is always part of the layout. */
export function normalizeExploreView(
  view: "lista" | "mapa" | undefined,
): "mapa" {
  void view;
  return "mapa";
}

export function filterSignature(parts: {
  q: string;
  categories: string[];
  type: string;
  sort: string;
  mode: string;
  zona: string;
  nearby: boolean;
  radiusKm: number;
}): string {
  return [
    parts.q,
    parts.categories.slice().sort().join(","),
    parts.type,
    parts.sort,
    parts.mode,
    parts.zona,
    parts.nearby ? "1" : "0",
    String(parts.radiusKm),
  ].join("|");
}

export function readExploreMapMemory(
  signature: string,
): ExploreMapMemory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EXPLORE_MAP_MEMORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExploreMapMemory;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      sessionStorage.removeItem(EXPLORE_MAP_MEMORY_KEY);
      return null;
    }
    if (parsed.filterSignature !== signature) return null;
    return {...parsed, view: normalizeExploreView(parsed.view)};
  } catch {
    return null;
  }
}

export function writeExploreMapMemory(data: Omit<ExploreMapMemory, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: ExploreMapMemory = {
      ...data,
      view: "mapa",
      savedAt: Date.now(),
    };
    sessionStorage.setItem(EXPLORE_MAP_MEMORY_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearExploreMapMemory() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(EXPLORE_MAP_MEMORY_KEY);
  } catch {
    /* ignore */
  }
}
