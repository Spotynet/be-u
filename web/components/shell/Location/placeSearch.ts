import {googleMapsApi} from "@/lib/api";
import type {DropdownOption, LoadOptionsFn} from "@/components/ui/dropdown";

export type PlaceOptionValue = string; // place_id or "city:Name"

export const loadPlaceOptions: LoadOptionsFn<PlaceOptionValue> = async ({
  query,
  signal,
}) => {
  const q = query.trim();
  if (q.length < 3) return {options: [], hasMore: false};
  try {
    const res = await googleMapsApi.autocomplete(q);
    if (signal?.aborted) return {options: [], hasMore: false};
    const preds = res.data?.predictions || [];
    const options: DropdownOption<PlaceOptionValue>[] = preds.map((p: {
      place_id: string;
      description: string;
    }) => {
      const parts = (p.description || "").split(",");
      return {
        value: p.place_id,
        label: parts[0]?.trim() || p.description,
        description: parts.slice(1).join(",").trim() || undefined,
        keywords: [p.description],
      };
    });
    return {options, hasMore: false};
  } catch {
    /* Fallback: free-text city option */
    return {
      options: [
        {
          value: `city:${q}`,
          label: q,
          description: "Usar como ciudad",
        },
      ],
      hasMore: false,
    };
  }
};

export async function resolvePlace(
  value: PlaceOptionValue,
): Promise<{label: string; city: string; coords?: {lat: number; lng: number}}> {
  if (value.startsWith("city:")) {
    const city = value.slice(5);
    return {label: city, city};
  }
  try {
    const res = await googleMapsApi.placeDetails(value);
    const data = res.data?.result || res.data || {};
    const address = (data.address || data.formatted_address || "") as string;
    const city = (data.city as string) || "";
    const lat = data.latitude ?? data.geometry?.location?.lat;
    const lng = data.longitude ?? data.geometry?.location?.lng;
    const label = city || address.split(",")[0]?.trim() || address || value;
    const coords =
      typeof lat === "number" && typeof lng === "number"
        ? {lat, lng}
        : undefined;
    return {label, city: city || label, coords};
  } catch {
    return {label: value, city: value};
  }
}
