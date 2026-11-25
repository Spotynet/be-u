"use client";

/**
 * Favorites for Explorar.
 * Toggle API requires professionalprofile / placeprofile object ids.
 * List payload only has public profile id — so we can:
 *  - detect favorited via `public_profile_id` match and remove
 *  - add only when nested ids are present on the result (rare today)
 */

import {useCallback, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {
  useFavorites,
  type FavoriteContentType,
} from "@/features/favorites/hooks/useFavorites";
import {useToast} from "@/components/ui/Toast";
import {errorUtils} from "@/lib/api";
import type {ExploreResult} from "./ResultCard";

function nestedIds(r: ExploreResult): {
  contentType: FavoriteContentType;
  objectId: number;
} | null {
  const isPlace = (r.profile_type || "").toUpperCase() === "PLACE";
  if (isPlace && r.place_profile_id) {
    return {contentType: "placeprofile", objectId: Number(r.place_profile_id)};
  }
  if (!isPlace && r.professional_profile_id) {
    return {
      contentType: "professionalprofile",
      objectId: Number(r.professional_profile_id),
    };
  }
  return null;
}

export function useExploreFavorite() {
  const {isAuthenticated} = useAuth();
  const router = useRouter();
  const toast = useToast();
  const {favorites, isFavorited, toggleFavorite, removeFavoriteOptimistic} =
    useFavorites({autoLoad: isAuthenticated});
  const [busyId, setBusyId] = useState<number | null>(null);

  const matchFavorite = useCallback(
    (r: ExploreResult) => {
      const nested = nestedIds(r);
      if (nested && isFavorited(nested.contentType, nested.objectId)) {
        return favorites.find(
          (f) =>
            f.favorite_type ===
              (nested.contentType === "placeprofile"
                ? "PLACE"
                : "PROFESSIONAL") &&
            Number(f.content_object_id) === nested.objectId,
        );
      }
      return favorites.find(
        (f) => Number(f.public_profile_id) === Number(r.id),
      );
    },
    [favorites, isFavorited],
  );

  const forResult = useCallback(
    (r: ExploreResult) => {
      const existing = matchFavorite(r);
      const nested = nestedIds(r);
      const favorited = Boolean(existing);
      const canAdd = Boolean(nested);
      const show = favorited || canAdd;

      const toggle = async () => {
        if (!isAuthenticated) {
          router.push(
            `/login?next=${encodeURIComponent(`/explore`)}`,
          );
          return;
        }
        setBusyId(r.id);
        try {
          if (existing) {
            await removeFavoriteOptimistic(existing.id);
          } else if (nested) {
            await toggleFavorite(nested.contentType, nested.objectId);
          }
        } catch (err) {
          toast.error(errorUtils.getErrorMessage(err));
        } finally {
          setBusyId(null);
        }
      };

      return {
        show,
        favorited,
        busy: busyId === r.id,
        toggle,
      };
    },
    [
      matchFavorite,
      isAuthenticated,
      router,
      removeFavoriteOptimistic,
      toggleFavorite,
      toast,
      busyId,
    ],
  );

  return {forResult};
}
