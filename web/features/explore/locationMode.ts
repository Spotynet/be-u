/**
 * Explorar location mode: none | nearby | mapArea (mutually exclusive).
 *
 * Precedence when deriving fetch coords:
 * 1. mapArea (`zona` URL) → latitude/longitude/radius from zona
 * 2. nearby (`nearby=1` + shell coords) → shell lat/lng/radiusKm
 * 3. none → no geo params
 *
 * Activating nearby clears mapArea (and vice versa).
 */

export type LocationMode = "none" | "nearby" | "mapArea";

export type MapArea = {
  lat: number;
  lng: number;
  radiusKm: number;
};

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

export function clampRadiusKm(n: number): number {
  if (!Number.isFinite(n)) return 10;
  return Math.min(50, Math.max(1, Math.round(n)));
}

export function roundCoord3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Parse `zona=lat,lng,radioKm` — invalid → null. */
export function parseZonaParam(raw: string | null): MapArea | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(",").map((s) => s.trim());
  if (parts.length !== 3) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  const radiusKm = Number(parts[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    return null;
  }
  if (lat < LAT_MIN || lat > LAT_MAX || lng < LNG_MIN || lng > LNG_MAX) {
    return null;
  }
  return {
    lat: roundCoord3(lat),
    lng: roundCoord3(lng),
    radiusKm: clampRadiusKm(radiusKm),
  };
}

export function encodeZonaParam(area: MapArea): string {
  return `${roundCoord3(area.lat)},${roundCoord3(area.lng)},${clampRadiusKm(area.radiusKm)}`;
}

export function locationModeFromUrl(params: {
  nearby: boolean;
  zona: string | null;
}): {mode: LocationMode; mapArea: MapArea | null} {
  const mapArea = parseZonaParam(params.zona);
  if (mapArea) return {mode: "mapArea", mapArea};
  if (params.nearby) return {mode: "nearby", mapArea: null};
  return {mode: "none", mapArea: null};
}

export function geoFetchParams(input: {
  mode: LocationMode;
  mapArea: MapArea | null;
  nearbyCoords: {lat: number; lng: number} | null;
  radiusKm: number;
}): {latitude?: number; longitude?: number; radius?: number} {
  if (input.mode === "mapArea" && input.mapArea) {
    return {
      latitude: input.mapArea.lat,
      longitude: input.mapArea.lng,
      radius: input.mapArea.radiusKm,
    };
  }
  if (input.mode === "nearby" && input.nearbyCoords) {
    return {
      latitude: input.nearbyCoords.lat,
      longitude: input.nearbyCoords.lng,
      radius: clampRadiusKm(input.radiusKm),
    };
  }
  return {};
}
