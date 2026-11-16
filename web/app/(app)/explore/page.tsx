"use client";

import {Suspense, useCallback, useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {providerApi, errorUtils} from "@/lib/api";
import {
  CategoryChipBar,
  ProviderCard,
} from "@/components/marketplace";
import {CDMX_CENTER, getGoogleMapsBrowserKey, loadGoogleMapsScript} from "@/lib/googleMapsLoader";

function ExplorePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialNearby = searchParams.get("nearby") === "1";

  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState(initialQ);
  const [category, setCategory] = useState<string>(initialCategory);
  const [profileType, setProfileType] = useState<"" | "PROFESSIONAL" | "PLACE">("");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [nearby, setNearby] = useState(initialNearby);
  const [coords, setCoords] = useState<{lat: number; lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const mapsApi = useRef<any>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    const cat = searchParams.get("category");
    if (cat != null) setCategory(cat);
    if (searchParams.get("nearby") === "1") setNearby(true);
  }, [searchParams]);

  const syncUrl = useCallback(
    (next: {q?: string; category?: string; nearby?: boolean}) => {
      const params = new URLSearchParams();
      const q = next.q ?? search;
      const cat = next.category ?? category;
      const near = next.nearby ?? nearby;
      if (q.trim()) params.set("q", q.trim());
      if (cat) params.set("category", cat);
      if (near) params.set("nearby", "1");
      const qs = params.toString();
      router.replace(qs ? `/explore?${qs}` : "/explore", {scroll: false});
    },
    [router, search, category, nearby]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await providerApi.getPublicProfiles({
        search: search.trim() || undefined,
        category: category || undefined,
        profile_type: profileType || undefined,
        page_size: 50,
        ...(nearby && coords
          ? {latitude: coords.lat, longitude: coords.lng, radius: 10}
          : {}),
      });
      setProfiles(res.data.results || []);
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, profileType, nearby, coords]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const enableNearby = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({lat: pos.coords.latitude, lng: pos.coords.longitude});
        setNearby(true);
        syncUrl({nearby: true});
      },
      () => {
        setError("No pudimos obtener tu ubicación. Revisa permisos del navegador.");
        setNearby(false);
      },
      {enableHighAccuracy: true, timeout: 10000}
    );
  };

  useEffect(() => {
    if (nearby && !coords) enableNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby]);

  const showMap = isDesktop || mobileView === "map";

  useEffect(() => {
    if (!showMap) return;
    const key = getGoogleMapsBrowserKey();
    if (!key) {
      setMapError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para el mapa.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setMapError(null);
        const maps = await loadGoogleMapsScript(key);
        mapsApi.current = maps;
        if (cancelled || !mapRef.current) return;
        const center = coords || CDMX_CENTER;
        if (!mapInstance.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center,
            zoom: nearby ? 13 : 11,
            disableDefaultUI: false,
            mapTypeControl: false,
            streetViewControl: false,
          });
        } else {
          mapInstance.current.setCenter(center);
          mapInstance.current.setZoom(nearby ? 13 : 11);
        }
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        profiles.forEach((p) => {
          const lat = Number(p.latitude);
          const lng = Number(p.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const marker = new maps.Marker({
            position: {lat, lng},
            map: mapInstance.current,
            title: p.name || "Perfil",
          });
          marker.addListener("click", () => setSelected(p));
          markersRef.current.push(marker);
        });
      } catch (err: any) {
        if (!cancelled) setMapError(err?.message || "No se pudo cargar el mapa.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showMap, profiles, coords, nearby]);

  useEffect(() => {
    if (!selected || !mapInstance.current) return;
    const lat = Number(selected.latitude);
    const lng = Number(selected.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    mapInstance.current.panTo({lat, lng});
    mapInstance.current.setZoom(Math.max(mapInstance.current.getZoom() || 12, 14));
  }, [selected]);

  const cardData = useMemo(
    () =>
      profiles.map((p) => ({
        ...p,
        display_name: p.name,
        user_image: p.user_image,
        photo_url: p.user_image || p.images?.[0],
        cover_photo: p.images?.[0] || p.user_image,
        city: p.city,
        bio: p.bio || p.description,
      })),
    [profiles]
  );

  const listContent = (
    <div className="min-w-0">
      {loading && (
        <div className="rounded-2xl border border-[#ccd8ce] bg-white p-5 text-sm font-semibold text-[#3d6050]">
          Buscando profesionales y lugares…
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-2xl border border-[#fca5a5] bg-[#fef2f2] p-4 text-sm font-semibold text-[#b91c1c]">
          {error}
        </div>
      )}
      {!loading && !error && profiles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#ccd8ce] bg-white p-8 text-center">
          <p className="m-0 text-[15px] font-extrabold text-[#12211a]">
            No encontramos resultados
          </p>
          <p className="mt-2 mb-0 text-sm text-[#3d6050]">
            Prueba otra búsqueda, quita filtros o activa “Cerca de mí”.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {cardData.map((p) =>
          isDesktop ? (
            <div key={p.id} className="relative">
              <ProviderCard
                provider={p}
                selected={selected?.id === p.id}
                onSelect={() => setSelected(p)}
              />
              <Link
                href={`/profile/${p.id}`}
                className="nabbi-btn nabbi-btn-accent absolute bottom-3 right-3 z-10 !px-3 !py-2 !text-[12px]">
                Ver perfil
              </Link>
            </div>
          ) : (
            <ProviderCard key={p.id} provider={p} href={`/profile/${p.id}`} />
          )
        )}
      </div>
    </div>
  );

  const mapPane = (
    <div className="nabbi-explore-map relative min-h-[420px] overflow-hidden rounded-[20px] border border-[#ccd8ce] bg-[#e8efe9] lg:min-h-0">
      {mapError && (
        <div className="absolute inset-x-3 top-3 z-10 rounded-xl border border-orange-300 bg-orange-50 p-3 text-sm font-semibold text-orange-900">
          {mapError} Mientras tanto usa la vista Lista.
        </div>
      )}
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-[#ccd8ce] bg-white p-3.5 shadow-[0_12px_28px_-10px_rgba(18,33,26,0.28)]">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-extrabold text-[#12211a]">
              {selected.name || selected.display_name}
            </div>
            <div className="text-xs font-bold text-[#558367]">
              {selected.profile_type === "PLACE" ? "Lugar" : "Profesional"}
              {selected.city ? ` · ${selected.city}` : ""}
            </div>
          </div>
          <Link
            href={`/profile/${selected.id}`}
            className="nabbi-btn nabbi-btn-accent shrink-0 !px-3.5 !py-2.5 !text-[13px]">
            Ver perfil
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="nabbi-page w-full">
      <div className="mb-4 overflow-hidden rounded-[22px] border border-[#ccd8ce] bg-gradient-to-br from-[#1f3328] via-[#2a4638] to-[#558367] px-4 py-5 text-white shadow-[0_16px_40px_-18px_rgba(18,33,26,0.45)] sm:px-5">
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">
          Marketplace
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(1.45rem,4vw,1.9rem)] font-black tracking-tight text-white">
              Explorar
            </h1>
            <p className="mt-1.5 mb-0 max-w-xl text-[14px] leading-relaxed text-white/80">
              Encuentra profesionales y lugares cerca de ti. Reserva en pocos toques.
            </p>
          </div>
          <div className="rounded-full bg-white/15 px-3.5 py-2 text-[13px] font-bold text-white backdrop-blur-sm">
            {loading ? "…" : `${profiles.length} resultados`}
          </div>
        </div>
      </div>

      <div className="sticky top-[68px] z-20 mb-4 space-y-3 rounded-[20px] border border-[#ccd8ce] bg-white/95 px-3 py-3.5 shadow-[0_10px_30px_-18px_rgba(18,33,26,0.35)] backdrop-blur-md sm:px-4">
        <div className="nabbi-stack-row flex-nowrap overflow-x-auto pb-0.5">
          {!isDesktop && (
            <>
              <FilterChip
                active={mobileView === "list"}
                onClick={() => setMobileView("list")}
                label="Lista"
              />
              <FilterChip
                active={mobileView === "map"}
                onClick={() => setMobileView("map")}
                label="Mapa"
              />
            </>
          )}
          <FilterChip
            active={nearby}
            onClick={() => {
              if (nearby) {
                setNearby(false);
                syncUrl({nearby: false});
              } else {
                enableNearby();
              }
            }}
            label={nearby ? "Cerca de mí ✓" : "Cerca de mí"}
          />
          <FilterChip
            active={!profileType}
            onClick={() => setProfileType("")}
            label="Todos"
          />
          <FilterChip
            active={profileType === "PROFESSIONAL"}
            onClick={() => setProfileType("PROFESSIONAL")}
            label="Profesionales"
          />
          <FilterChip
            active={profileType === "PLACE"}
            onClick={() => setProfileType("PLACE")}
            label="Lugares"
          />
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => syncUrl({q: search})}
          onKeyDown={(e) => {
            if (e.key === "Enter") syncUrl({q: search});
          }}
          placeholder="Buscar por nombre o ciudad…"
          className="nabbi-search"
          aria-label="Buscar"
        />

        <CategoryChipBar
          value={category}
          onChange={(id) => {
            setCategory(id);
            syncUrl({category: id});
          }}
          allLabel="Todas"
        />
      </div>

      {isDesktop ? (
        <div className="nabbi-explore-split">
          <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
            {listContent}
          </div>
          {mapPane}
        </div>
      ) : mobileView === "map" ? (
        <div className="min-h-[70vh]">{mapPane}</div>
      ) : (
        listContent
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nabbi-chip ${active ? "nabbi-chip-active" : ""}`}>
      {label}
    </button>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="nabbi-page p-4 text-sm font-semibold text-[#3d6050]">
          Cargando explorar…
        </div>
      }>
      <ExplorePageInner />
    </Suspense>
  );
}
