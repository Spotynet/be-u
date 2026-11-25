"use client";

import {useEffect, useRef, useState, type CSSProperties} from "react";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {
  CDMX_CENTER,
  getGoogleMapsBrowserKey,
  loadGoogleMapsScript,
} from "@/lib/googleMapsLoader";
import {writeExploreMapMemory} from "@/features/explore/exploreMapMemory";
import {
  clusterMarkers,
  type ClusterPoint,
} from "./clusterMarkers";
import {
  EXPLORE_MAP_STYLES_DARK,
  EXPLORE_MAP_STYLES_LIGHT,
} from "./exploreMapStyles";
import {HtmlMapOverlay, warnIfMapIdWithStyles} from "./htmlMapOverlays";
import {ExploreSelectionPanel} from "./ExploreSelectionPanel";
import type {ExploreResult} from "./ResultCard";

type Coords = {lat: number; lng: number};

type Props = {
  results: ExploreResult[];
  selectedId?: number | null;
  hoveredId?: number | null;
  userCoords?: Coords | null;
  resultsGeneration?: number;
  loading?: boolean;
  refetching?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** cooperative in desktop split; greedy in full-height map */
  gestureMode?: "cooperative" | "greedy";
  userMovedMap?: boolean;
  onUserMovedMap?: (moved: boolean) => void;
  filterSignature?: string;
  view?: "lista" | "mapa";
  onSelect: (r: ExploreResult | null) => void;
  onHover?: (id: number | null) => void;
  onBoundsSearch?: (center: Coords, radiusKm: number) => void;
  onMapReady?: (ready: boolean) => void;
  onMapUnavailable?: () => void;
  onRecenter?: () => void;
  locating?: boolean;
  className?: string;
  favorited?: boolean;
  favoriteBusy?: boolean;
  showFavorite?: boolean;
  onToggleFavorite?: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  allowExpand?: boolean;
  dockedPopup?: boolean;
  emptyResults?: boolean;
};

const AUTO_SEARCH_KEY = "nabbi:explore-autosearch:v1";
const MAX_MARKERS = 200;
const PANEL_OFFSET_PX = 180;

/** Resolved product theme (data-theme set by ThemeProvider, including Sistema). */
function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  const attr = root.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  if (root.classList.contains("dark")) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function radiusFromBounds(map: any): number {
  const c = map.getCenter();
  const b = map.getBounds();
  if (!c || !b) return 10;
  const center = {lat: c.lat(), lng: c.lng()};
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  const corners = [
    {lat: ne.lat(), lng: ne.lng()},
    {lat: ne.lat(), lng: sw.lng()},
    {lat: sw.lat(), lng: ne.lng()},
    {lat: sw.lat(), lng: sw.lng()},
  ];
  const max = Math.max(...corners.map((p: Coords) => haversineKm(center, p)));
  return Math.min(50, Math.max(1, max));
}

function pinHtml(opts: {selected: boolean; hovered: boolean; photo?: string | null; initial?: string}) {
  const state = opts.selected
    ? "nabbi-explore-pin is-selected"
    : opts.hovered
      ? "nabbi-explore-pin is-hovered"
      : "nabbi-explore-pin";
  const inner = opts.photo
    ? `<img src="${opts.photo.replace(/"/g, "")}" alt="" class="nabbi-explore-pin__img" />`
    : `<span class="nabbi-explore-pin__fallback">${opts.initial || "·"}</span>`;
  return {className: state, html: `<span class="nabbi-explore-pin__halo" aria-hidden></span><span class="nabbi-explore-pin__core">${inner}</span>`};
}

function clusterHtml(count: number) {
  return {
    className: "nabbi-explore-cluster",
    html: `<span class="nabbi-explore-cluster__halo" aria-hidden></span><span class="nabbi-explore-cluster__core"><span class="nabbi-explore-cluster__count">${count}</span></span>`,
  };
}

function userHtml() {
  const pulse = prefersReducedMotion() ? " is-static" : "";
  return {
    className: `nabbi-explore-user${pulse}`,
    html: `<span class="nabbi-explore-user__halo" aria-hidden></span><span class="nabbi-explore-user__core"></span>`,
  };
}

