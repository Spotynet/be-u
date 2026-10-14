"use client";

import {useCallback, useEffect, useState} from "react";
import {favoriteApi, errorUtils} from "@/lib/api";

export type FavoriteContentType = "professionalprofile" | "placeprofile";

export interface Favorite {
  id: number;
  favorite_name: string;
  favorite_type: "PROFESSIONAL" | "PLACE";
  favorite_specialty?: string;
  favorite_rating?: number;
  content_object_id: number;
  public_profile_id?: number | null;
  created_at?: string;
}

function toFavoriteType(contentType: FavoriteContentType): "PROFESSIONAL" | "PLACE" {
  return contentType === "professionalprofile" ? "PROFESSIONAL" : "PLACE";
}

export function useFavorites(options?: {autoLoad?: boolean}) {
  const autoLoad = options?.autoLoad !== false;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await favoriteApi.getFavorites();
      setFavorites(res.data.results || (Array.isArray(res.data) ? res.data : []));
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      // Guests / empty: treat as empty list
      if (status === 401 || status === 404) {
        setFavorites([]);
        setError(null);
      } else {
        setError(errorUtils.getErrorMessage(err));
        setFavorites([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  /** Match mobile: favorite_type + content_object_id */
  const isFavorited = useCallback(
    (contentType: FavoriteContentType, objectId: number) => {
      const favoriteType = toFavoriteType(contentType);
      return favorites.some(
        (fav) =>
          fav.favorite_type === favoriteType &&
          Number(fav.content_object_id) === Number(objectId)
      );
    },
    [favorites]
  );

  const toggleFavorite = async (contentType: FavoriteContentType, objectId: number) => {
    const res = await favoriteApi.toggleFavorite({
      content_type: contentType,
      object_id: objectId,
    });
    await load();
    return res.data;
  };

  const removeFavorite = async (favoriteId: number) => {
    await favoriteApi.removeFavorite(favoriteId);
    await load();
  };

  return {favorites, loading, error, load, isFavorited, toggleFavorite, removeFavorite};
}
