"use client";

import {useCallback, useState} from "react";
import {linkApi, type PlaceProfessionalLink, errorUtils} from "@/lib/api";

function normalize(response: any): PlaceProfessionalLink[] {
  if (!response) return [];
  const payload = response.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export function useLinks() {
  const [accepted, setAccepted] = useState<PlaceProfessionalLink[]>([]);
  const [invited, setInvited] = useState<PlaceProfessionalLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (placeId?: number | null) => {
    setLoading(true);
    setError(null);
    try {
      if (placeId) {
        const [a, i] = await Promise.all([
          linkApi.listPlaceLinks(placeId, "ACCEPTED"),
          linkApi.listPlaceLinks(placeId, "INVITED"),
        ]);
        setAccepted(normalize(a));
        setInvited(normalize(i));
      } else {
        const [a, i] = await Promise.all([
          linkApi.listMyLinks({status: "ACCEPTED"}),
          linkApi.listMyLinks({status: "INVITED"}),
        ]);
        setAccepted(normalize(a));
        setInvited(normalize(i));
      }
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {accepted, invited, loading, error, load};
}
