"use client";

import {useCallback, useEffect, useRef, useState} from "react";
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

const CHANNEL = "nabbi-favorites";
const PAGE_SIZE = 24;

function toFavoriteType(
  contentType: FavoriteContentType,
): "PROFESSIONAL" | "PLACE" {
  return contentType === "professionalprofile" ? "PROFESSIONAL" : "PLACE";
}

function toContentType(
  favoriteType: "PROFESSIONAL" | "PLACE",
): FavoriteContentType {
  return favoriteType === "PROFESSIONAL"
    ? "professionalprofile"
    : "placeprofile";
}

function normalizeList(data: unknown): Favorite[] {
  if (Array.isArray(data)) return data as Favorite[];
  if (data && typeof data === "object" && "results" in data) {
    const results = (data as {results?: Favorite[]}).results;
    return Array.isArray(results) ? results : [];
  }
  return [];
}

function broadcastChange() {
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage({type: "changed"});
    bc.close();
  } catch {
    try {
      localStorage.setItem(CHANNEL, String(Date.now()));
    } catch {
      /* ignore */
    }
  }
}

export type UseFavoritesOptions = {
  autoLoad?: boolean;
  /** When true, request paginated pages (page_size). */
  paginated?: boolean;
};

/**
 * Single source of truth for favorites list + toggle.
 * Shared by /favorites, Mi cuenta preview, and profile heart.
 */
export function useFavorites(options?: UseFavoritesOptions) {
  const autoLoad = options?.autoLoad !== false;
  const paginated = options?.paginated === true;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(autoLoad);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  const load = useCallback(
    async (opts?: {append?: boolean}) => {
      const append = opts?.append === true;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        pageRef.current = 1;
      }
      setError(null);
      try {
        const page = append ? pageRef.current + 1 : 1;
        const params = paginated
          ? {page, page_size: PAGE_SIZE}
          : undefined;
        const res = await favoriteApi.getFavorites(params);
        const rows = normalizeList(res.data);
        const total =
          res.data &&
          typeof res.data === "object" &&
          "count" in res.data &&
          typeof (res.data as {count: number}).count === "number"
            ? (res.data as {count: number}).count
            : rows.length;
        const next =
          res.data &&
          typeof res.data === "object" &&
          "next" in res.data
            ? (res.data as {next: string | null}).next
            : null;

        setFavorites((prev) => (append ? [...prev, ...rows] : rows));
        setCount(total);
        pageRef.current = page;
        setHasMore(
          paginated
            ? Boolean(next) || (rows.length >= PAGE_SIZE && page * PAGE_SIZE < total)
            : false,
        );
      } catch (err: unknown) {
        const status =
          (err as {status?: number})?.status ??
          (err as {response?: {status?: number}})?.response?.status;
        if (status === 401 || status === 404) {
          if (!append) {
            setFavorites([]);
            setCount(0);
          }
          setError(null);
          setHasMore(false);
          if (process.env.NODE_ENV === "development" && status === 404) {
            // TODO(backend): favorites list endpoint missing
            console.info("[favorites] endpoint 404 — showing empty state");
          }
        } else {
          setError(errorUtils.getErrorMessage(err));
          if (!append) {
            setFavorites([]);
            setCount(0);
          }
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [paginated],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    await load({append: true});
  }, [hasMore, loadingMore, loading, load]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    const onMsg = () => {
      void load();
    };
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = onMsg;
    } catch {
      /* ignore */
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHANNEL) onMsg();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [load]);

  const isFavorited = useCallback(
    (contentType: FavoriteContentType, objectId: number) => {
      const favoriteType = toFavoriteType(contentType);
      return favorites.some(
        (fav) =>
          fav.favorite_type === favoriteType &&
          Number(fav.content_object_id) === Number(objectId),
      );
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (contentType: FavoriteContentType, objectId: number) => {
      const favoriteType = toFavoriteType(contentType);
      const existing = favoritesRef.current.find(
        (f) =>
          f.favorite_type === favoriteType &&
          Number(f.content_object_id) === Number(objectId),
      );
      const snapshot = favoritesRef.current;

      if (existing) {
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        setCount((c) => Math.max(0, c - 1));
      }

      try {
        const res = await favoriteApi.toggleFavorite({
          content_type: contentType,
          object_id: objectId,
        });
        broadcastChange();
        if (!existing && res.data?.is_favorited && res.data?.favorite) {
          setFavorites((prev) => [res.data.favorite as Favorite, ...prev]);
          setCount((c) => c + 1);
        } else if (!existing) {
          await load();
        }
        return res.data;
      } catch (err) {
        setFavorites(snapshot);
        setCount(snapshot.length);
        throw err;
      }
    },
    [load],
  );

  /**
   * Optimistic remove. Returns the removed favorite for undo,
   * or null if not found. Rolls back on API error.
   */
  const removeFavoriteOptimistic = useCallback(
    async (favoriteId: number): Promise<Favorite | null> => {
      const snapshot = favoritesRef.current;
      const removed = snapshot.find((f) => f.id === favoriteId) ?? null;
      if (!removed) return null;

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      setCount((c) => Math.max(0, c - 1));

      try {
        await favoriteApi.removeFavorite(favoriteId);
        broadcastChange();
        return removed;
      } catch (err) {
        setFavorites(snapshot);
        setCount(snapshot.length);
        throw err;
      }
    },
    [],
  );

  /** Restore a previously removed favorite (undo). */
  const restoreFavorite = useCallback(async (fav: Favorite) => {
    const content_type = toContentType(fav.favorite_type);
    const res = await favoriteApi.createFavorite({
      content_type,
      object_id: fav.content_object_id,
    });
    const created = (res.data as Favorite) || {
      ...fav,
      id: (res.data as {id?: number})?.id ?? fav.id,
    };
    setFavorites((prev) => {
      if (prev.some((f) => f.id === created.id)) return prev;
      return [created, ...prev];
    });
    setCount((c) => c + 1);
    broadcastChange();
    return created;
  }, []);

  const removeFavorite = useCallback(async (favoriteId: number) => {
    await favoriteApi.removeFavorite(favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    setCount((c) => Math.max(0, c - 1));
    broadcastChange();
  }, []);

  return {
    favorites,
    count,
    loading,
    loadingMore,
    hasMore,
    error,
    load,
    loadMore,
    isFavorited,
    toggleFavorite,
    removeFavorite,
    removeFavoriteOptimistic,
    restoreFavorite,
  };
}
