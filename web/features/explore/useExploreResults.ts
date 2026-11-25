"use client";

/**
 * Explorar fetch + URL sync.
 * Sort reorders loaded results only (no refetch).
 * Location mode: none | nearby | mapArea (see locationMode.ts).
 * Request lifecycle: loading (first/empty) | refetching (keep dimmed) | paging.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {
  SEARCH_MIN_CHARS,
  normalizeQuery,
} from "@/components/shell/SearchBar";
import {useLocationFilter} from "@/components/shell/useLocationFilter";
import type {ExploreResult} from "@/components/explore/ResultCard";
import {useToast} from "@/components/ui/Toast";
import {providerApi, errorUtils} from "@/lib/api";
import {
  EXPLORE_PAGE_SIZE,
  EXPLORE_SUBCATEGORY_FILTER,
  type ExploreProfileType,
  type ExploreSortKey,
  type ExploreView,
} from "./constants";
import {
  encodeZonaParam,
  geoFetchParams,
  locationModeFromUrl,
  type LocationMode,
  type MapArea,
  clampRadiusKm,
} from "./locationMode";
import {
  clearExploreMapMemory,
  filterSignature,
  readExploreMapMemory,
} from "./exploreMapMemory";

function parseList(param: string | null): string[] {
  if (!param?.trim()) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

function catsOf(r: ExploreResult): string[] {
  const raw = r.category;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}

function sortRows(rows: ExploreResult[], sort: ExploreSortKey): ExploreResult[] {
  if (sort === "rating") {
    return [...rows].sort(
      (a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0),
    );
  }
  if (sort === "distance") {
    return [...rows].sort(
      (a, b) =>
        Number(a.distance_km ?? a.distance ?? Infinity) -
        Number(b.distance_km ?? b.distance ?? Infinity),
    );
  }
  return rows;
}

export type FilterSnapshot = {
  categories: string[];
  subcategories: string[];
  profileType: ExploreProfileType;
  sort: ExploreSortKey;
  mode: LocationMode;
  mapArea: MapArea | null;
  nearby: boolean;
};

/** @deprecated use LocationMode / mapArea */
export type MapOverride = {
  coords: {lat: number; lng: number};
  radiusKm: number;
} | null;

