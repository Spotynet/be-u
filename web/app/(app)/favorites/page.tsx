"use client";

import {Suspense} from "react";
import {FavoritesPage} from "@/features/favorites/FavoritesPage";
import {FavoriteSkeleton} from "@/features/favorites/components/FavoriteSkeleton";

function FavoritesFallback() {
  return (
    <div className="nabbi-page-container">
      <div className="nabbi-tpl-stack">
        <div className="py-6">
          <div className="mb-2 h-7 w-40 rounded bg-foreground-muted/20" />
          <div className="h-4 w-64 rounded bg-foreground-muted/15" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({length: 6}).map((_, i) => (
            <FavoriteSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<FavoritesFallback />}>
      <FavoritesPage />
    </Suspense>
  );
}
