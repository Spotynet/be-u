// Lightweight AWS Location helpers. Works when env vars are provided and @aws-sdk/client-location is installed.
// If the SDK isn't present or env not set, functions fall back to no-op and return empty results.

const REGION = process.env.EXPO_PUBLIC_AWS_REGION as string | undefined;
const PLACE_INDEX = process.env.EXPO_PUBLIC_AWS_PLACE_INDEX as string | undefined;

type Suggestion = {
  label: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  position?: {latitude: number; longitude: number};
};

export async function searchPlaceText(query: string): Promise<Suggestion[]> {
  if (!REGION || !PLACE_INDEX) return [];
  try {
    // Dynamic import to avoid build-time dependency when SDK isn't installed yet
    const {LocationClient, SearchPlaceIndexForTextCommand} = await import(
      "@aws-sdk/client-location"
    );
    const client = new LocationClient({region: REGION});
    const cmd = new SearchPlaceIndexForTextCommand({
      IndexName: PLACE_INDEX,
      Text: query,
      MaxResults: 5,
    });
    const resp: any = await client.send(cmd);
    return (resp.Results || []).map((r: any) => ({
      label: r.Place?.Label,
      address:
        r.Place?.AddressNumber && r.Place?.Street
          ? `${r.Place.AddressNumber} ${r.Place.Street}`
          : r.Place?.Label,
      city: r.Place?.Municipality || r.Place?.Region,
      country: r.Place?.Country,
      postal_code: r.Place?.PostalCode,
      position: r.Place?.Geometry?.Point
        ? {latitude: r.Place.Geometry.Point[1], longitude: r.Place.Geometry.Point[0]}
        : undefined,
    }));
  } catch (e) {
    console.warn("AWS Location search error", e);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<Suggestion | null> {
  if (!REGION || !PLACE_INDEX) return null;
  try {
    const {LocationClient, SearchPlaceIndexForPositionCommand} = await import(
      "@aws-sdk/client-location"
    );
    const client = new LocationClient({region: REGION});
    const cmd = new SearchPlaceIndexForPositionCommand({
      IndexName: PLACE_INDEX,
      Position: [lng, lat],
      MaxResults: 1,
    });
    const resp: any = await client.send(cmd);
    const item = resp.Results?.[0]?.Place;
    if (!item) return null;
    return {
      label: item.Label,
      address:
        item.AddressNumber && item.Street ? `${item.AddressNumber} ${item.Street}` : item.Label,
      city: item.Municipality || item.Region,
      country: item.Country,
      postal_code: item.PostalCode,
      position: {latitude: lat, longitude: lng},
    };
  } catch (e) {
    console.warn("AWS Location reverse error", e);
    return null;
  }
}
