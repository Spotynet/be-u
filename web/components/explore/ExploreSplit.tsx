"use client";

/**
 * Google Maps–style Explorar: map fills the shell; UI floats over it.
 * Results: full-width bottom sheet with collapsed / expanded states.
 */

import {useEffect, useRef, useState} from "react";
import {ChevronDownIcon, ChevronUpIcon} from "@heroicons/react/24/outline";
import type {ExploreResultsApi} from "@/features/explore";
import {ExploreFiltersBadge} from "./ExploreFiltersBadge";
import {ExploreMapPane} from "./ExploreMapPane";
import {ExploreResultsHeader} from "./ExploreResultsHeader";
import {ExploreResultsList} from "./ExploreResultsList";

type Props = {
  api: ExploreResultsApi;
  mapAvailable: boolean;
  onMapUnavailable: () => void;
};

type ResultsMode = "collapsed" | "expanded";

export function ExploreSplit({api, mapAvailable, onMapUnavailable}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [resultsMode, setResultsMode] = useState<ResultsMode>("collapsed");

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const apply = () => setNarrow(el.clientWidth < 900);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!mapExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mapExpanded]);

  useEffect(() => {
    if (api.view === "lista") {
      api.setView("mapa");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showFloat = !mapExpanded;
  const resultsExpanded = resultsMode === "expanded";
  const searchActive = Boolean(api.exploreQ);
  const showSearchEmptyBanner =
    searchActive &&
    !api.loading &&
    !api.refetching &&
    !api.error &&
    api.profiles.length === 0;

  const count = api.totalCount || api.profiles.length;
  const countLabel = api.loading && api.profiles.length === 0
    ? "Cargando..."
    : count === 1
      ? "1 resultado"
      : `${count} resultados`;

  const toggleResults = () =>
    setResultsMode((m) => (m === "expanded" ? "collapsed" : "expanded"));

  return (
    <div
      ref={rootRef}
      className="nabbi-explore-workspace nabbi-explore-workspace--mapfill"
      data-dock="off"
      data-expanded={mapExpanded ? "on" : "off"}
      data-results={resultsMode}
      data-narrow={narrow ? "on" : "off"}
      data-map={mapAvailable ? "on" : "off"}>
      <a href="#explore-mapa" className="sr-only focus:not-sr-only">
        Saltar al mapa
      </a>
      <a href="#explore-listado" className="sr-only focus:not-sr-only">
        Saltar a resultados
      </a>

      <div id="explore-mapa" className="nabbi-explore-workspace__map">
        <ExploreMapPane
          api={api}
          visible
          onUnavailable={onMapUnavailable}
          gestureMode={mapExpanded || !resultsExpanded ? "greedy" : "cooperative"}
          expanded={mapExpanded}
          onExpandedChange={(v) => {
            setMapExpanded(v);
            if (v) setResultsMode("collapsed");
          }}
          allowExpand
          dockedPopup={narrow}
        />
      </div>

      {showSearchEmptyBanner ? (
        <div
          className="nabbi-explore-search-empty"
          role="status"
          aria-live="polite">
          <div className="nabbi-explore-search-empty__inner">
            <p className="nabbi-explore-search-empty__title">
              No encontramos resultados
            </p>
            <p className="nabbi-explore-search-empty__desc">
              Prueba otra búsqueda
              {api.activeFilterCount ? " o quita algunos filtros" : ""}.
            </p>
            {api.activeFilterCount > 0 ? (
              <button
                type="button"
                className="nabbi-explore-search-empty__action"
                onClick={api.clearFilters}>
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showFloat ? (
        <div className="nabbi-explore-float" aria-hidden={false}>
          <div className="nabbi-explore-float__tools">
            <ExploreFiltersBadge
              expanded={filtersOpen}
              onExpandedChange={setFiltersOpen}
              api={api}
            />
          </div>

          <aside
            id="explore-float-panel"
            className="nabbi-explore-float__panel"
            data-state={resultsMode}
            aria-label="Resultados"
            aria-expanded={resultsExpanded}>
            <div className="nabbi-explore-float__panel-head">
              <button
                type="button"
                className="nabbi-explore-float__handle"
                aria-label={
                  resultsExpanded
                    ? "Contraer resultados"
                    : "Expandir resultados"
                }
                aria-expanded={resultsExpanded}
                aria-controls="explore-float-panel-body"
                onClick={toggleResults}>
                <span className="nabbi-explore-float__handle-bar" aria-hidden />
                <span className="nabbi-explore-float__handle-meta">
                  <span className="nabbi-explore-float__handle-count">
                    {countLabel}
                  </span>
                  {resultsExpanded ? (
                    <ChevronDownIcon className="h-5 w-5" aria-hidden />
                  ) : (
                    <ChevronUpIcon className="h-5 w-5" aria-hidden />
                  )}
                </span>
              </button>
              {resultsExpanded ? (
                <div className="nabbi-explore-float__panel-tools">
                  <ExploreResultsHeader
                    count={count}
                    loading={api.loading && api.profiles.length === 0}
                    sort={api.sort}
                    onSort={api.setSort}
                    hasLocation={api.hasLocationForDistance}
                  />
                </div>
              ) : null}
            </div>

            <div
              id="explore-float-panel-body"
              className="nabbi-explore-float__panel-body"
              hidden={!resultsExpanded}>
              {resultsExpanded ? (
                <ExploreResultsList
                  api={api}
                  showMapAction={mapAvailable}
                  split={false}
                  hideHeader
                  scrollRoot=".nabbi-explore-float__panel-body"
                />
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
