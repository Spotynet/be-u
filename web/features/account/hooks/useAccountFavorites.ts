"use client";

import {useFavorites} from "@/features/favorites/hooks/useFavorites";
import type {AccountFavorite} from "../lib/types";

export function useAccountFavorites(enabled = true) {
  const {favorites, loading, error, load} = useFavorites({
    autoLoad: enabled,
  });

  return {
    items: favorites as AccountFavorite[],
    loading,
    error,
    reload: load,
  };
}
