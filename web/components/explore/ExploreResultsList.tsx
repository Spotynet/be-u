"use client";

import {useEffect, useRef} from "react";
import {Button} from "@/components/ui/Button";
import {EmptyState} from "@/components/ui/EmptyState";
import {
  useExploreHoveredId,
  useExploreSelectedId,
  useExploreSelectionApi,
  type ExploreResultsApi,
} from "@/features/explore";
import {ExploreResultsHeader} from "./ExploreResultsHeader";
import {ResultCard} from "./ResultCard";
import {useExploreFavorite} from "./useExploreFavorite";

function MediaSkeleton() {
  return (
    <div className="nabbi-explore-media" aria-hidden>
      <div className="nabbi-explore-media__frame animate-pulse bg-background-secondary motion-reduce:animate-none" />
      <div className="space-y-2 px-1 pb-1 pt-3">
        <div className="flex justify-between gap-2">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-background-secondary motion-reduce:animate-none" />
          <div className="h-[22px] w-10 animate-pulse rounded-full bg-background-secondary motion-reduce:animate-none" />
        </div>
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-background-secondary motion-reduce:animate-none" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-background-secondary motion-reduce:animate-none" />
      </div>
    </div>
  );
}

const SHELL_SCROLL = ".nabbi-shell-panel__scroll";

type Props = {
  api: ExploreResultsApi;
  /** When true, show "Ver en el mapa" on cards. */
  showMapAction?: boolean;
  /** @deprecated layout always places cards below the map */
  split?: boolean;
  /** Header rendered by workspace toolbar when true. */
  hideHeader?: boolean;
  /** IntersectionObserver / scroll restore root (floating panel). */
  scrollRoot?: string;
};

export function ExploreResultsList({
  api,
  showMapAction = false,
  split = false,
  hideHeader = false,
  scrollRoot,
}: Props) {
  const {
    profiles,
    loading,
    refetching,
    loadingMore,
    error,
    hasMore,
    loadMore,
    retry,
    listScrollResetToken,
    restoredScrollTop,
    clearRestoredScrollTop,
    totalCount,
    sort,
    setSort,
    hasLocationForDistance,
  } = api;

  const selectedId = useExploreSelectedId();
  const hoveredId = useExploreHoveredId();
  const selection = useExploreSelectionApi();
  const favorite = useExploreFavorite();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const resolveScroller = () =>
    (document.querySelector(scrollRoot || SHELL_SCROLL) as HTMLElement | null) ??
    null;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const root = resolveScroller();
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !loading &&
          !refetching &&
          !loadingMore
        ) {
          loadMore();
        }
      },
      {root: root ?? null, rootMargin: "240px"},
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, refetching, loadingMore, loadMore, scrollRoot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selection.getSnapshot().selectedId == null) return;
      e.preventDefault();
      selection.clear();
      selection.lastCardElRef.current?.focus?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selection]);

  useEffect(() => {
    if (!listScrollResetToken) return;
    resolveScroller()?.scrollTo({top: 0, behavior: "auto"});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listScrollResetToken, scrollRoot]);

  useEffect(() => {
    if (restoredScrollTop == null || loading) return;
    const scroller = resolveScroller();
    if (scroller) scroller.scrollTop = restoredScrollTop;
    clearRestoredScrollTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoredScrollTop, loading, clearRestoredScrollTop, scrollRoot]);

  const gridClass = [
    "nabbi-explore-results__grid",
    "nabbi-explore-results__grid--tiles",
    "nabbi-explore-results__grid--media",
    "nabbi-explore-results__grid--below-map",
    split ? "nabbi-explore-results__grid--split" : "",
    refetching ? "nabbi-explore-results__grid--dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const selectOnMap = (id: number) => {
    selection.setSelectedId(id);
    selection.scrollCardIntoView(id);
    const el = selection.cardElsRef.current.get(id);
    if (el) selection.lastCardElRef.current = el;
  };

  return (
    <div
      id="explore-listado"
      className="nabbi-explore-results nabbi-explore-results--page"
      tabIndex={-1}>
      {!hideHeader ? (
        <ExploreResultsHeader
          count={totalCount || profiles.length}
          loading={loading && profiles.length === 0}
          sort={sort}
          onSort={setSort}
          hasLocation={hasLocationForDistance}
        />
      ) : null}

      {loading && profiles.length === 0 ? (
        <ul className={gridClass} aria-hidden>
          {Array.from({length: 6}).map((_, i) => (
            <li key={i}>
              <MediaSkeleton />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && error && profiles.length === 0 ? (
        <EmptyState
          title="No pudimos cargar los resultados"
          description={error}
          primaryAction={{label: "Reintentar", onClick: retry}}
          size="sm"
          className="nabbi-explore-results__empty"
        />
      ) : null}

      {/* Zero-result copy for search lives as a bottom map banner (ExploreSplit). */}

      {profiles.length > 0 ? (
        <ul className={gridClass}>
          {profiles.map((p) => {
            const fav = favorite.forResult(p);
            return (
              <li key={p.id}>
                <ResultCard
                  result={p}
                  variant="media"
                  selected={selectedId === p.id}
                  highlighted={hoveredId === p.id}
                  showFavorite={fav.show}
                  favorited={fav.favorited}
                  favoriteBusy={fav.busy}
                  onToggleFavorite={fav.toggle}
                  showMapAction={showMapAction}
                  onShowOnMap={selectOnMap}
                  onHover={selection.setHoveredId}
                  onSelect={selectOnMap}
                  onFocusCard={selectOnMap}
                  cardRef={(el) => {
                    selection.registerCard(p.id, el);
                    if (el && selectedId === p.id) {
                      selection.lastCardElRef.current = el;
                    }
                  }}
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
      {loadingMore ? (
        <ul
          className={[gridClass, "mt-4"].filter(Boolean).join(" ")}
          aria-hidden>
          <li>
            <MediaSkeleton />
          </li>
        </ul>
      ) : null}
      {hasMore && !loadingMore && !loading ? (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="ghost" onClick={loadMore}>
            Cargar más
          </Button>
        </div>
      ) : null}
      {!hasMore && profiles.length > 0 && !loading ? (
        <p className="mt-4 text-center text-[12px] text-foreground-muted">
          Llegaste al final
        </p>
      ) : null}
      {error && profiles.length > 0 ? (
        <div className="mt-3 rounded-[var(--r-tile)] border border-error/30 bg-card p-3 text-[13px] text-error">
          {error}{" "}
          <button
            type="button"
            className="font-bold underline"
            onClick={retry}>
            Reintentar
          </button>
        </div>
      ) : null}
    </div>
  );
}
