import {useState, useEffect, useCallback} from "react";
import {favoriteApi, errorUtils} from "@/lib/api";
import {Alert} from "react-native";

export interface Favorite {
  id: number;
  favorite_name: string;
  favorite_type: "PROFESSIONAL" | "PLACE";
  favorite_specialty: string;
  favorite_rating: number;
  content_object_id: number;
  public_profile_id?: number | null;
  created_at: string;
}

function isUnauthorized(err: any): boolean {
  const status = err?.response?.status ?? err?.status;
  return (
    status === 401 ||
    err?.message?.includes("401") ||
    err?.message?.includes("Unauthorized") ||
    err?.message?.includes("Authentication credentials")
  );
}

export type UseFavoritesOptions = {
  onUnauthorized?: () => void;
};

export const useFavorites = (options?: UseFavoritesOptions) => {
  const onUnauthorized = options?.onUnauthorized;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total_count: number;
    professionals_count: number;
    places_count: number;
  } | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await favoriteApi.getFavorites();
      setFavorites(response.data.results || []);
    } catch (err: any) {
      const isExpectedForGuest =
        err.status === 404 ||
        err.status === 401 ||
        err.response?.status === 404 ||
        err.response?.status === 401 ||
        err.message?.includes("404") ||
        err.message?.includes("401") ||
        err.message?.includes("Unauthorized") ||
        err.message?.includes("Authentication credentials") ||
        err.message?.includes("not found") ||
        err.message?.includes("Page not found");

      if (isExpectedForGuest) {
        setFavorites([]);
        setError(null);
        setStats({
          total_count: 0,
          professionals_count: 0,
          places_count: 0,
        });
      } else {
        console.error("Error fetching favorites:", err);
        const message = errorUtils.getErrorMessage(err);
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await favoriteApi.getStats();
      setStats(response.data);
    } catch (err: any) {
      const isExpectedForGuest =
        err.status === 404 ||
        err.status === 401 ||
        err.response?.status === 404 ||
        err.response?.status === 401 ||
        err.message?.includes("404") ||
        err.message?.includes("401") ||
        err.message?.includes("Unauthorized") ||
        err.message?.includes("Authentication credentials") ||
        err.message?.includes("not found") ||
        err.message?.includes("Page not found");

      if (isExpectedForGuest) {
        setStats({
          total_count: 0,
          professionals_count: 0,
          places_count: 0,
        });
      } else {
        console.error("Error fetching favorite stats:", err);
      }
    }
  }, []);

  const addFavorite = async (
    contentType: "professionalprofile" | "placeprofile",
    objectId: number
  ) => {
    try {
      const response = await favoriteApi.createFavorite({
        content_type: contentType,
        object_id: objectId,
      });

      Alert.alert("Éxito", "Agregado a favoritos");
      fetchFavorites(); // Refresh list
      fetchStats(); // Refresh stats
      return response.data;
    } catch (err: any) {
      if (isUnauthorized(err)) {
        onUnauthorized?.();
        return;
      }
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const removeFavorite = async (favoriteId: number) => {
    try {
      await favoriteApi.removeFavorite(favoriteId);
      Alert.alert("Éxito", "Eliminado de favoritos");
      fetchFavorites(); // Refresh list
      fetchStats(); // Refresh stats
    } catch (err: any) {
      if (isUnauthorized(err)) {
        onUnauthorized?.();
        return;
      }
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const toggleFavorite = async (
    contentType: "professionalprofile" | "placeprofile",
    objectId: number
  ) => {
    try {
      const response = await favoriteApi.toggleFavorite({
        content_type: contentType,
        object_id: objectId,
      });

      fetchFavorites(); // Refresh list
      fetchStats(); // Refresh stats
      return response.data;
    } catch (err: any) {
      if (isUnauthorized(err)) {
        onUnauthorized?.();
        return;
      }
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const bulkRemoveFavorites = async (favoriteIds: number[]) => {
    try {
      await favoriteApi.bulkRemove(favoriteIds);
      Alert.alert("Éxito", `${favoriteIds.length} favoritos eliminados`);
      fetchFavorites(); // Refresh list
      fetchStats(); // Refresh stats
    } catch (err: any) {
      if (isUnauthorized(err)) {
        onUnauthorized?.();
        return;
      }
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const isFavorited = (contentType: "professionalprofile" | "placeprofile", objectId: number) => {
    return favorites.some(
      (fav) =>
        fav.favorite_type === (contentType === "professionalprofile" ? "PROFESSIONAL" : "PLACE") &&
        fav.content_object_id === objectId
    );
  };

  useEffect(() => {
    fetchFavorites();
    fetchStats();
  }, [fetchFavorites, fetchStats]);

  return {
    favorites,
    isLoading,
    error,
    stats,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    bulkRemoveFavorites,
    isFavorited,
    refreshFavorites: fetchFavorites,
  };
};
