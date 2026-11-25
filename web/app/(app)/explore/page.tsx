"use client";

import {Suspense, useEffect, useState} from "react";
import {ExploreSplit} from "@/components/explore";
import {StackLayout} from "@/components/layout";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {
  ExploreSelectionProvider,
  useExploreResults,
  useExploreSelectionApi,
} from "@/features/explore";
import {getGoogleMapsBrowserKey} from "@/lib/googleMapsLoader";

function ExplorePageInner() {
  usePageHeader({title: "Explorar", pageOwnsTitle: true});
  const api = useExploreResults();
  const selection = useExploreSelectionApi();
  const [mapAvailable, setMapAvailable] = useState(() =>
    Boolean(getGoogleMapsBrowserKey()),
  );

  useEffect(() => {
    if (!getGoogleMapsBrowserKey() && process.env.NODE_ENV === "development") {
      console.warn(
        "[explore] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing — map region shows config error.",
      );
    }
  }, []);

  useEffect(() => {
    if (api.restoredSelectedId == null) return;
    selection.setSelectedId(api.restoredSelectedId);
    api.clearRestoredSelectedId();
  }, [api.restoredSelectedId, api.clearRestoredSelectedId, selection]);

  return (
    <div
      className="nabbi-explore nabbi-explore--mapfill"
      data-map={mapAvailable ? "on" : "off"}>
      <h1 className="sr-only">Explorar</h1>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {api.liveCount}
      </div>
      <div className="sr-only" aria-live="polite">
        {api.liveMessage}
      </div>

      <ExploreSplit
        api={api}
        mapAvailable={mapAvailable}
        onMapUnavailable={() => setMapAvailable(false)}
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <StackLayout container={false}>
      <ExploreSelectionProvider>
        <Suspense
          fallback={
            <div className="nabbi-explore nabbi-explore--mapfill">
              <SkeletonCard />
            </div>
          }>
          <ExplorePageInner />
        </Suspense>
      </ExploreSelectionProvider>
    </StackLayout>
  );
}