export function useExploreResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loc = useLocationFilter();
  const toast = useToast();

  const urlQ = normalizeQuery(searchParams.get("q") || "");
  const exploreQ = urlQ.length >= SEARCH_MIN_CHARS ? urlQ : "";

  const initialZona = locationModeFromUrl({
    nearby: searchParams.get("nearby") === "1",
    zona: searchParams.get("zona"),
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const multi = parseList(searchParams.get("categories"));
    if (multi.length) return multi;
    const one = searchParams.get("category");
    return one ? [one] : [];
  });
  const [subcategories, setSubcategories] = useState<string[]>(() =>
    parseList(searchParams.get("sub")),
  );
  const [profileType, setProfileType] = useState<ExploreProfileType>(
    () => (searchParams.get("type") as ExploreProfileType) || "",
  );
  const [sort, setSortState] = useState<ExploreSortKey>(
    () => (searchParams.get("sort") as ExploreSortKey) || "relevance",
  );
  /* Default mapa — view=lista is legacy and no longer hides the map. */
  const [view, setView] = useState<ExploreView>("mapa");
  const [locationMode, setLocationMode] = useState<LocationMode>(
    initialZona.mode,
  );
  const [mapArea, setMapArea] = useState<MapArea | null>(initialZona.mapArea);
  const [modeNotice, setModeNotice] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<ExploreResult[]>([]);
  const [unsortedProfiles, setUnsortedProfiles] = useState<ExploreResult[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsGeneration, setResultsGeneration] = useState(0);
  const [userMovedMap, setUserMovedMap] = useState(false);
  const [listScrollResetToken, setListScrollResetToken] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const urlTimer = useRef<number | null>(null);
  const radiusTimer = useRef<number | null>(null);
  const liveCountTimer = useRef<number | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const undoSnap = useRef<FilterSnapshot | null>(null);
  const hydratedFromUrl = useRef(false);
  const skipNextNearbyFetch = useRef(false);

  const [liveCount, setLiveCount] = useState("");
  const [restoredScrollTop, setRestoredScrollTop] = useState<number | null>(
    null,
  );
  const [restoredSelectedId, setRestoredSelectedId] = useState<number | null>(
    null,
  );

  // URL → state (back/forward)
  useEffect(() => {
    const multi = parseList(searchParams.get("categories"));
    const one = searchParams.get("category");
    setCategories(multi.length ? multi : one ? [one] : []);
    setSubcategories(parseList(searchParams.get("sub")));
    setProfileType((searchParams.get("type") as ExploreProfileType) || "");
    setSortState((searchParams.get("sort") as ExploreSortKey) || "relevance");
    /* Legacy view=lista is accepted in the URL but normalized to mapa. */
    setView("mapa");

    const parsed = locationModeFromUrl({
      nearby: searchParams.get("nearby") === "1",
      zona: searchParams.get("zona"),
    });
    setLocationMode(parsed.mode);
    setMapArea(parsed.mapArea);
    if (parsed.mode === "nearby") {
      loc.setNearby(true);
    } else if (parsed.mode === "mapArea") {
      loc.setNearby(false);
    } else if (hydratedFromUrl.current) {
      loc.setNearby(false);
    }
    hydratedFromUrl.current = true;
  }, [searchParams, loc.setNearby]);

  const syncUrl = useCallback(
    (
      patch?: {
        q?: string;
        categories?: string[];
        sub?: string[];
        type?: ExploreProfileType;
        sort?: ExploreSortKey;
        nearby?: boolean;
        view?: ExploreView;
        zona?: MapArea | null;
        mode?: LocationMode;
      },
      opts?: {history?: "replace" | "push"; debounceMs?: number},
    ) => {
      const history = opts?.history ?? "replace";
      const debounceMs = opts?.debounceMs ?? 150;
      const apply = () => {
        const params = new URLSearchParams();
        const q =
          patch && "q" in patch
            ? normalizeQuery(patch.q || "")
            : normalizeQuery(searchParams.get("q") || "");
        const cats = patch?.categories ?? categories;
        const subs = patch?.sub ?? subcategories;
        const type = patch?.type ?? profileType;
        const s = patch?.sort ?? sort;
        const v = patch?.view ?? view;
        const mode = patch?.mode ?? locationMode;
        const area =
          patch && "zona" in patch ? patch.zona ?? null : mapArea;
        const near =
          patch && "nearby" in patch
            ? Boolean(patch.nearby)
            : mode === "nearby";

        if (q) params.set("q", q);
        if (cats.length === 1) params.set("category", cats[0]);
        if (cats.length > 1) params.set("categories", cats.join(","));
        if (subs.length) params.set("sub", subs.join(","));
        if (type) params.set("type", type);
        if (s && s !== "relevance") params.set("sort", s);
        if (v === "mapa") params.set("view", "mapa");

        if (mode === "mapArea" && area) {
          params.set("zona", encodeZonaParam(area));
        } else if (mode === "nearby" || near) {
          params.set("nearby", "1");
        }

        const qs = params.toString();
        const next = qs ? `/explore?${qs}` : "/explore";
        const cur = `${window.location.pathname}${window.location.search}`;
        if (cur === next) return;
        if (history === "push") router.push(next, {scroll: false});
        else router.replace(next, {scroll: false});
      };

      if (urlTimer.current) window.clearTimeout(urlTimer.current);
      urlTimer.current = window.setTimeout(apply, debounceMs);
    },
    [
      searchParams,
      categories,
      subcategories,
      profileType,
      sort,
      view,
      locationMode,
      mapArea,
      router,
    ],
  );

  useEffect(() => {
    syncUrl();
    return () => {
      if (urlTimer.current) window.clearTimeout(urlTimer.current);
    };
  }, [categories, subcategories, profileType, sort, locationMode, mapArea, view]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (locationMode === "nearby" && !loc.coords) loc.requestGeolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationMode]);

  const flashNotice = useCallback((msg: string) => {
    setModeNotice(msg);
    setLiveMessage(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setModeNotice(null), 3200);
  }, []);

  const enableNearby = useCallback(() => {
    if (locationMode === "mapArea") {
      flashNotice("Se desactivó la zona del mapa. Cerca de mí activado.");
    }
    setMapArea(null);
    setLocationMode("nearby");
    loc.setNearby(true);
    if (!loc.coords) loc.requestGps();
    setUserMovedMap(false);
    syncUrl({mode: "nearby", nearby: true, zona: null});
    setLiveMessage("Ubicación activada");
  }, [locationMode, loc, flashNotice, syncUrl]);

  const disableNearby = useCallback(() => {
    setLocationMode("none");
    loc.setNearby(false);
    syncUrl({mode: "none", nearby: false, zona: null});
    setLiveMessage("Ubicación desactivada");
  }, [loc, syncUrl]);

  const applyMapArea = useCallback(
    (center: {lat: number; lng: number}, radiusKm: number) => {
      if (locationMode === "nearby") {
        flashNotice("Se desactivó Cerca de mí. Zona del mapa activa.");
      }
      const area: MapArea = {
        lat: center.lat,
        lng: center.lng,
        radiusKm: clampRadiusKm(radiusKm),
      };
      loc.setNearby(false);
      setLocationMode("mapArea");
      setMapArea(area);
      setUserMovedMap(false);
      syncUrl({mode: "mapArea", zona: area, nearby: false});
      setLiveMessage("Zona del mapa aplicada");
    },
    [locationMode, loc, flashNotice, syncUrl],
  );

  const clearMapArea = useCallback(() => {
    setMapArea(null);
    setLocationMode("none");
    syncUrl({mode: "none", zona: null, nearby: false});
  }, [syncUrl]);

  const setRadiusDebounced = useCallback(
    (r: 1 | 5 | 10 | 25) => {
      if (radiusTimer.current) window.clearTimeout(radiusTimer.current);
      radiusTimer.current = window.setTimeout(() => {
        loc.setRadiusKm(r);
      }, 250);
    },
    [loc],
  );

  const setSort = useCallback(
    (s: ExploreSortKey) => {
      setSortState(s);
      setProfiles(sortRows(unsortedProfiles, s));
      syncUrl({sort: s});
    },
    [unsortedProfiles, syncUrl],
  );

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const reqId = ++requestIdRef.current;

      if (append) setLoadingMore(true);
      else if (profiles.length === 0) {
        setLoading(true);
        setError(null);
      } else {
        setRefetching(true);
        setError(null);
      }

      try {
        const apiCategory = categories.length === 1 ? categories[0] : undefined;
        const geo = geoFetchParams({
          mode: locationMode,
          mapArea,
          nearbyCoords: loc.coords,
          radiusKm: loc.radiusKm,
        });

        const res = await providerApi.getPublicProfiles({
          search: exploreQ || loc.city.trim() || undefined,
          city: loc.city.trim() || undefined,
          category: apiCategory,
          profile_type: profileType || undefined,
          page: pageNum,
          page_size: EXPLORE_PAGE_SIZE,
          ...geo,
        });

        if (ac.signal.aborted || reqId !== requestIdRef.current) return;

        let rows = (res.data.results || []) as ExploreResult[];

        if (categories.length > 1) {
          rows = rows.filter((r) => {
            const c = catsOf(r);
            return categories.some((id) => c.includes(id));
          });
        }
        if (EXPLORE_SUBCATEGORY_FILTER && subcategories.length > 0) {
          rows = rows.filter((r) => {
            const subs = r.sub_categories || [];
            if (!subs.length) return true;
            return subcategories.some((s) => subs.includes(s));
          });
        }

        setUnsortedProfiles((prev) => {
          const nextUnsorted = append ? [...prev, ...rows] : rows;
          setProfiles(sortRows(nextUnsorted, sort));
          setTotalCount(Number(res.data.count) || nextUnsorted.length);
          return nextUnsorted;
        });
        setHasMore(Boolean(res.data.next));
        setPage(pageNum);
        if (!append) {
          setResultsGeneration((g) => g + 1);
          setUserMovedMap(false);
          setListScrollResetToken((t) => t + 1);
        }
      } catch (err) {
        if (ac.signal.aborted || reqId !== requestIdRef.current) return;
        const msg = errorUtils.getErrorMessage(err);
        if (append) toast.error(msg);
        else {
          setError(msg);
          setProfiles((prev) => {
            if (prev.length === 0) {
              setUnsortedProfiles([]);
              return [];
            }
            return prev;
          });
        }
      } finally {
        if (!ac.signal.aborted && reqId === requestIdRef.current) {
          setLoading(false);
          setRefetching(false);
          setLoadingMore(false);
        }
      }
    },
    [
      categories,
      subcategories,
      exploreQ,
      loc.city,
      loc.coords,
      loc.radiusKm,
      profileType,
      locationMode,
      mapArea,
      sort,
      toast,
    ],
  );

  // Fetch on filter changes — NOT on sort
  useEffect(() => {
    if (skipNextNearbyFetch.current) {
      skipNextNearbyFetch.current = false;
      return;
    }
    void fetchPage(1, false);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    exploreQ,
    categories,
    subcategories,
    profileType,
    locationMode,
    mapArea,
    loc.coords,
    loc.radiusKm,
    loc.city,
  ]);

  // Restore map memory once after first filter signature
  useEffect(() => {
    const sig = filterSignature({
      q: exploreQ,
      categories,
      type: profileType,
      sort,
      mode: locationMode,
      zona: mapArea ? encodeZonaParam(mapArea) : "",
      nearby: locationMode === "nearby",
      radiusKm: loc.radiusKm,
    });
    const mem = readExploreMapMemory(sig);
    if (mem) {
      /* Legacy view=lista no longer hides the map — normalize to mapa. */
      setView(mem.view === "lista" ? "mapa" : mem.view);
      setRestoredScrollTop(mem.listScrollTop);
      if (mem.selectedId != null) setRestoredSelectedId(mem.selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || refetching || loadingMore) return;
    void fetchPage(page + 1, true);
  }, [hasMore, loading, refetching, loadingMore, page, fetchPage]);

  useEffect(() => {
    if (loading || refetching) return;
    if (liveCountTimer.current) window.clearTimeout(liveCountTimer.current);
    liveCountTimer.current = window.setTimeout(() => {
      const n = totalCount || profiles.length;
      setLiveCount(`${n} resultado${n === 1 ? "" : "s"}`);
    }, 500);
    return () => {
      if (liveCountTimer.current) window.clearTimeout(liveCountTimer.current);
    };
  }, [loading, refetching, totalCount, profiles.length]);

  const activeFilterCount =
    (locationMode === "nearby" ? 1 : 0) +
    (locationMode === "mapArea" ? 1 : 0) +
    (profileType ? 1 : 0) +
    categories.length +
    (EXPLORE_SUBCATEGORY_FILTER ? subcategories.length : 0) +
    (urlQ ? 1 : 0) +
    (sort !== "relevance" ? 1 : 0);

  const snapshotFilters = useCallback((): FilterSnapshot => {
    return {
      categories: [...categories],
      subcategories: [...subcategories],
      profileType,
      sort,
      mode: locationMode,
      mapArea,
      nearby: locationMode === "nearby",
    };
  }, [
    categories,
    subcategories,
    profileType,
    sort,
    locationMode,
    mapArea,
  ]);

  const restoreSnapshot = useCallback(
    (snap: FilterSnapshot) => {
      setCategories(snap.categories);
      setSubcategories(snap.subcategories);
      setProfileType(snap.profileType);
      setSortState(snap.sort);
      setLocationMode(snap.mode);
      setMapArea(snap.mapArea);
      loc.setNearby(snap.mode === "nearby");
      syncUrl({
        categories: snap.categories,
        sub: snap.subcategories,
        type: snap.profileType,
        sort: snap.sort,
        mode: snap.mode,
        zona: snap.mapArea,
        nearby: snap.mode === "nearby",
      });
    },
    [loc, syncUrl],
  );

  const clearFilters = useCallback(() => {
    const snap = snapshotFilters();
    undoSnap.current = snap;
    setCategories([]);
    setSubcategories([]);
    setProfileType("");
    setSortState("relevance");
    setLocationMode("none");
    setMapArea(null);
    loc.setNearby(false);
    clearExploreMapMemory();
    // Keep topbar `q` — do not clear search
    syncUrl({
      categories: [],
      sub: [],
      type: "",
      sort: "relevance",
      mode: "none",
      zona: null,
      nearby: false,
    });
    toast.info("Filtros eliminados", {
      duration: 5000,
      action: {
        label: "Deshacer",
        onClick: () => {
          if (undoSnap.current) restoreSnapshot(undoSnap.current);
        },
      },
    });
  }, [snapshotFilters, loc, syncUrl, toast, restoreSnapshot]);

  const expandRadius = useCallback(() => {
    loc.setRadiusKm(25);
    enableNearby();
  }, [loc, enableNearby]);

  const setViewAndSync = useCallback(
    (v: ExploreView) => {
      const next: ExploreView = v === "lista" ? "mapa" : v;
      setView(next);
      syncUrl({view: next});
    },
    [syncUrl],
  );

  const hasLocationForDistance = Boolean(
    (locationMode === "nearby" && loc.coords) ||
      (locationMode === "mapArea" && mapArea),
  );

  const markerResults = useMemo(
    () =>
      profiles.filter((r) => {
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [profiles],
  );

  const mapOverride: MapOverride =
    locationMode === "mapArea" && mapArea
      ? {coords: {lat: mapArea.lat, lng: mapArea.lng}, radiusKm: mapArea.radiusKm}
      : null;

  const currentFilterSignature = filterSignature({
    q: exploreQ,
    categories,
    type: profileType,
    sort,
    mode: locationMode,
    zona: mapArea ? encodeZonaParam(mapArea) : "",
    nearby: locationMode === "nearby",
    radiusKm: loc.radiusKm,
  });

  useEffect(() => {
    return () => {
      if (radiusTimer.current) window.clearTimeout(radiusTimer.current);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  return {
    urlQ,
    exploreQ,
    categories,
    setCategories,
    subcategories,
    setSubcategories,
    profileType,
    setProfileType,
    sort,
    setSort,
    view,
    setView: setViewAndSync,
    loc,
    locationMode,
    mapArea,
    mapOverride,
    modeNotice,
    enableNearby,
    disableNearby,
    applyMapBoundsSearch: applyMapArea,
    clearMapOverride: clearMapArea,
    setRadiusDebounced,
    profiles,
    markerResults,
    page,
    hasMore,
    totalCount,
    loading,
    refetching,
    loadingMore,
    error,
    resultsGeneration,
    userMovedMap,
    setUserMovedMap,
    listScrollResetToken,
    restoredScrollTop,
    clearRestoredScrollTop: () => setRestoredScrollTop(null),
    restoredSelectedId,
    clearRestoredSelectedId: () => setRestoredSelectedId(null),
    liveCount,
    liveMessage,
    activeFilterCount,
    hasLocationForDistance,
    currentFilterSignature,
    fetchPage,
    loadMore,
    clearFilters,
    expandRadius,
    syncUrl,
    retry: () => fetchPage(1, false),
  };
}

export type ExploreResultsApi = ReturnType<typeof useExploreResults>;
