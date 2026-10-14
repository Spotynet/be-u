"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {providerApi, errorUtils} from "@/lib/api";
import {MAIN_CATEGORIES} from "@/constants/categories";
import {CDMX_CENTER, getGoogleMapsBrowserKey, loadGoogleMapsScript} from "@/lib/googleMapsLoader";

const DARK = "#1F3328";
const MAIN = "#558367";
const INK = "#12211A";

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [profileType, setProfileType] = useState<"" | "PROFESSIONAL" | "PLACE">("");
  const [view, setView] = useState<"list" | "map">("list");
  const [nearby, setNearby] = useState(false);
  const [coords, setCoords] = useState<{lat: number; lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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
      },
      () => {
        setError("No pudimos obtener tu ubicación. Revisa permisos del navegador.");
        setNearby(false);
      },
      {enableHighAccuracy: true, timeout: 10000}
    );
  };

  useEffect(() => {
    if (view !== "map") return;
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
  }, [view, profiles, coords, nearby]);

  return (
    <div className="nabbi-page" style={{width: "100%", maxWidth: 1100, margin: "0 auto"}}>
      <h1 className="nabbi-page-title">Explorar</h1>
      <p className="nabbi-page-sub">Encuentra profesionales y lugares cerca de ti.</p>

      <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12}}>
        <Chip active={view === "list"} onClick={() => setView("list")} label="Lista" />
        <Chip active={view === "map"} onClick={() => setView("map")} label="Mapa" />
        <Chip
          active={nearby}
          onClick={() => {
            if (nearby) {
              setNearby(false);
            } else {
              enableNearby();
            }
          }}
          label={nearby ? "Cerca de mí ✓" : "Cerca de mí"}
        />
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: 12, marginBottom: 16}}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o ciudad…"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1.5px solid rgba(85,131,103,0.22)",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
          <Chip active={!category} onClick={() => setCategory("")} label="Todas" />
          {MAIN_CATEGORIES.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} label={c.name} />
          ))}
        </div>
        <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
          <Chip active={!profileType} onClick={() => setProfileType("")} label="Todos" />
          <Chip
            active={profileType === "PROFESSIONAL"}
            onClick={() => setProfileType("PROFESSIONAL")}
            label="Profesionales"
          />
          <Chip active={profileType === "PLACE"} onClick={() => setProfileType("PLACE")} label="Lugares" />
        </div>
      </div>

      {loading && <p style={{color: "#64748b"}}>Cargando…</p>}
      {error && (
        <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626", marginBottom: 12}}>
          {error}
        </div>
      )}

      {view === "map" && (
        <div style={{marginBottom: 16}}>
          {mapError && (
            <div style={{background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 12, padding: 12, color: "#c2410c", marginBottom: 10, fontSize: 14}}>
              {mapError} Mientras tanto usa la vista Lista.
            </div>
          )}
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: 420,
              borderRadius: 16,
              border: "1px solid rgba(18,33,26,0.08)",
              background: "#e8efe9",
            }}
          />
          {selected && (
            <div
              style={{
                marginTop: 10,
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(18,33,26,0.08)",
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}>
              <div>
                <div style={{fontWeight: 800, color: INK}}>{selected.name}</div>
                <div style={{fontSize: 12, color: MAIN, fontWeight: 700}}>
                  {selected.profile_type === "PLACE" ? "Lugar" : "Profesional"}
                </div>
              </div>
              <Link
                href={`/profile/${selected.id}`}
                style={{
                  background: MAIN,
                  color: "white",
                  textDecoration: "none",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontWeight: 700,
                  fontSize: 13,
                }}>
                Ver perfil
              </Link>
            </div>
          )}
        </div>
      )}

      {view === "list" && !loading && !error && profiles.length === 0 && (
        <p style={{color: "#64748b"}}>No encontramos perfiles con esos filtros.</p>
      )}

      {view === "list" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}>
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.id}`}
              style={{
                textDecoration: "none",
                background: "white",
                borderRadius: 16,
                border: "1px solid rgba(18,33,26,0.08)",
                overflow: "hidden",
                color: INK,
              }}>
              <div
                style={{
                  height: 120,
                  background: `linear-gradient(135deg, ${MAIN}33, ${DARK})`,
                  backgroundImage: p.profile_photo || p.images?.[0]
                    ? `url(${p.profile_photo || p.images[0]})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div style={{padding: 14}}>
                <div style={{fontWeight: 800, fontSize: 16, marginBottom: 4}}>{p.name || "Sin nombre"}</div>
                <div style={{fontSize: 12, color: MAIN, fontWeight: 700, marginBottom: 4}}>
                  {p.profile_type === "PLACE" ? "Lugar" : "Profesional"}
                </div>
                {(p.city || p.street) && (
                  <div style={{fontSize: 13, color: "#64748b"}}>
                    {[p.city, p.street].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({label, active, onClick}: {label: string; active: boolean; onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1.5px solid ${MAIN}` : "1.5px solid rgba(85,131,103,0.2)",
        background: active ? "rgba(85,131,103,0.12)" : "white",
        color: DARK,
        borderRadius: 999,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}>
      {label}
    </button>
  );
}
