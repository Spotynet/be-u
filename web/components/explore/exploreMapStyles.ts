/**
 * Google Maps style JSON — documented hex exception (Maps API requires literals).
 * Apply ONLY with renderingType RASTER (vector maps ignore JSON `styles`).
 * Never set mapId alongside these styles.
 */

export type ExploreMapStyle = {
  elementType?: string;
  featureType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
};

export const EXPLORE_MAP_LIGHT_HEX = {
  land: "#F1EFE8",
  parks: "#E3EADC",
  water: "#D8E5DE",
  road: "#FFFFFF",
  roadStroke: "#E6E3DA",
  roadMajorStroke: "#DAD6CA",
  label: "#6B7570",
  labelMajor: "#4A5450",
  labelHalo: "#F1EFE8",
} as const;

export const EXPLORE_MAP_DARK_HEX = {
  land: "#191B1A",
  parks: "#1A2420",
  water: "#1B2923",
  roadMinor: "#2E3231",
  roadMajor: "#3A3F3D",
  label: "#8E9390",
  labelMajor: "#A9AEAB",
  labelHalo: "#191B1A",
} as const;

/** Shared hide rules — POI icons/labels, transit, road shields, parcels. */
const HIDE_CLUTTER: ExploreMapStyle[] = [
  {featureType: "poi", elementType: "labels", stylers: [{visibility: "off"}]},
  {featureType: "poi", elementType: "labels.icon", stylers: [{visibility: "off"}]},
  {featureType: "poi.business", stylers: [{visibility: "off"}]},
  {featureType: "poi.attraction", stylers: [{visibility: "off"}]},
  {featureType: "poi.medical", stylers: [{visibility: "off"}]},
  {featureType: "poi.school", stylers: [{visibility: "off"}]},
  {featureType: "poi.place_of_worship", stylers: [{visibility: "off"}]},
  {featureType: "poi.sports_complex", stylers: [{visibility: "off"}]},
  {featureType: "poi.government", stylers: [{visibility: "off"}]},
  {featureType: "transit", stylers: [{visibility: "off"}]},
  {featureType: "transit.station", stylers: [{visibility: "off"}]},
  {featureType: "road", elementType: "labels.icon", stylers: [{visibility: "off"}]},
  {
    featureType: "administrative.land_parcel",
    stylers: [{visibility: "off"}],
  },
  {
    featureType: "landscape.man_made",
    elementType: "labels",
    stylers: [{visibility: "off"}],
  },
];

const L = EXPLORE_MAP_LIGHT_HEX;

export const EXPLORE_MAP_STYLES_LIGHT: ExploreMapStyle[] = [
  {elementType: "geometry", stylers: [{color: L.land}]},
  {elementType: "labels.text.fill", stylers: [{color: L.label}]},
  {elementType: "labels.text.stroke", stylers: [{color: L.labelHalo}]},
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{color: L.roadStroke}],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{color: L.labelMajor}],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{color: L.label}],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{color: L.land}],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{color: L.parks}],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{visibility: "off"}],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{color: L.road}],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{color: L.roadStroke}],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{color: L.label}],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{color: L.road}],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{color: L.roadMajorStroke}],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{color: L.labelMajor}],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{color: L.water}],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{color: L.label}],
  },
  ...HIDE_CLUTTER,
];

const D = EXPLORE_MAP_DARK_HEX;

export const EXPLORE_MAP_STYLES_DARK: ExploreMapStyle[] = [
  {elementType: "geometry", stylers: [{color: D.land}]},
  {elementType: "labels.text.fill", stylers: [{color: D.label}]},
  {elementType: "labels.text.stroke", stylers: [{color: D.labelHalo}]},
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{color: D.roadMinor}],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{color: D.labelMajor}],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{color: D.label}],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{color: D.land}],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{color: D.parks}],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{visibility: "off"}],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{color: D.roadMinor}],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{color: D.land}],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{color: D.label}],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{color: D.roadMajor}],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{color: D.land}],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{color: D.labelMajor}],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{color: D.water}],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{color: D.label}],
  },
  ...HIDE_CLUTTER,
];
