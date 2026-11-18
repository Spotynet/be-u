"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {AppShell} from "@/components/layout/AppShell";
import {
  BookingSummaryPanel,
  StickyBookingBar,
} from "@/components/marketplace";
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
import {CustomDropdown} from "@/components/ui/CustomDropdown";

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
  const [selectedService, setSelectedService] = useState<any | null>(null);

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

  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0]);
    }
  }, [services, selectedService]);

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

  const serviceLabel = (svc: any) =>
    svc?.name || svc?.service_name || svc?.service_details?.name || svc?.title || "Servicio";

  const serviceDuration = (svc: any) =>
    svc?.duration_minutes ?? parseDurationMinutes(svc?.time || svc?.duration);

  const servicePrice = (svc: any) => {
    if (svc?.price == null || svc.price === "") return null;
    return `$${svc.price}`;
  };

  const bookService = (svc: any) => {
    if (!providerMeta || !svc) return;
    if (profile?.user && user?.id && Number(profile.user) === Number(user.id)) {
      alert("No puedes reservar en tu propio perfil.");
      return;
    }
    const serviceInstanceId = svc.id;
    const serviceTypeId =
      svc.service_type_id || svc.service || svc.service_details?.id || svc.id;
    const serviceName = serviceLabel(svc);
    const serviceType = providerMeta.isPlace ? "place_service" : "professional_service";
    const price = svc.price ?? "";
    const duration = serviceDuration(svc);

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

  const shareProfile = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({title: profile?.name || "nabbi", url});
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado");
      }
    } catch {
      /* user cancelled */
    }
  };

  const selectedPrice = selectedService ? servicePrice(selectedService) : null;
  const selectedDuration = selectedService ? serviceDuration(selectedService) : null;

  return (
    <AppShell>
      <div className="nabbi-page w-full pb-24 lg:pb-4">
        {!isAuthenticated && (
          <div className="mb-3">
            <Link
              href="/explore"
              className="text-sm font-bold text-primary no-underline">
              ← Explorar
            </Link>
          </div>
        )}

        {loading && <p className="text-foreground-muted">Cargando perfil…</p>}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-600">
            {error}
          </div>
        )}

        {profile && !loading && (
          <>
            {/* Hero */}
            <div className="mb-5 overflow-hidden rounded-2xl border border-card-border bg-card shadow-card">
              <div
                className="h-40 bg-gradient-to-br from-primary to-primary-dark bg-cover bg-center sm:h-52"
                style={{
                  backgroundImage:
                    profile.user_image || profile.images?.[0]
                      ? `url(${profile.user_image || profile.images[0]})`
                      : undefined,
                }}
              />
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-extrabold uppercase tracking-wider text-primary">
                      {profile.profile_type === "PLACE" ? "Lugar" : "Profesional"}
                      {profile.main_category || profile.category
                        ? ` · ${profile.main_category || profile.category}`
                        : ""}
                    </div>
                    <h1 className="m-0 mt-1.5 text-[clamp(1.5rem,4vw,1.85rem)] font-black tracking-tight text-foreground">
                      {profile.name}
                    </h1>
                    {reviews.length > 0 && (
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        ★ {average.toFixed(1)} · {reviews.length} reseñas
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                      onClick={shareProfile}
                      className="rounded-xl border border-card-border bg-card px-3 py-2.5 text-sm font-bold text-foreground">
                      Compartir
                    </button>
                    <button
                      type="button"
                      onClick={handleFavorite}
                      disabled={favoriteBusy}
                      className={[
                        "rounded-xl border px-3.5 py-2.5 text-sm font-extrabold",
                        isFavorite
                          ? "border-rose-400/40 bg-rose-500/10 text-rose-600"
                          : "border-rose-400/35 bg-card text-rose-600",
                      ].join(" ")}>
                      {isFavorite ? "♥ Guardado" : "♡ Guardar"}
                    </button>
                  </div>
                </div>
                {(profile.city || profile.street) && (
                  <p className="mt-2 text-sm text-foreground-muted">
                    {[profile.street, profile.city, profile.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {profile.description && (
                  <p className="mt-3 text-[15px] leading-relaxed text-foreground">
                    {profile.description}
                  </p>
                )}
              </div>
            </div>

            <div className="nabbi-store-layout">
              <div className="min-w-0">
                <h2 className="mb-3 text-lg font-extrabold text-foreground">
                  Servicios
                </h2>
                {services.length === 0 ? (
                  <p className="text-foreground-muted">
                    Este perfil aún no tiene servicios activos.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {services.map((svc) => {
                      const name = serviceLabel(svc);
                      const price = servicePrice(svc);
                      const duration = serviceDuration(svc);
                      const active = selectedService?.id === svc.id;
                      return (
                        <div
                          key={svc.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedService(svc)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedService(svc);
                            }
                          }}
                          className={[
                            "flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-left transition-shadow",
                            active
                              ? "border-primary ring-2 ring-primary/30 shadow-card"
                              : "border-card-border hover:shadow-card-hover",
                          ].join(" ")}>
                          <div className="min-w-0">
                            <div className="text-[16px] font-extrabold text-foreground">
                              {name}
                            </div>
                            <div className="mt-1 text-[13px] text-foreground-muted">
                              {duration} min
                              {price ? ` · ${price}` : ""}
                            </div>
                            {svc.description && (
                              <div className="mt-1.5 text-[13px] text-foreground-secondary">
                                {svc.description}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              bookService(svc);
                            }}
                            className="inline-flex shrink-0 rounded-xl bg-secondary px-4 py-2.5 text-sm font-extrabold text-secondary-foreground">
                            Reservar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hours && (
                  <div className="mt-8">
                    <h2 className="mb-2 text-lg font-extrabold text-foreground">
                      Disponibilidad
                    </h2>
                    <p className="m-0 text-sm text-foreground-muted">
                      Este proveedor tiene horarios configurados. Elige un servicio y
                      reserva para ver horarios libres por día.
                    </p>
                  </div>
                )}

                {groupSessions.length > 0 && (
                  <div className="mt-8">
                    <h2 className="mb-3 text-lg font-extrabold text-foreground">
                      Sesiones grupales
                    </h2>
                    <div className="flex flex-col gap-2">
                      {groupSessions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/group-sessions/${s.id}`}
                          className="block rounded-xl border border-card-border bg-card px-3.5 py-3 text-foreground no-underline">
                          <div className="font-extrabold">
                            {s.service_name || s.service?.name || "Sesión grupal"}
                          </div>
                          <div className="mt-1 text-[13px] text-foreground-muted">
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
                  <div className="mt-8">
                    <h2 className="mb-3 text-lg font-extrabold text-foreground">
                      Equipo
                    </h2>
                    <div className="flex flex-col gap-2">
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
                            className="rounded-xl border border-card-border bg-card px-3.5 py-3">
                            {hrefId ? (
                              <Link
                                href={`/profile/${hrefId}`}
                                className="font-extrabold text-foreground no-underline">
                                {name}
                              </Link>
                            ) : (
                              <span className="font-extrabold text-foreground">
                                {name}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h2 className="mb-2 text-lg font-extrabold text-foreground">
                    Reseñas {reviews.length > 0 ? `· ${average.toFixed(1)}★` : ""}
                  </h2>
                  {reviewsLoading && (
                    <p className="text-foreground-muted">Cargando reseñas…</p>
                  )}
                  {!reviewsLoading && reviews.length === 0 && (
                    <p className="text-sm text-foreground-muted">Aún no hay reseñas.</p>
                  )}
                  <div className="mb-4 flex flex-col gap-2.5">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-card-border bg-card p-3.5">
                        <div className="font-extrabold text-foreground">
                          {"★".repeat(Math.round(Number(r.rating) || 0))}
                          <span className="ml-2 text-[13px] font-semibold text-foreground-muted">
                            {r.from_user_name || r.author_name || "Cliente"}
                          </span>
                        </div>
                        {(r.message || r.comment) && (
                          <p className="mt-2 text-sm leading-relaxed text-foreground">
                            {r.message || r.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {!isOwnProfile && isClientRole(user?.role) && (
                    <form
                      onSubmit={handleReviewSubmit}
                      className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-card p-4">
                      <div className="font-extrabold text-foreground">
                        Escribe una reseña
                      </div>
                      <CustomDropdown
                        label="Calificación"
                        value={reviewRating}
                        onChange={(value) => {
                          if (value !== null) setReviewRating(value);
                        }}
                        options={[5, 4, 3, 2, 1].map((n) => ({
                          value: n,
                          label: `${n} estrellas`,
                        }))}
                        searchable={false}
                        size="md"
                      />
                      <textarea
                        value={reviewMessage}
                        onChange={(e) => setReviewMessage(e.target.value)}
                        rows={3}
                        placeholder="Cuéntanos tu experiencia…"
                        className="rounded-xl border-[1.5px] border-primary/25 p-3 text-sm"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          setReviewImages(Array.from(e.target.files || []).slice(0, 3))
                        }
                      />
                      {reviewError && (
                        <div className="text-[13px] text-error">{reviewError}</div>
                      )}
                      <button
                        type="submit"
                        disabled={reviewBusy}
                        className="nabbi-btn nabbi-btn-primary w-full rounded-xl py-3 disabled:opacity-65">
                        {reviewBusy ? "Enviando…" : "Publicar reseña"}
                      </button>
                    </form>
                  )}
                  {!isOwnProfile && !isAuthenticated && (
                    <Link
                      href={`/login?next=${encodeURIComponent(`/profile/${id}`)}`}
                      className="font-bold text-primary">
                      Inicia sesión para dejar una reseña
                    </Link>
                  )}
                </div>
              </div>

              {/* Desktop sticky rail */}
              <div className="hidden lg:block">
                <BookingSummaryPanel
                  title="Tu reserva"
                  providerName={profile.name}
                  serviceName={
                    selectedService ? serviceLabel(selectedService) : "Elige un servicio"
                  }
                  lines={[
                    ...(selectedDuration != null
                      ? [{label: "Duración", value: `${selectedDuration} min`}]
                      : []),
                    ...(selectedPrice
                      ? [{label: "Precio", value: selectedPrice}]
                      : []),
                  ]}
                  totalValue={selectedPrice || undefined}
                  ctaLabel="Reservar"
                  disabled={!selectedService || isOwnProfile}
                  onConfirm={() => selectedService && bookService(selectedService)}
                />
              </div>
            </div>

            {!isOwnProfile && selectedService && (
              <StickyBookingBar
                priceLabel={selectedPrice || serviceLabel(selectedService)}
                subtitle={`${serviceLabel(selectedService)}${
                  selectedDuration != null ? ` · ${selectedDuration} min` : ""
                }`}
                ctaLabel="Reservar"
                onClick={() => bookService(selectedService)}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
