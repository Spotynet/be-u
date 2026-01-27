import * as Location from "expo-location";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;

export type LocationPoint = {
  latitude: number;
  longitude: number;
  address?: string;
};

type AutocompletePrediction = {
  place_id: string;
  description: string;
};

function ensureApiKey() {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");
  }
}

export async function getCurrentLocation(): Promise<LocationPoint | null> {
  const {status} = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return null;
  }

  const position = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.High});
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export async function geocodeAddress(address: string): Promise<LocationPoint | null> {
  ensureApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${GOOGLE_MAPS_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const result = data.results?.[0];
  if (!result?.geometry?.location) return null;
  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    address: result.formatted_address,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  ensureApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const result = data.results?.[0];
  return result?.formatted_address ?? null;
}

export async function searchPlaceAutocomplete(query: string): Promise<AutocompletePrediction[]> {
  if (!query || query.length < 3) return [];
  ensureApiKey();
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    query
  )}&key=${GOOGLE_MAPS_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return (data.predictions || []).map((p: any) => ({
    place_id: p.place_id,
    description: p.description,
  }));
}

export async function getPlaceDetails(placeId: string): Promise<LocationPoint | null> {
  ensureApiKey();
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const location = data.result?.geometry?.location;
  if (!location) return null;
  return {
    latitude: location.lat,
    longitude: location.lng,
    address: data.result?.formatted_address,
  };
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
}