function readAutoSearch(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(AUTO_SEARCH_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAutoSearch(v: boolean) {
  try {
    sessionStorage.setItem(AUTO_SEARCH_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function ExploreMap({
  results,
  selectedId,
  hoveredId,
  userCoords,
  resultsGeneration = 0,
  loading = false,
  refetching = false,
  error = null,
  onRetry,
  gestureMode = "cooperative",
  userMovedMap = false,
  onUserMovedMap,
  filterSignature = "",
  view = "lista",
  onSelect,
  onHover,
  onBoundsSearch,
  onMapReady,
  onMapUnavailable,
  onRecenter,
  locating = false,
  className = "",
  favorited,
  favoriteBusy,
  showFavorite,
  onToggleFavorite,
  expanded = false,
  onExpandedChange,
  allowExpand = true,
  dockedPopup = false,
  emptyResults = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Map<number, HtmlMapOverlay>>(new Map());
  const clustersRef = useRef<Map<string, HtmlMapOverlay>>(new Map());
  const userMarkerRef = useRef<HtmlMapOverlay | null>(null);
  const mapsApi = useRef<any>(null);
  const fittedGen = useRef<number>(-1);
  const idleTimer = useRef<number | null>(null);
  const autoTimer = useRef<number | null>(null);
  const lastAutoAt = useRef(0);
  const tipTimer = useRef<number | null>(null);
  const hintTimer = useRef<number | null>(null);
  const baseline = useRef<{lat: number; lng: number; zoom: number} | null>(
    null,
  );
  const listenersRef = useRef<any[]>([]);
  const warnOnce = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [moved, setMoved] = useState(false);
  const [ready, setReady] = useState(false);
  const [gestureHint, setGestureHint] = useState(false);
  const [autoSearch, setAutoSearch] = useState(false);
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    name: string;
    rating: string;
  } | null>(null);
  const [popupPos, setPopupPos] = useState<{x: number; y: number} | null>(null);
  const [zoom, setZoom] = useState(12);
  const [themeEpoch, setThemeEpoch] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const selected = results.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    setAutoSearch(readAutoSearch());
  }, []);

  useEffect(() => {
    const key = getGoogleMapsBrowserKey();
    if (!key) {
      setMapError("missing-key");
      onMapUnavailable?.();
      if (process.env.NODE_ENV === "development" && !warnOnce.current) {
        warnOnce.current = true;
        console.warn(
          "[explore] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing — map shows config error.",
        );
      }
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        setMapError(null);
        const maps = await loadGoogleMapsScript(key);
        if (cancelled || !mapRef.current) return;
        mapsApi.current = maps;
        const center = userCoords || CDMX_CENTER;
        const dark = isDarkTheme();
        if (!mapInstance.current) {
          /* Vector maps ignore JSON styles — force RASTER. Never set mapId. */
          const mapOpts: Record<string, unknown> = {
            center,
            zoom: userCoords ? 13 : 11,
            disableDefaultUI: true,
            gestureHandling: gestureMode,
            keyboardShortcuts: true,
            styles: dark ? EXPLORE_MAP_STYLES_DARK : EXPLORE_MAP_STYLES_LIGHT,
            clickableIcons: false,
          };
          if (maps.RenderingType?.RASTER) {
            mapOpts.renderingType = maps.RenderingType.RASTER;
          } else {
            mapOpts.renderingType = "RASTER";
          }
          warnIfMapIdWithStyles(mapOpts);
          mapInstance.current = new maps.Map(mapRef.current, mapOpts);
          const map = mapInstance.current;
          /* Re-assert styles after tiles init (some builds drop first paint). */
          map.setOptions({
            styles: dark ? EXPLORE_MAP_STYLES_DARK : EXPLORE_MAP_STYLES_LIGHT,
            clickableIcons: false,
          });
          listenersRef.current.push(
            map.addListener("idle", () => {
              const z = map.getZoom() ?? 12;
              setZoom(z);
              if (idleTimer.current) window.clearTimeout(idleTimer.current);
              idleTimer.current = window.setTimeout(() => {
                const c = map.getCenter();
                if (!c) return;
                if (!baseline.current) {
                  baseline.current = {lat: c.lat(), lng: c.lng(), zoom: z};
                  return;
                }
                const bounds = map.getBounds();
                if (!bounds) return;
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                const spanLat = Math.abs(ne.lat() - sw.lat());
                const spanLng = Math.abs(ne.lng() - sw.lng());
                const dLat = Math.abs(c.lat() - baseline.current.lat);
                const dLng = Math.abs(c.lng() - baseline.current.lng);
                const zoomDelta = Math.abs(z - baseline.current.zoom);
                const meaningful =
                  dLat > spanLat * 0.25 ||
                  dLng > spanLng * 0.25 ||
                  zoomDelta > 1;
                if (meaningful) {
                  setMoved(true);
                  onUserMovedMap?.(true);
                  if (readAutoSearch() && onBoundsSearch) {
                    if (autoTimer.current) window.clearTimeout(autoTimer.current);
                    autoTimer.current = window.setTimeout(() => {
                      if (Date.now() - lastAutoAt.current < 1500) return;
                      lastAutoAt.current = Date.now();
                      const r = radiusFromBounds(map);
                      onBoundsSearch({lat: c.lat(), lng: c.lng()}, r);
                      baseline.current = {
                        lat: c.lat(),
                        lng: c.lng(),
                        zoom: map.getZoom() ?? z,
                      };
                      setMoved(false);
                    }, 600);
                  }
                }
                if (filterSignature) {
                  const scrollRoot = (document.querySelector(
                    ".nabbi-explore-float__panel-body",
                  ) ||
                    document.querySelector(
                      ".nabbi-shell-panel__scroll",
                    )) as HTMLElement | null;
                  writeExploreMapMemory({
                    filterSignature,
                    center: {lat: c.lat(), lng: c.lng()},
                    zoom: map.getZoom() ?? z,
                    selectedId: selectedId ?? null,
                    view,
                    listScrollTop: scrollRoot?.scrollTop ?? 0,
                  });
                }
              }, 400);
            }),
            map.addListener("click", () => {
              onSelect(null);
              setTip(null);
            }),
          );
        }
        setReady(true);
        onMapReady?.(true);
      } catch (err: unknown) {
        if (!cancelled) {
          setMapError(
            err instanceof Error ? err.message : "No se pudo cargar el mapa.",
          );
          /* Keep the map host mounted — do not fall back to list-only. */
          onMapReady?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
      if (tipTimer.current) window.clearTimeout(tipTimer.current);
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
      listenersRef.current.forEach((l) => {
        try {
          l.remove();
        } catch {
          /* ignore */
        }
      });
      listenersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    map.setOptions({gestureHandling: gestureMode});
  }, [gestureMode, ready]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    const apply = () => {
      map.setOptions({
        styles: isDarkTheme()
          ? EXPLORE_MAP_STYLES_DARK
          : EXPLORE_MAP_STYLES_LIGHT,
      });
      setThemeEpoch((n) => n + 1);
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      /* Sistema preference updates data-theme via ThemeProvider; re-read resolved. */
      apply();
    };
    mq.addEventListener("change", onScheme);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", onScheme);
    };
  }, [ready]);

  /* ResizeObserver — preserve center */
  useEffect(() => {
    const el = mapRef.current;
    const map = mapInstance.current;
    const maps = mapsApi.current;
    if (!el || !map || !maps || !ready) return;
    const ro = new ResizeObserver(() => {
      const c = map.getCenter();
      const z = map.getZoom();
      maps.event.trigger(map, "resize");
      if (c) map.setCenter(c);
      if (z != null) map.setZoom(z);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  /* Wheel cooperative hint */
  useEffect(() => {
    const el = mapRef.current;
    if (!el || gestureMode !== "cooperative") return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      setGestureHint(true);
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
      hintTimer.current = window.setTimeout(() => setGestureHint(false), 1200);
    };
    el.addEventListener("wheel", onWheel, {passive: true});
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, [gestureMode, ready]);

  /* Markers + clustering */
  useEffect(() => {
    const maps = mapsApi.current;
    const map = mapInstance.current;
    if (!maps || !map || !ready) return;

    const points: ClusterPoint[] = [];
    for (const r of results) {
      if (points.length >= MAX_MARKERS) break;
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      points.push({
        id: r.id,
        lat,
        lng,
        name: r.name,
        rating: r.rating ?? null,
      });
    }

    const clustered = clusterMarkers(points, zoom);
    const showPoints =
      clustered.type === "points"
        ? clustered.points
        : [...clustered.singles];
    const showClusters =
      clustered.type === "clusters" ? clustered.clusters : [];

    /* clear obsolete clusters */
    const clusterKeys = new Set(showClusters.map((c) => c.key));
    clustersRef.current.forEach((m, key) => {
      if (!clusterKeys.has(key)) {
        m.setMap(null);
        clustersRef.current.delete(key);
      }
    });

    showClusters.forEach((c) => {
      let marker = clustersRef.current.get(c.key);
      const content = clusterHtml(c.count);
      if (!marker) {
        marker = new HtmlMapOverlay({
          maps,
          map,
          position: {lat: c.lat, lng: c.lng},
          className: content.className,
          html: content.html,
          zIndex: 800,
          title: `${c.count} resultados`,
          onClick: () => {
            const bounds = new maps.LatLngBounds(
              {lat: c.bounds.south, lng: c.bounds.west},
              {lat: c.bounds.north, lng: c.bounds.east},
            );
            map.fitBounds(bounds, 48);
          },
        });
        clustersRef.current.set(c.key, marker);
      } else {
        marker.setPosition({lat: c.lat, lng: c.lng});
        marker.setContent(content.html, content.className);
      }
    });

    const keep = new Set(showPoints.map((p) => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!keep.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    showPoints.forEach((p) => {
      const r = results.find((x) => x.id === p.id);
      if (!r) return;
      let marker = markersRef.current.get(p.id);
      const isSel = p.id === selectedId;
      const isHov = p.id === hoveredId;
      const photo = r.images?.[0] || r.user_image || null;
      const initial = (r.name || "?").trim().charAt(0).toUpperCase();
      const content = pinHtml({
        selected: isSel,
        hovered: isHov,
        photo,
        initial,
      });

      if (!marker) {
        marker = new HtmlMapOverlay({
          maps,
          map,
          position: {lat: p.lat, lng: p.lng},
          className: content.className,
          html: content.html,
          zIndex: isSel ? 1000 : isHov ? 900 : 1,
          title: p.name || "Perfil",
          onClick: () => onSelect(r),
          onMouseEnter: () => {
            onHover?.(p.id);
            if (tipTimer.current) window.clearTimeout(tipTimer.current);
            tipTimer.current = window.setTimeout(() => {
              if (window.matchMedia("(hover: hover)").matches === false) return;
              const el = marker?.getElement();
              const root = map.getDiv() as HTMLElement;
              const rect = root.getBoundingClientRect();
              const er = el?.getBoundingClientRect();
              setTip({
                x: er ? er.left + er.width / 2 - rect.left : rect.width / 2,
                y: er ? er.top - rect.top : rect.height / 2,
                name: p.name || "Perfil",
                rating:
                  p.rating != null && !Number.isNaN(Number(p.rating))
                    ? Number(p.rating).toFixed(1)
                    : "",
              });
            }, 150);
          },
          onMouseLeave: () => {
            onHover?.(null);
            if (tipTimer.current) window.clearTimeout(tipTimer.current);
            setTip(null);
          },
        });
        markersRef.current.set(p.id, marker);
      } else {
        marker.setPosition({lat: p.lat, lng: p.lng});
        marker.setContent(content.html, content.className);
        marker.setZIndex(isSel ? 1000 : isHov ? 900 : 1);
      }
    });

    /* Fit bounds rules */
    if (
      resultsGeneration !== fittedGen.current &&
      !userMovedMap
    ) {
      if (results.length === 1) {
        const r = results[0];
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          if (prefersReducedMotion()) {
            map.setCenter({lat, lng});
            map.setZoom(14);
          } else {
            map.panTo({lat, lng});
            map.setZoom(14);
          }
          fittedGen.current = resultsGeneration;
          setMoved(false);
          baseline.current = {lat, lng, zoom: 14};
        }
      } else if (results.length > 0) {
        const bounds = new maps.LatLngBounds();
        let any = false;
        results.forEach((r) => {
          const lat = Number(r.latitude);
          const lng = Number(r.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          bounds.extend({lat, lng});
          any = true;
        });
        if (any) {
          const pad = {top: 48, right: 48, bottom: 48, left: 48 + PANEL_OFFSET_PX / 4};
          map.fitBounds(bounds, pad);
          maps.event.addListenerOnce(map, "idle", () => {
            const z = map.getZoom();
            if (typeof z === "number" && z > 15) map.setZoom(15);
            const c = map.getCenter();
            if (c) {
              baseline.current = {
                lat: c.lat(),
                lng: c.lng(),
                zoom: map.getZoom() ?? 12,
              };
            }
          });
          fittedGen.current = resultsGeneration;
          setMoved(false);
        }
      } else {
        fittedGen.current = resultsGeneration;
      }
    }
  }, [
    results,
    selectedId,
    hoveredId,
    onSelect,
    onHover,
    resultsGeneration,
    ready,
    zoom,
    userMovedMap,
    themeEpoch,
  ]);

  /* User location */
  useEffect(() => {
    const maps = mapsApi.current;
    const map = mapInstance.current;
    if (!maps || !map || !ready) return;
    if (!userCoords) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }
    const content = userHtml();
    if (!userMarkerRef.current) {
      userMarkerRef.current = new HtmlMapOverlay({
        maps,
        map,
        position: userCoords,
        className: content.className,
        html: content.html,
        zIndex: 500,
        title: "Tu ubicación",
      });
    } else {
      userMarkerRef.current.setPosition(userCoords);
      userMarkerRef.current.setContent(content.html, content.className);
    }
  }, [userCoords, ready, themeEpoch]);

  /* Pan selection + popup anchor */
  useEffect(() => {
    const map = mapInstance.current;
    const maps = mapsApi.current;
    if (!selected || !map || !maps) {
      setPopupPos(null);
      return;
    }
    const lat = Number(selected.latitude);
    const lng = Number(selected.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setPopupPos(null);
      return;
    }
    const placePopup = () => {
      const overlay = new maps.OverlayView();
      overlay.onAdd = function onAdd() {};
      overlay.draw = function draw() {};
      overlay.onRemove = function onRemove() {};
      overlay.setMap(map);
      const proj = overlay.getProjection?.();
      const div = map.getDiv() as HTMLElement;
      const rect = div.getBoundingClientRect();
      let x = rect.width / 2;
      let y = rect.height / 2;
      if (proj) {
        const pt = proj.fromLatLngToContainerPixel(new maps.LatLng(lat, lng));
        if (pt) {
          x = pt.x;
          y = pt.y;
        }
      }
      overlay.setMap(null);
      const popupW = 296;
      const popupH = 280;
      const margin = 16;
      const left = Math.min(
        Math.max(margin, x - popupW / 2),
        Math.max(margin, rect.width - popupW - margin),
      );
      const top = Math.min(
        Math.max(margin, y - popupH - 28),
        Math.max(margin, rect.height - popupH - margin),
      );
      setPopupPos({x: left, y: top});
    };

    if (dockedPopup) {
      setPopupPos(null);
      if (prefersReducedMotion()) map.setCenter({lat, lng});
      else map.panTo({lat, lng});
      return;
    }

    if (prefersReducedMotion()) {
      map.setCenter({lat, lng});
      map.panBy(0, -PANEL_OFFSET_PX / 4);
    } else {
      map.panTo({lat, lng});
      map.panBy(0, -PANEL_OFFSET_PX / 4);
    }
    const t = window.setTimeout(placePopup, prefersReducedMotion() ? 0 : 220);
    return () => window.clearTimeout(t);
  }, [selected, dockedPopup, ready, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExpandedChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, onExpandedChange]);

  const searchHere = () => {
    const map = mapInstance.current;
    if (!map || !onBoundsSearch) return;
    const c = map.getCenter();
    if (!c) return;
    const radiusKm = radiusFromBounds(map);
    onBoundsSearch({lat: c.lat(), lng: c.lng()}, radiusKm);
    baseline.current = {
      lat: c.lat(),
      lng: c.lng(),
      zoom: map.getZoom() ?? 12,
    };
    setMoved(false);
    onUserMovedMap?.(false);
  };

  const zoomBy = (delta: number) => {
    const map = mapInstance.current;
    if (!map) return;
    const z = map.getZoom() ?? 12;
    map.setZoom(z + delta);
  };

  if (mapError === "missing-key") {
    return (
      <div
        className="nabbi-explore-map-fallback"
        role="region"
        aria-label="Mapa no disponible">
        <p className="m-0 text-[14px] font-semibold text-foreground">
          El mapa no está configurado
        </p>
        <p className="mb-0 mt-1 text-[13px] text-foreground-secondary">
          Falta la clave pública de Google Maps. El listado sigue disponible.
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className="nabbi-explore-map-fallback"
        role="region"
        aria-label="Error al cargar el mapa">
        <p className="m-0 text-[14px] font-semibold text-foreground">
          No se pudo cargar el mapa
        </p>
        <p className="mb-3 mt-1 text-[13px] text-foreground-secondary">
          {mapError}
        </p>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-full border border-[color:var(--hairline-strong)] bg-card px-4 text-[13px] font-semibold text-foreground"
          onClick={() => {
            setMapError(null);
            setReady(false);
            window.location.reload();
          }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Mapa de resultados"
      className={["nabbi-explore-map relative h-full w-full", className]
        .filter(Boolean)
        .join(" ")}>
      <a href="#explore-listado" className="nabbi-explore-skip-map">
        Saltar al listado
      </a>

      {(refetching || loading) && !mapError ? (
        <div className="nabbi-explore-map-pill" aria-live="polite">
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
            aria-hidden
          />
          Buscando...
        </div>
      ) : null}

      {error ? (
        <div className="nabbi-explore-map-pill nabbi-explore-map-pill--error">
          {error}{" "}
          {onRetry ? (
            <button type="button" className="font-bold underline" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {gestureHint ? (
        <div
          className={
            prefersReducedMotion()
              ? "nabbi-explore-gesture-hint nabbi-explore-gesture-hint--static"
              : "nabbi-explore-gesture-hint"
          }>
          Usa Ctrl + rueda para hacer zoom
        </div>
      ) : null}

      {emptyResults && !loading && !refetching && !error ? (
        <div className="nabbi-explore-map-pill" aria-live="polite">
          Sin resultados en esta zona
        </div>
      ) : null}

      <label className="nabbi-explore-autosearch">
        <span
          className={
            autoSearch
              ? "nabbi-explore-autosearch__box is-checked"
              : "nabbi-explore-autosearch__box"
          }
          aria-hidden>
          {autoSearch ? (
            <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : null}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={autoSearch}
          onChange={(e) => {
            const v = e.target.checked;
            setAutoSearch(v);
            writeAutoSearch(v);
          }}
        />
        {refetching ? "Buscando..." : "Buscar al mover el mapa"}
        {refetching ? (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
            aria-hidden
          />
        ) : null}
      </label>

      {moved && onBoundsSearch && !loading && !refetching && !autoSearch ? (
        <button
          type="button"
          onClick={searchHere}
          className="nabbi-explore-search-here focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
          <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
          Buscar en esta zona
        </button>
      ) : null}

      <div ref={mapRef} className="absolute inset-0 h-full w-full" />

      {tip && !selected ? (
        <div
          className="nabbi-explore-marker-tip"
          style={
            {
              ["--tip-x" as string]: `${tip.x}px`,
              ["--tip-y" as string]: `${tip.y}px`,
            } as CSSProperties
          }>
          <span className="font-semibold">{tip.name}</span>
          {tip.rating ? (
            <span className="text-foreground-secondary"> · {tip.rating}</span>
          ) : null}
        </div>
      ) : null}

      <div
        className="nabbi-explore-map-controls"
        role="group"
        aria-label="Controles del mapa">
        <div className="nabbi-explore-zoom-card">
          <button
            type="button"
            aria-label="Acercar"
            onClick={() => zoomBy(1)}
            className="nabbi-explore-map-ctrl">
            <PlusIcon className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Alejar"
            onClick={() => zoomBy(-1)}
            className="nabbi-explore-map-ctrl">
            <MinusIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {userCoords || onRecenter ? (
          <button
            type="button"
            aria-label="Mi ubicación"
            disabled={locating}
            onClick={() => onRecenter?.()}
            className="nabbi-explore-map-ctrl nabbi-explore-map-ctrl--locate">
            {locating ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <MapPinIcon className="h-5 w-5" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      {allowExpand ? (
        <button
          type="button"
          aria-label={expanded ? "Salir de pantalla completa" : "Pantalla completa"}
          aria-pressed={expanded}
          title={expanded ? "Salir de pantalla completa" : "Pantalla completa"}
          onClick={() => onExpandedChange?.(!expanded)}
          className="nabbi-explore-map-ctrl nabbi-explore-map-ctrl--expand">
          {expanded ? (
            <ArrowsPointingInIcon className="h-5 w-5" aria-hidden />
          ) : (
            <ArrowsPointingOutIcon className="h-5 w-5" aria-hidden />
          )}
        </button>
      ) : null}

      {selected ? (
        <div
          ref={panelRef}
          className="nabbi-explore-selection-anchor"
          style={
            !dockedPopup && popupPos
              ? ({
                  ["--popup-x" as string]: `${popupPos.x}px`,
                  ["--popup-y" as string]: `${popupPos.y}px`,
                } as CSSProperties)
              : undefined
          }>
          <ExploreSelectionPanel
            result={selected}
            variant={dockedPopup ? "docked" : "anchored"}
            onClose={() => onSelect(null)}
            favorited={favorited}
            favoriteBusy={favoriteBusy}
            showFavorite={showFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      ) : null}
    </div>
  );
}
