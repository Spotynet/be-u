import * as Location from "expo-location";
import {Platform} from "react-native";
import {api} from "./api";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
// Only use backend proxy on web (to avoid CORS), native apps can use direct API
const USE_BACKEND_PROXY = Platform.OS === "web";

export type LocationPoint = {
  latitude: number;
  longitude: number;
  address?: string;
  country?: string;
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
  
  // Use backend proxy on web to avoid CORS issues
  if (USE_BACKEND_PROXY) {
    try {
      const response = await api.get<{predictions: AutocompletePrediction[]}>(
        "/google-maps/places/autocomplete/",
        {params: {input: query}}
      );
      return response.data.predictions || [];
    } catch (error: any) {
      // If 404, backend endpoint not deployed yet - show helpful error
      if (error?.status === 404) {
        console.warn("Backend Google Maps proxy not available. Please deploy backend changes or use native app.");
        return []; // Return empty for web if backend not available
      }
      console.error("Backend autocomplete failed:", error);
      return [];
    }
  }
  
  // Direct API call for native apps (iOS/Android - no CORS issues)
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
  // Use backend proxy on web to avoid CORS issues
  if (USE_BACKEND_PROXY) {
    try {
      const response = await api.get<LocationPoint>(
        "/google-maps/places/details/",
        {params: {place_id: placeId}}
      );
      return response.data;
    } catch (error: any) {
      // If 404, backend endpoint not deployed yet
      if (error?.status === 404) {
        console.warn("Backend Google Maps proxy not available. Please deploy backend changes or use native app.");
        return null;
      }
      console.error("Backend place details failed:", error);
      return null;
    }
  }
  
  // Direct API call for native apps (iOS/Android - no CORS issues)
  ensureApiKey();
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=geometry,formatted_address,address_components&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    
    if (data.status !== "OK") {
      console.error("Places API error:", data.status, data.error_message);
      return null;
    }
    
    const location = data.result?.geometry?.location;
    if (!location) {
      console.warn("No geometry found in place details");
      return null;
    }
    
    // Extract country from address_components
    let country: string | undefined;
    const addressComponents = data.result?.address_components || [];
    for (const component of addressComponents) {
      if (component.types?.includes("country")) {
        country = component.long_name;
        break;
      }
    }
    
    return {
      latitude: location.lat,
      longitude: location.lng,
      address: data.result?.formatted_address,
      country,
    };
  } catch (error) {
    console.error("Failed to fetch place details:", error);
    return null;
  }
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
