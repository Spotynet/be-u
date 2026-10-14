/** Load Google Maps JS SDK once (for explore map). */

const SCRIPT_ID = "nabbi-google-maps-js";

export function getGoogleMapsBrowserKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

export function loadGoogleMapsScript(apiKey: string): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps only available in browser"));
  }

  const w = window as any;
  if (w.google?.maps) {
    return Promise.resolve(w.google.maps);
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      const done = () => {
        if (w.google?.maps) resolve(w.google.maps);
        else reject(new Error("Failed to load Google Maps"));
      };
      existing.addEventListener("load", done);
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      if (w.google?.maps) resolve(w.google.maps);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.onload = () => resolve((window as any).google.maps);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

/** Default map center — CDMX (same as mobile map fallback). */
export const CDMX_CENTER = {lat: 19.4326, lng: -99.1332};
