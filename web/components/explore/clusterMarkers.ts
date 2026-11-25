/**
 * Lightweight grid clustering for ExploreMap (no packages).
 * When marker count > 60 and zoom < 13, group into ~cellPx projected cells.
 * Returns either cluster bubbles or unclustered points.
 */

export type ClusterPoint = {
  id: number;
  lat: number;
  lng: number;
  name?: string;
  rating?: number | null;
};

export type ClusterBubble = {
  key: string;
  lat: number;
  lng: number;
  count: number;
  memberIds: number[];
  bounds: {north: number; south: number; east: number; west: number};
};

export type ClusterResult =
  | {type: "points"; points: ClusterPoint[]}
  | {type: "clusters"; clusters: ClusterBubble[]; singles: ClusterPoint[]};

const CLUSTER_MIN_COUNT = 60;
const CLUSTER_MAX_ZOOM = 13;
const DEFAULT_CELL_PX = 64;

/** Web Mercator-ish projection helpers for cell keys (relative, not absolute meters). */
function project(lat: number, lng: number, zoom: number): {x: number; y: number} {
  const scale = 256 * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return {x, y};
}

export function clusterMarkers(
  points: ClusterPoint[],
  zoom: number,
  opts?: {cellPx?: number; minCount?: number; maxZoom?: number},
): ClusterResult {
  const cellPx = opts?.cellPx ?? DEFAULT_CELL_PX;
  const minCount = opts?.minCount ?? CLUSTER_MIN_COUNT;
  const maxZoom = opts?.maxZoom ?? CLUSTER_MAX_ZOOM;

  if (points.length <= minCount || zoom >= maxZoom) {
    return {type: "points", points};
  }

  const cells = new Map<string, ClusterPoint[]>();
  for (const p of points) {
    const {x, y} = project(p.lat, p.lng, zoom);
    const cx = Math.floor(x / cellPx);
    const cy = Math.floor(y / cellPx);
    const key = `${cx}:${cy}`;
    const list = cells.get(key);
    if (list) list.push(p);
    else cells.set(key, [p]);
  }

  const clusters: ClusterBubble[] = [];
  const singles: ClusterPoint[] = [];

  cells.forEach((members, key) => {
    if (members.length === 1) {
      singles.push(members[0]);
      return;
    }
    let lat = 0;
    let lng = 0;
    let north = -Infinity;
    let south = Infinity;
    let east = -Infinity;
    let west = Infinity;
    const memberIds: number[] = [];
    for (const m of members) {
      lat += m.lat;
      lng += m.lng;
      north = Math.max(north, m.lat);
      south = Math.min(south, m.lat);
      east = Math.max(east, m.lng);
      west = Math.min(west, m.lng);
      memberIds.push(m.id);
    }
    const n = members.length;
    clusters.push({
      key,
      lat: lat / n,
      lng: lng / n,
      count: n,
      memberIds,
      bounds: {north, south, east, west},
    });
  });

  return {type: "clusters", clusters, singles};
}

export const CLUSTER_THRESHOLD = CLUSTER_MIN_COUNT;
