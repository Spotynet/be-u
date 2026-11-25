"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {HeartIcon} from "@heroicons/react/24/outline";
import {Badge} from "@/components/ui/Badge";
import {ChipRow} from "@/components/ui/ChipRow";
import {CustomDropdown} from "@/components/ui/CustomDropdown";
import {EmptyState} from "@/components/ui/EmptyState";
import {FilterChip} from "@/components/ui/FilterChip";
import {
  PageHeaderRow,
  StackLayout,
  ToolbarListCard,
} from "@/components/layout";
import {useToast} from "@/components/ui/Toast";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {FavoriteCard} from "./components/FavoriteCard";
import {FavoriteSkeleton} from "./components/FavoriteSkeleton";
import {
  useFavorites,
  type Favorite,
} from "./hooks/useFavorites";

type TypeFilter = "" | "PROFESSIONAL" | "PLACE";
type SortId = "recent" | "rating";

const TYPE_OPTS: {id: TypeFilter; label: string}[] = [
  {id: "", label: "Todos"},
  {id: "PROFESSIONAL", label: "Profesionales"},
  {id: "PLACE", label: "Lugares"},
];

const SORT_OPTS: {id: SortId; label: string}[] = [
  {id: "recent", label: "Recientes"},
  {id: "rating", label: "Mejor valorados"},
];

export function FavoritesPage() {
  usePageHeader({title: "Favoritos"});
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const typeParam = (searchParams.get("type") || "").toUpperCase();
  const typeFilter: TypeFilter =
    typeParam === "PROFESSIONAL" || typeParam === "PLACE" ? typeParam : "";
  const sortParam = searchParams.get("sort") || "recent";
  const sort: SortId = sortParam === "rating" ? "rating" : "recent";

  const {
    favorites,
    count,
    loading,
    loadingMore,
    hasMore,
    error,
    load,
    loadMore,
    removeFavoriteOptimistic,
    restoreFavorite,
  } = useFavorites({paginated: true});

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      });
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, {scroll: false});
    },
    [pathname, router, searchParams],
  );

  const filtered = useMemo(() => {
    let rows = favorites;
    if (typeFilter) {
      rows = rows.filter((f) => f.favorite_type === typeFilter);
    }
    if (sort === "rating") {
      rows = [...rows].sort(
        (a, b) => (b.favorite_rating ?? 0) - (a.favorite_rating ?? 0),
      );
    }
    return rows;
  }, [favorites, typeFilter, sort]);

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  const onRemove = async (fav: Favorite) => {
    setTogglingId(fav.id);
    try {
      const removed = await removeFavoriteOptimistic(fav.id);
      if (!removed) return;
      announce(`Quitado ${removed.favorite_name} de favoritos`);
      toast.info("Quitado de favoritos", {
        duration: 5000,
        action: {
          label: "Deshacer",
          onClick: () => {
            void (async () => {
              try {
                await restoreFavorite(removed);
                announce(`${removed.favorite_name} restaurado en favoritos`);
              } catch {
                toast.error("No pudimos restaurar el favorito.");
              }
            })();
          },
        },
      });
    } catch {
      toast.error("No pudimos quitar el favorito.");
      announce("Error al quitar de favoritos");
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      {rootMargin: "200px"},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, filtered.length]);

  const showFilteredEmpty =
    !loading && !error && favorites.length > 0 && filtered.length === 0;

  return (
    <StackLayout>
      <span ref={liveRef} className="sr-only" aria-live="polite" />

      <PageHeaderRow
        title="Favoritos"
        meta={
          <Badge tone="brand" size="sm">
            {count === 1 ? "1 guardado" : `${count} guardados`}
          </Badge>
        }
      />

      <div className="@container/favorites">
        <ToolbarListCard
          toolbar={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-[16px] font-semibold text-foreground">
                Guardados
              </h2>
              <div className="min-w-0 max-w-xs flex-1 @min-[480px]:w-44 @min-[480px]:flex-none">
                <CustomDropdown
                  label="Ordenar"
                  value={sort}
                  onChange={(v) =>
                    setParams({
                      sort: v === "rating" ? "rating" : null,
                    })
                  }
                  options={SORT_OPTS.map((o) => ({
                    value: o.id,
                    label: o.label,
                  }))}
                />
              </div>
            </div>
          }
          chips={
            <ChipRow
              aria-label="Filtrar favoritos por tipo"
              mode="single"
              bleed={false}
              surface="card"
              className="min-w-0">
              {TYPE_OPTS.map((opt) => (
                <FilterChip
                  key={opt.id || "all"}
                  label={opt.label}
                  selected={typeFilter === opt.id}
                  selectionRole="radio"
                  onClick={() => setParams({type: opt.id || null})}
                />
              ))}
            </ChipRow>
          }>
          <div className="p-4 @min-[480px]:p-5">
            {loading ? (
              <div
                className="grid grid-cols-1 gap-4 @[640px]:grid-cols-2 @[1100px]:grid-cols-3"
                aria-busy="true"
                aria-label="Cargando favoritos">
                {Array.from({length: 8}).map((_, i) => (
                  <FavoriteSkeleton key={i} />
                ))}
              </div>
            ) : null}

            {!loading && error ? (
              <div
                className="rounded-[var(--tile-radius)] border border-error/30 bg-error-light px-4 py-6 text-center"
                role="alert">
                <p className="text-[15px] font-semibold text-foreground">
                  No pudimos cargar tus favoritos.
                </p>
                <p className="mt-1 text-[13px] text-foreground-secondary">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-secondary px-4 text-[14px] font-bold text-secondary-foreground hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  Reintentar
                </button>
              </div>
            ) : null}

            {!loading && !error && favorites.length === 0 ? (
              <EmptyState
                icon={HeartIcon}
                title="Aún no tienes favoritos"
                description="Guarda profesionales y lugares para encontrarlos rápido."
                primaryAction={{label: "Explorar", href: "/explore"}}
              />
            ) : null}

            {showFilteredEmpty ? (
              <EmptyState
                title="No hay favoritos con estos filtros"
                description="Prueba otro tipo u orden."
                primaryAction={{
                  label: "Limpiar filtros",
                  onClick: () => setParams({type: null, sort: null}),
                }}
                size="sm"
              />
            ) : null}

            {!loading && !error && filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 @[640px]:grid-cols-2 @[960px]:grid-cols-3 @min-[480px]:gap-5">
                  {filtered.map((f) => (
                    <FavoriteCard
                      key={f.id}
                      favorite={f}
                      saved
                      toggling={togglingId === f.id}
                      onToggle={() => void onRemove(f)}
                    />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
                {loadingMore ? (
                  <p className="mt-4 text-center text-[13px] text-foreground-secondary">
                    Cargando más…
                  </p>
                ) : null}
                {hasMore && !loadingMore ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => void loadMore()}
                      className="inline-flex min-h-11 items-center rounded-full border border-card-border bg-card px-4 text-[14px] font-bold text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      Ver más
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </ToolbarListCard>
      </div>
    </StackLayout>
  );
}
