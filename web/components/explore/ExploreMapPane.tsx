"use client";

import dynamic from "next/dynamic";
import {useMemo} from "react";
import {
  useExploreHoveredId,
  useExploreSelectedId,
  useExploreSelectionApi,
  type ExploreResultsApi,
} from "@/features/explore";
import {getGoogleMapsBrowserKey} from "@/lib/googleMapsLoader";
import {useExploreFavorite} from "./useExploreFavorite";

const ExploreMap = dynamic(
  () => import("./ExploreMap").then((m) => m.ExploreMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full animate-pulse rounded-[inherit] bg-background-secondary motion-reduce:animate-none"
        role="status"
        aria-label="Cargando mapa"
      />
    ),
  },
);

type Props = {
  api: ExploreResultsApi;
  visible: boolean;
  onUnavailable: () => void;
  gestureMode: "cooperative" | "greedy";
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  allowExpand?: boolean;
  dockedPopup?: boolean;
};

export function ExploreMapPane({
  api,
  visible,
  onUnavailable,
  gestureMode,
  expanded = false,
  onExpandedChange,
  allowExpand = true,
  dockedPopup = false,
}: Props) {
  const selectedId = useExploreSelectedId();
  const hoveredId = useExploreHoveredId();
  const selection = useExploreSelectionApi();
  const favorite = useExploreFavorite();

  const selected = useMemo(
    () => api.profiles.find((p) => p.id === selectedId) || null,
    [api.profiles, selectedId],
  );
  const fav = selected ? favorite.forResult(selected) : null;

  if (!getGoogleMapsBrowserKey()) {
    return (
      <div
        className="nabbi-explore-map-fallback"
        role="region"
        aria-label="Mapa no disponible">
        <p className="m-0 text-[14px] font-semibold text-foreground">
          El mapa no está configurado
        </p>
        <p className="mb-0 mt-1 text-[13px] text-foreground-secondary">
          Falta la clave pública de Google Maps. El listado sigue disponible.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        visible
          ? "nabbi-explore-workspace__map-inner"
          : "nabbi-explore-workspace__map-inner nabbi-explore-map--hidden"
      }
      aria-hidden={!visible}>
      <ExploreMap
        results={api.markerResults}
        selectedId={selectedId}
        hoveredId={hoveredId}
        userCoords={api.loc.coords}
        resultsGeneration={api.resultsGeneration}
        loading={api.loading}
        refetching={api.refetching}
        error={api.error}
        onRetry={api.retry}
        gestureMode={gestureMode}
        userMovedMap={api.userMovedMap}
        onUserMovedMap={api.setUserMovedMap}
        filterSignature={api.currentFilterSignature}
        view={api.view}
        onSelect={(r) => {
          if (!r) {
            selection.clear();
            return;
          }
          selection.setSelectedId(r.id);
          selection.scrollCardIntoView(r.id);
          const el = selection.cardElsRef.current.get(r.id);
          if (el) selection.lastCardElRef.current = el;
        }}
        onHover={selection.setHoveredId}
        onBoundsSearch={api.applyMapBoundsSearch}
        onMapUnavailable={onUnavailable}
        onRecenter={() => {
          if (!api.loc.coords) api.loc.requestGps();
          else api.enableNearby();
        }}
        locating={api.loc.status === "locating"}
        favorited={fav?.favorited}
        favoriteBusy={fav?.busy}
        showFavorite={fav?.show}
        onToggleFavorite={fav?.toggle}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        allowExpand={allowExpand}
        dockedPopup={dockedPopup}
        /* Zone pill only for map-area browse; search empty uses bottom banner. */
        emptyResults={
          !api.loading &&
          !api.refetching &&
          !api.error &&
          api.profiles.length === 0 &&
          api.locationMode === "mapArea" &&
          !api.exploreQ
        }
      />
    </div>
  );
}
