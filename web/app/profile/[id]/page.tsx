"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {AppShell} from "@/components/layout/AppShell";
import {ContentActions} from "@/components/moderation/ContentActions";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useFavorites, type FavoriteContentType} from "@/features/favorites/hooks/useFavorites";
import {useReviews} from "@/features/reviews/hooks/useReviews";
import {isClientRole} from "@/lib/roles";
import {
  providerApi,
  serviceApi,
  profileCustomizationApi,
  groupSessionApi,
  linkApi,
  type PlaceProfessionalLink,
  errorUtils,
} from "@/lib/api";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";
const ACCENT = "#F6C531";

function parseDurationMinutes(time?: string | number): number {
  if (typeof time === "number" && !Number.isNaN(time)) return time;
  if (!time || typeof time !== "string") return 60;
  const parts = time.split(":").map(Number);
  if (parts.length >= 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  const n = parseInt(time, 10);
  return Number.isNaN(n) ? 60 : n;
}

export default function PublicProfilePage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const {isAuthenticated, user} = useAuth();
  const {isFavorited, toggleFavorite} = useFavorites({autoLoad: isAuthenticated});
  const {
    reviews,
    loading: reviewsLoading,
    average,
    createReview,
    reload: reloadReviews,
  } = useReviews(Number.isFinite(id) ? id : undefined);
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [hours, setHours] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [teamLinks, setTeamLinks] = useState<PlaceProfessionalLink[]>([]);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError("Perfil no válido");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profileRes = await providerApi.getPublicProfile(id);
      const p = profileRes.data;
      setProfile(p);

      const isPlace = (p.profile_type || "").toUpperCase() === "PLACE";
      const providerUserId = p.user || p.user_id;
      const professionalId = p.professional_profile_id;
      const placeId = p.place_profile_id;

      let list: any[] = [];
      try {
        const custom = await profileCustomizationApi.getCustomServices({user: providerUserId});
        const raw = custom.data?.results || (Array.isArray(custom.data) ? custom.data : []);
        list = raw.map((s: any) => ({
          ...s,
          name: s.name || s.service_name || s.service?.name,
          duration_minutes: s.duration_minutes ?? parseDurationMinutes(s.time || s.duration),
        }));
      } catch {
        /* ignore */
      }

      if (list.length === 0) {
        if (isPlace) {
          const placeServices = await serviceApi.getPlaceServices({
            ...(placeId ? {place: placeId} : {user: providerUserId}),
            is_active: true,
          });
          list = (placeServices.data?.results || []).map((s: any) => ({
            ...s,
            name: s.name || s.service_name || s.service?.name,
            duration_minutes: s.duration_minutes ?? parseDurationMinutes(s.time || s.duration),
          }));
        } else {
          const proServices = await serviceApi.getProfessionalServices({
            ...(professionalId ? {professional: professionalId} : {user: providerUserId}),
            is_active: true,
          });
          list = (proServices.data?.results || []).map((s: any) => ({
            ...s,
            name: s.name || s.service_name || s.service?.name,
            duration_minutes: s.duration_minutes ?? parseDurationMinutes(s.time || s.duration),
          }));
        }
      }
      // Prefer active; if none, still show catalog so users can see offerings
      const active = list.filter((s) => s.is_active !== false);
      setServices(active.length > 0 ? active : list);

      try {
        const providerForAvail = isPlace ? placeId : professionalId;
        if (providerForAvail) {
          const avail = await profileCustomizationApi.getPublicAvailability(
            isPlace ? "place" : "professional",
            providerForAvail
          );
          setHours(avail.data);
        } else {
          setHours(null);
        }
      } catch {
        setHours(null);
      }

      try {
        const providerForSessions = isPlace ? placeId : professionalId;
        if (providerForSessions) {
          const today = new Date().toISOString().slice(0, 10);
          const sessionsRes = await groupSessionApi.list({
            provider_type: isPlace ? "place" : "professional",
            provider_id: providerForSessions,
            date_from: today,
          });
          setGroupSessions(sessionsRes.data?.results || []);
        } else {
          setGroupSessions([]);
        }
      } catch {
        setGroupSessions([]);
      }

      try {
        const linksRes = isPlace
          ? await linkApi.listPlaceLinksPublic(id, "ACCEPTED")
          : await linkApi.listProfessionalLinksPublic(id, "ACCEPTED");
        const raw = linksRes.data;
        setTeamLinks(Array.isArray(raw) ? raw : (raw as any)?.results || []);
      } catch {
        setTeamLinks([]);
      }
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const favoriteTarget = useMemo(() => {
    if (!profile) return null;
    const contentType: FavoriteContentType =
      (profile.profile_type || "").toUpperCase() === "PLACE"
        ? "placeprofile"
        : "professionalprofile";
    const objectId = Number(
      contentType === "placeprofile"
        ? profile.place_profile_id
        : profile.professional_profile_id
    );
    if (!objectId) return null;
    return {contentType, objectId};
  }, [profile]);

  useEffect(() => {
    if (favoriteTarget) {
      setIsFavorite(isFavorited(favoriteTarget.contentType, favoriteTarget.objectId));
    }
  }, [favoriteTarget, isFavorited]);

  const providerMeta = useMemo(() => {
    if (!profile) return null;
    const isPlace = (profile.profile_type || "").toUpperCase() === "PLACE";
    const providerId = isPlace
      ? profile.place_profile_id
      : profile.professional_profile_id;
    return {
      isPlace,
      providerId: providerId || profile.id,
      providerName: profile.name || "Proveedor",
      providerType: isPlace ? "place" : "professional",
    };
  }, [profile]);

  const handleFavorite = async () => {
    if (!favoriteTarget) return;
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/profile/${id}`)}`);
      return;
    }
    setFavoriteBusy(true);
    try {
      const result = await toggleFavorite(favoriteTarget.contentType, favoriteTarget.objectId);
      if (typeof result?.is_favorited === "boolean") {
        setIsFavorite(result.is_favorited);
      } else {
        setIsFavorite((v) => !v);
      }
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setFavoriteBusy(false);
    }
  };

  const isOwnProfile =
    !!(profile?.user && user?.id && Number(profile.user) === Number(user.id));

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/profile/${id}`)}`);
      return;
    }
    if (isOwnProfile) {
      setReviewError("No puedes reseñar tu propio perfil.");
      return;
    }
    setReviewBusy(true);
    try {
      await createReview({
        publicProfileId: id,
        rating: reviewRating,
        message: reviewMessage.trim() || undefined,
        images: reviewImages,
      });
      setReviewMessage("");
      setReviewImages([]);
      setReviewRating(5);
      await reloadReviews();
    } catch (err) {
      setReviewError(errorUtils.getErrorMessage(err));
    } finally {
      setReviewBusy(false);
    }
  };

  const bookService = (svc: any) => {
    if (!providerMeta) return;
    if (profile?.user && user?.id && Number(profile.user) === Number(user.id)) {
      alert("No puedes reservar en tu propio perfil.");
      return;
    }
    // Match mobile profile/[id] booking params (backend falls back to CustomService when needed)
    const serviceInstanceId = svc.id;
    const serviceTypeId =
      svc.service_type_id || svc.service || svc.service_details?.id || svc.id;
    const serviceName = svc.name || svc.service_name || svc.service_details?.name || "Servicio";
    const serviceType = providerMeta.isPlace ? "place_service" : "professional_service";
    const price = svc.price ?? "";
    const duration =
      svc.duration_minutes ?? parseDurationMinutes(svc.time || svc.duration);

    const qs = new URLSearchParams({
      serviceInstanceId: String(serviceInstanceId),
      serviceTypeId: String(serviceTypeId),
      serviceName,
      serviceType,
      providerId: String(providerMeta.providerId),
      providerName: providerMeta.providerName,
      price: String(price),
      duration: String(duration),
    });

    const bookingPath = `/booking?${qs.toString()}`;
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(bookingPath)}`);
      return;
    }
    router.push(bookingPath);
  };

  return (
    <AppShell>
      <div className="nabbi-page" style={{maxWidth: 720, margin: "0 auto", width: "100%"}}>
        {!isAuthenticated && (
          <div style={{marginBottom: 12}}>
            <Link href="/explore" style={{color: MAIN, fontWeight: 700, textDecoration: "none", fontSize: 14}}>
              ← Explorar
            </Link>
          </div>
        )}

        {loading && <p style={{color: "#64748b"}}>Cargando perfil…</p>}
        {error && (
          <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626"}}>
            {error}
          </div>
        )}

        {profile && !loading && (
          <>
            <div
              style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid rgba(18,33,26,0.08)",
                overflow: "hidden",
                marginBottom: 20,
              }}>
              <div
                style={{
                  height: 160,
                  background: `linear-gradient(135deg, ${MAIN}, ${DARK})`,
                  backgroundImage: profile.profile_photo || profile.images?.[0]
                    ? `url(${profile.profile_photo || profile.images[0]})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div style={{padding: 20}}>
                <div style={{display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start"}}>
                  <div>
                    <div style={{fontSize: 12, fontWeight: 800, color: MAIN, textTransform: "uppercase", letterSpacing: "0.06em"}}>
                      {profile.profile_type === "PLACE" ? "Lugar" : "Profesional"}
                    </div>
                    <h1 style={{margin: "6px 0 8px", color: INK, fontWeight: 900, fontSize: 28, letterSpacing: "-0.03em"}}>
                      {profile.name}
                    </h1>
                  </div>
                  <div style={{display: "flex", gap: 8, alignItems: "center"}}>
                    {!isOwnProfile && (
                      <ContentActions
                        targetType="profile"
                        targetId={id}
                        authorUserId={Number(profile.user || profile.user_id) || null}
                        loginNext={`/profile/${id}`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleFavorite}
                      disabled={favoriteBusy}
                      style={{
                        border: "1.5px solid rgba(225,29,72,0.35)",
                        background: isFavorite ? "rgba(225,29,72,0.1)" : "white",
                        color: "#e11d48",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontWeight: 800,
                        cursor: "pointer",
                        fontSize: 14,
                      }}>
                      {isFavorite ? "♥ Guardado" : "♡ Guardar"}
                    </button>
                  </div>
                </div>
                {(profile.city || profile.street) && (
                  <p style={{margin: 0, color: "#64748b", fontSize: 14}}>
                    {[profile.street, profile.city, profile.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {profile.description && (
                  <p style={{margin: "14px 0 0", color: DARK, lineHeight: 1.6, fontSize: 15}}>
                    {profile.description}
                  </p>
                )}
              </div>
            </div>

            <h2 style={{color: INK, fontWeight: 800, fontSize: 18, margin: "0 0 12px"}}>Servicios</h2>
            {services.length === 0 ? (
              <p style={{color: "#64748b"}}>Este perfil aún no tiene servicios activos.</p>
            ) : (
              <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                {services.map((svc) => {
                  const name = svc.name || svc.service_name || svc.title || "Servicio";
                  const price = svc.price;
                  const duration =
                    svc.duration_minutes ?? parseDurationMinutes(svc.time || svc.duration);
                  return (
                    <div
                      key={svc.id}
                      style={{
                        background: "white",
                        borderRadius: 14,
                        border: "1px solid rgba(18,33,26,0.08)",
                        padding: 16,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}>
                      <div>
                        <div style={{fontWeight: 800, color: INK, fontSize: 16}}>{name}</div>
                        <div style={{fontSize: 13, color: "#64748b", marginTop: 4}}>
                          {duration} min
                          {price != null && price !== "" ? ` · $${price}` : ""}
                        </div>
                        {svc.description && (
                          <div style={{fontSize: 13, color: "#64748b", marginTop: 6}}>{svc.description}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => bookService(svc)}
                        style={{
                          background: ACCENT,
                          color: INK,
                          border: "none",
                          borderRadius: 12,
                          padding: "10px 18px",
                          fontWeight: 800,
                          fontSize: 14,
                          cursor: "pointer",
                        }}>
                        Reservar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {hours && (
              <div style={{marginTop: 28}}>
                <h2 style={{color: INK, fontWeight: 800, fontSize: 18, margin: "0 0 8px"}}>Disponibilidad</h2>
                <p style={{color: "#64748b", fontSize: 14, margin: 0}}>
                  Este proveedor tiene horarios configurados. Elige un servicio y reserva para ver
                  horarios libres por día.
                </p>
              </div>
            )}

            {groupSessions.length > 0 && (
              <div style={{marginTop: 28}}>
                <h2 style={{color: INK, fontWeight: 800, fontSize: 18, margin: "0 0 12px"}}>
                  Sesiones grupales
                </h2>
                <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                  {groupSessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/group-sessions/${s.id}`}
                      style={{
                        display: "block",
                        background: "white",
                        border: "1px solid rgba(18,33,26,0.08)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        textDecoration: "none",
                        color: INK,
                      }}>
                      <div style={{fontWeight: 800}}>
                        {s.service_name || s.service?.name || "Sesión grupal"}
                      </div>
                      <div style={{fontSize: 13, color: "#64748b", marginTop: 4}}>
                        {s.date} · {String(s.time || "").slice(0, 5)}
                        {s.capacity != null
                          ? ` · ${s.spots_taken ?? 0}/${s.capacity} lugares`
                          : ""}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {teamLinks.length > 0 && (
              <div style={{marginTop: 28}}>
                <h2 style={{color: INK, fontWeight: 800, fontSize: 18, margin: "0 0 12px"}}>
                  Equipo
                </h2>
                <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                  {teamLinks.map((link) => {
                    const isPlaceProfile =
                      (profile.profile_type || "").toUpperCase() === "PLACE";
                    const name = isPlaceProfile
                      ? link.professional_name
                      : link.place_name;
                    const hrefId = isPlaceProfile
                      ? link.professional_public_profile_id
                      : link.place_public_profile_id;
                    return (
                      <div
                        key={link.id}
                        style={{
                          background: "white",
                          border: "1px solid rgba(18,33,26,0.08)",
                          borderRadius: 12,
                          padding: "12px 14px",
                        }}>
                        {hrefId ? (
                          <Link
                            href={`/profile/${hrefId}`}
                            style={{color: INK, fontWeight: 800, textDecoration: "none"}}>
                            {name}
                          </Link>
                        ) : (
                          <span style={{fontWeight: 800, color: INK}}>{name}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{marginTop: 32}}>
              <h2 style={{color: INK, fontWeight: 800, fontSize: 18, margin: "0 0 8px"}}>
                Reseñas {reviews.length > 0 ? `· ${average.toFixed(1)}★` : ""}
              </h2>
              {reviewsLoading && <p style={{color: "#64748b"}}>Cargando reseñas…</p>}
              {!reviewsLoading && reviews.length === 0 && (
                <p style={{color: "#64748b", fontSize: 14}}>Aún no hay reseñas.</p>
              )}
              <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 16}}>
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: "white",
                      borderRadius: 14,
                      border: "1px solid rgba(18,33,26,0.08)",
                      padding: 14,
                    }}>
                    <div style={{fontWeight: 800, color: INK}}>
                      {"★".repeat(Math.round(Number(r.rating) || 0))}
                      <span style={{color: "#94a3b8", fontWeight: 600, marginLeft: 8, fontSize: 13}}>
                        {r.from_user_name || r.author_name || "Cliente"}
                      </span>
                    </div>
                    {(r.message || r.comment) && (
                      <p style={{margin: "8px 0 0", color: DARK, fontSize: 14, lineHeight: 1.5}}>
                        {r.message || r.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {!isOwnProfile && isClientRole(user?.role) && (
                <form
                  onSubmit={handleReviewSubmit}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid rgba(18,33,26,0.08)",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                  <div style={{fontWeight: 800, color: INK}}>Escribe una reseña</div>
                  <label style={{fontSize: 13, fontWeight: 700, color: DARK}}>
                    Calificación
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      style={{display: "block", marginTop: 6, width: "100%", padding: 10, borderRadius: 10, border: "1.5px solid rgba(85,131,103,0.22)"}}>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} estrellas
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    rows={3}
                    placeholder="Cuéntanos tu experiencia…"
                    style={{padding: 12, borderRadius: 12, border: "1.5px solid rgba(85,131,103,0.22)", fontSize: 14, resize: "vertical"}}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setReviewImages(Array.from(e.target.files || []).slice(0, 3))}
                  />
                  {reviewError && <div style={{color: "#dc2626", fontSize: 13}}>{reviewError}</div>}
                  <button
                    type="submit"
                    disabled={reviewBusy}
                    style={{
                      background: MAIN,
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 0",
                      fontWeight: 800,
                      cursor: "pointer",
                      opacity: reviewBusy ? 0.65 : 1,
                    }}>
                    {reviewBusy ? "Enviando…" : "Publicar reseña"}
                  </button>
                </form>
              )}
              {!isOwnProfile && !isAuthenticated && (
                <Link href={`/login?next=${encodeURIComponent(`/profile/${id}`)}`} style={{color: MAIN, fontWeight: 700}}>
                  Inicia sesión para dejar una reseña
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
