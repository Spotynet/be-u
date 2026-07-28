import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
  TouchableOpacity,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useLocalSearchParams} from "expo-router";
import {useEffect, useMemo, useState} from "react";
import {reservationApi, trackingApi, groupSessionApi, type GroupSessionParticipant} from "@/lib/api";
import {Location, Reservation} from "@/types/global";
import {parseISODateAsLocal} from "@/lib/dateUtils";
import {useAuth} from "@/features/auth";
import ReservationQRCode from "@/components/reservation/ReservationQRCode";
import {ReservationActions} from "@/components/reservation/ReservationActions";
import {BookingLocationView} from "@/components/booking/BookingLocationView";
import {AppHeader} from "@/components/ui/AppHeader";
import * as LocationExpo from "expo-location";

// ── Status helpers ────────────────────────────────────────────────────────────
function statusColor(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "CONFIRMED":  return "#10b981";
    case "PENDING":    return "#f59e0b";
    case "COMPLETED":  return "#6b7280";
    case "CANCELLED":  return "#ef4444";
    case "REJECTED":   return "#dc2626";
    default:           return "#6b7280";
  }
}

function statusLabel(display?: string, status?: string) {
  if (display) return display;
  switch (String(status || "").toUpperCase()) {
    case "CONFIRMED":  return "Confirmada";
    case "PENDING":    return "Pendiente";
    case "COMPLETED":  return "Completada";
    case "CANCELLED":  return "Cancelada";
    case "REJECTED":   return "Rechazada";
    default:           return "—";
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({children, style}: {children: React.ReactNode; style?: any}) {
  return <View style={[sc.card, style]}>{children}</View>;
}

function InfoRow({
  icon, label, value, colors, last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: any;
  last?: boolean;
}) {
  return (
    <>
      <View style={sc.infoRow}>
        <View style={[sc.iconWrap, {backgroundColor: colors.primary + "14"}]}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <View style={sc.infoText}>
          <Text style={[sc.infoLabel, {color: colors.mutedForeground}]}>{label}</Text>
          <Text style={[sc.infoValue, {color: colors.foreground}]}>{value}</Text>
        </View>
      </View>
      {!last && <View style={[sc.divider, {backgroundColor: colors.border}]} />}
    </>
  );
}

export default function ReservationDetailsScreen() {
  const {colors} = useThemeVariant();
  const {user}   = useAuth();

  const params        = useLocalSearchParams<{id?: string}>();
  const reservationId = useMemo(() => Number(params.id), [params.id]);

  const [reservation,          setReservation]          = useState<Reservation | null>(null);
  const [isLoading,            setIsLoading]            = useState(true);
  const [error,                setError]                = useState<string | null>(null);
  const [trackingRequest,      setTrackingRequest]      = useState<any | null>(null);
  const [trackingBusy,         setTrackingBusy]         = useState(false);
  const [participants,         setParticipants]         = useState<GroupSessionParticipant[]>([]);
  const [loadingParticipants,  setLoadingParticipants]  = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchReservation = async () => {
    if (!Number.isFinite(reservationId) || reservationId <= 0) {
      setError("Reserva inválida"); setIsLoading(false); return;
    }
    try {
      setIsLoading(true); setError(null);
      const res = await reservationApi.getReservation(reservationId);
      setReservation(res.data);
    } catch (e: any) {
      setError((e?.response?.data?.error || e?.message || "No se pudo cargar la reserva").toString());
      setReservation(null);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchReservation(); }, [reservationId]);

  useEffect(() => {
    const gsId = reservation?.group_session;
    const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";
    if (!gsId || !isProvider) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingParticipants(true);
        const res = await groupSessionApi.participants(Number(gsId));
        if (mounted) setParticipants(res.data.results);
      } catch { /* 403 for non-owners */ } finally { if (mounted) setLoadingParticipants(false); }
    })();
    return () => { mounted = false; };
  }, [reservation?.group_session, user?.role]);

  useEffect(() => {
    let mounted = true;
    if (!Number.isFinite(reservationId) || reservationId <= 0 || !user) return;
    (async () => {
      try {
        const response = await trackingApi.list();
        const rows  = response.data?.results || [];
        const active = rows.find(
          (row: any) => row.reservation === reservationId &&
            ["PENDING", "ACCEPTED"].includes(String(row.status || "").toUpperCase())
        );
        if (mounted) setTrackingRequest(active || null);
      } catch { if (mounted) setTrackingRequest(null); }
    })();
    return () => { mounted = false; };
  }, [reservationId, user?.id]);

  // Live location ping (client)
  useEffect(() => {
    if (!trackingRequest?.id || trackingRequest.status !== "ACCEPTED" || !user) return;
    if (reservation?.client_details?.id !== user.id) return;
    let subscription: LocationExpo.LocationSubscription | null = null;
    (async () => {
      const perm = await LocationExpo.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") return;
      subscription = await LocationExpo.watchPositionAsync(
        {accuracy: LocationExpo.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 15},
        async (pos) => {
          try {
            await trackingApi.ping(trackingRequest.id, {
              latitude:        pos.coords.latitude,
              longitude:       pos.coords.longitude,
              accuracy_meters: pos.coords.accuracy || undefined,
            });
          } catch { /* silent */ }
        }
      );
    })();
    return () => { subscription?.remove(); };
  }, [trackingRequest?.id, trackingRequest?.status, reservation?.client_details?.id, user?.id]);

  // Provider polls tracking status
  useEffect(() => {
    if (!trackingRequest?.id || !user) return;
    const isProvider = (user?.role === "PROFESSIONAL" || user?.role === "PLACE") &&
      reservation?.client_details?.id !== user?.id;
    if (!isProvider) return;
    const s = String(trackingRequest?.status || "").toUpperCase();
    if (!["PENDING", "ACCEPTED"].includes(s)) return;
    const id = setInterval(async () => {
      try { const r = await trackingApi.status(trackingRequest.id); setTrackingRequest(r.data); }
      catch { /* silent */ }
    }, 8000);
    return () => clearInterval(id);
  }, [trackingRequest?.id, trackingRequest?.status, reservation?.client_details?.id, user?.id, user?.role]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const serviceName = reservation?.service_details?.name ||
    ((reservation as any)?.service_name as string | undefined) || "Servicio";

  const providerLine = reservation?.provider_name ||
    reservation?.provider_details?.name ||
    (reservation?.provider_type === "professional" ? "Profesional"
      : reservation?.provider_type === "place"       ? "Establecimiento"
      : "Proveedor");

  const dateLabel = reservation?.date
    ? parseISODateAsLocal(reservation.date).toLocaleDateString("es-MX", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "";

  const timeLabel    = reservation?.time     ? String(reservation.time).slice(0, 5)     : "";
  const endTimeLabel = reservation?.end_time ? String(reservation.end_time).slice(0, 5) : "";
  const timeRange    = timeLabel + (endTimeLabel ? ` — ${endTimeLabel}` : "");

  const addressLabel = (() => {
    if (reservation?.service_address?.trim()) return reservation.service_address.trim();
    const d: any = reservation?.provider_details;
    if (!d) return "";
    if (d.location?.address?.trim()) {
      const parts = d.location.address.trim().split(/,\s*/);
      return [...new Set(parts.filter((p: string) => p.trim()))].join(", ");
    }
    const parts: string[] = [];
    if (typeof d.address === "string" && d.address.trim()) parts.push(d.address.trim());
    if (typeof d.city    === "string" && d.city.trim())    parts.push(d.city.trim());
    if (typeof d.country === "string" && d.country.trim()) parts.push(d.country.trim());
    return [...new Set(parts)].join(", ");
  })();

  const locationForMap: Location | null = (() => {
    if (trackingRequest?.latest_latitude != null && trackingRequest?.latest_longitude != null) {
      return {
        latitude:  Number(trackingRequest.latest_latitude),
        longitude: Number(trackingRequest.latest_longitude),
        address:   "Ubicación en vivo del cliente",
      };
    }
    if (reservation?.service_latitude && reservation?.service_longitude) {
      return {
        latitude:  reservation.service_latitude,
        longitude: reservation.service_longitude,
        address:   reservation.service_address || addressLabel || undefined,
      };
    }
    const fb = (reservation as any)?.provider_details?.location;
    if (fb?.latitude && fb?.longitude) {
      return {latitude: Number(fb.latitude), longitude: Number(fb.longitude), address: fb.address || addressLabel || undefined};
    }
    return null;
  })();

  const sColor = statusColor(reservation?.status);
  const isClientReservation  = reservation?.client_details?.id === user?.id;
  const isProviderReservation = (user?.role === "PROFESSIONAL" || user?.role === "PLACE") && !isClientReservation;

  // ── States ────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <View style={[s.flex, {backgroundColor: colors.background}]}>
      <AppHeader title="Detalles de Reserva" showBackButton backFallbackRoute="/(tabs)/perfil" backButtonCircle />
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[s.hint, {color: colors.mutedForeground}]}>Cargando reserva…</Text>
      </View>
    </View>
  );

  if (error || !reservation) return (
    <View style={[s.flex, {backgroundColor: colors.background}]}>
      <AppHeader title="Detalles de Reserva" showBackButton backFallbackRoute="/(tabs)/perfil" backButtonCircle />
      <View style={s.center}>
        <View style={[s.errorIcon, {backgroundColor: "#ef4444" + "14"}]}>
          <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
        </View>
        <Text style={[s.errorTitle, {color: colors.foreground}]}>
          {error ? "No se pudo cargar" : "Reserva no encontrada"}
        </Text>
        {!!error && <Text style={[s.errorBody, {color: colors.mutedForeground}]}>{error}</Text>}
        {!!error && (
          <TouchableOpacity style={[s.retryBtn, {backgroundColor: colors.primary}]} onPress={fetchReservation} activeOpacity={0.85}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.flex, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Detalles de Reserva"
        showBackButton
        backFallbackRoute="/(tabs)/perfil"
        backButtonCircle
      />

      <ScrollView
        contentContainerStyle={[s.scroll, {paddingBottom: 40}]}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <SectionCard style={{borderColor: colors.border}}>
          {/* Status pill */}
          <View style={s.heroTop}>
            <View style={[s.statusPill, {backgroundColor: sColor + "18", borderColor: sColor + "35"}]}>
              <View style={[s.statusDot, {backgroundColor: sColor}]} />
              <Text style={[s.statusText, {color: sColor}]}>
                {statusLabel(reservation.status_display, reservation.status)}
              </Text>
            </View>
          </View>

          {/* QR */}
          <View style={s.qrSection}>
            <View style={[s.qrFrame, {backgroundColor: "#fff", borderColor: colors.border}]}>
              <ReservationQRCode
                code={reservation.code}
                size={112}
                showCodeText={false}
                backgroundColor="#ffffff"
                foregroundColor="#000000"
              />
            </View>
            <Text style={[s.reservationCode, {color: colors.mutedForeground}]}>
              {reservation.code}
            </Text>
          </View>

          {/* Service & provider */}
          <View style={s.heroBottom}>
            <Text style={[s.serviceName, {color: colors.foreground}]} numberOfLines={2}>
              {serviceName}
            </Text>
            <Text style={[s.providerName, {color: colors.mutedForeground}]}>
              {providerLine}
            </Text>
          </View>
        </SectionCard>

        {/* ── Details card ──────────────────────────────────────────────────── */}
        <SectionCard style={{borderColor: colors.border}}>
          {!!dateLabel && (
            <InfoRow icon="calendar-outline" label="Fecha" value={dateLabel} colors={colors} />
          )}
          {!!timeRange && (
            <InfoRow icon="time-outline" label="Hora" value={timeRange} colors={colors} />
          )}
          {!!addressLabel && (
            <InfoRow icon="location-outline" label="Ubicación" value={addressLabel} colors={colors} />
          )}
          {!!reservation.notes && (
            <InfoRow icon="document-text-outline" label="Notas" value={reservation.notes} colors={colors} last />
          )}
          {!reservation.notes && !!(dateLabel || timeRange || addressLabel) && null}
        </SectionCard>

        {/* ── Cancellation / rejection reason ───────────────────────────────── */}
        {reservation.status === "CANCELLED" && !!reservation.cancellation_reason && (
          <SectionCard style={{borderColor: "#ef4444" + "35", backgroundColor: "#ef4444" + "08"}}>
            <View style={s.reasonRow}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <View style={{flex: 1}}>
                <Text style={[s.reasonLabel, {color: "#ef4444"}]}>Motivo de cancelación</Text>
                <Text style={[s.reasonBody, {color: "#ef4444" + "cc"}]}>{reservation.cancellation_reason}</Text>
              </View>
            </View>
          </SectionCard>
        )}
        {reservation.status === "REJECTED" && !!reservation.rejection_reason && (
          <SectionCard style={{borderColor: "#dc2626" + "35", backgroundColor: "#dc2626" + "08"}}>
            <View style={s.reasonRow}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <View style={{flex: 1}}>
                <Text style={[s.reasonLabel, {color: "#dc2626"}]}>Motivo de rechazo</Text>
                <Text style={[s.reasonBody, {color: "#dc2626" + "cc"}]}>{reservation.rejection_reason}</Text>
              </View>
            </View>
          </SectionCard>
        )}

        {/* ── Reservation actions ────────────────────────────────────────────── */}
        {(reservation.status === "PENDING" || reservation.status === "CONFIRMED") &&
          (isClientReservation || isProviderReservation) && (
          <SectionCard style={{borderColor: colors.border}}>
            <ReservationActions
              reservation={reservation}
              isClient={isClientReservation}
              isProvider={isProviderReservation}
              onUpdated={(updated) => setReservation(updated)}
              onCancelled={fetchReservation}
              variant="body"
            />
          </SectionCard>
        )}

        {/* ── Live tracking ──────────────────────────────────────────────────── */}
        {(isClientReservation || isProviderReservation) && (
          <SectionCard style={{borderColor: colors.border}}>
            {/* Header row */}
            <View style={s.trackingHeader}>
              <View style={[s.iconWrapSm, {backgroundColor: colors.primary + "14"}]}>
                <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              </View>
              <View style={{flex: 1}}>
                <Text style={[s.cardSectionLabel, {color: colors.mutedForeground}]}>TRACKING EN VIVO</Text>
                <Text style={[s.trackingStatus, {color: colors.foreground}]}>
                  {trackingRequest
                    ? trackingRequest.status === "PENDING"
                      ? "Solicitud enviada — esperando respuesta"
                      : trackingRequest.status === "ACCEPTED"
                        ? "Tracking activo"
                        : `Tracking ${String(trackingRequest.status).toLowerCase()}`
                    : "Sin tracking activo"}
                </Text>
              </View>
              {trackingRequest?.status === "ACCEPTED" && (
                <View style={[s.livePill, {backgroundColor: "#10b981" + "18", borderColor: "#10b981" + "40"}]}>
                  <View style={[s.liveDot, {backgroundColor: "#10b981"}]} />
                  <Text style={[s.liveText, {color: "#10b981"}]}>LIVE</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={s.trackingActions}>
              {isProviderReservation && !trackingRequest && (
                <TouchableOpacity
                  style={[s.trackBtn, {backgroundColor: colors.primary}]}
                  disabled={trackingBusy}
                  activeOpacity={0.85}
                  onPress={async () => {
                    try {
                      setTrackingBusy(true);
                      const r = await trackingApi.request(reservation.id);
                      setTrackingRequest(r.data);
                    } catch (e: any) {
                      setError(String(e?.response?.data?.error || e?.message || "No se pudo iniciar tracking"));
                    } finally { setTrackingBusy(false); }
                  }}>
                  {trackingBusy
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Ionicons name="navigate" size={15} color="#fff" /><Text style={s.trackBtnText}>Solicitar ubicación</Text></>
                  }
                </TouchableOpacity>
              )}
              {trackingRequest && ["PENDING", "ACCEPTED"].includes(String(trackingRequest.status || "").toUpperCase()) && (
                <TouchableOpacity
                  style={[s.trackBtn, {backgroundColor: "#ef4444"}]}
                  activeOpacity={0.85}
                  onPress={async () => {
                    try { await trackingApi.stop(trackingRequest.id); setTrackingRequest(null); }
                    catch { /* silent */ }
                  }}>
                  <Ionicons name="stop-circle-outline" size={15} color="#fff" />
                  <Text style={s.trackBtnText}>Detener tracking</Text>
                </TouchableOpacity>
              )}
            </View>
          </SectionCard>
        )}

        {/* ── Map ───────────────────────────────────────────────────────────── */}
        <BookingLocationView location={locationForMap} address={addressLabel} />

        {/* ── Group session participants ─────────────────────────────────────── */}
        {reservation.group_session != null &&
          (user?.role === "PROFESSIONAL" || user?.role === "PLACE") && (
          <SectionCard style={{borderColor: colors.border}}>
            {/* Header */}
            <View style={s.participantsHeader}>
              <View style={[s.iconWrapSm, {backgroundColor: colors.primary + "14"}]}>
                <Ionicons name="people-outline" size={16} color={colors.primary} />
              </View>
              <View style={{flex: 1}}>
                <Text style={[s.cardSectionLabel, {color: colors.mutedForeground}]}>PARTICIPANTES</Text>
                <Text style={[s.participantCount, {color: colors.foreground}]}>
                  {reservation.group_session_details
                    ? `${reservation.group_session_details.booked_slots} / ${reservation.group_session_details.capacity} cupos`
                    : `${participants.length} reservados`}
                </Text>
              </View>
              {loadingParticipants && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {!loadingParticipants && participants.length === 0 && (
              <Text style={[s.participantEmpty, {color: colors.mutedForeground}]}>
                Aún no hay reservas confirmadas.
              </Text>
            )}

            {participants.length > 0 && (
              <View style={[s.participantList, {borderTopColor: colors.border}]}>
                {participants.map((p, idx) => {
                  const isLast = idx === participants.length - 1;
                  const pColor = p.status === "CONFIRMED" ? "#10b981" : "#f59e0b";
                  const initial = (p.client_name?.[0] ?? "?").toUpperCase();
                  return (
                    <View key={p.id} style={[s.participantRow, !isLast && {borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth}]}>
                      <View style={[s.avatar, {backgroundColor: colors.primary + "20"}]}>
                        <Text style={[s.avatarText, {color: colors.primary}]}>{initial}</Text>
                      </View>
                      <View style={s.participantInfo}>
                        <Text style={[s.participantName, {color: colors.foreground}]}>
                          {p.client_name || p.client_email}
                        </Text>
                        {!!p.client_phone && <Text style={[s.participantSub, {color: colors.mutedForeground}]}>{p.client_phone}</Text>}
                        {!!p.client_email && <Text style={[s.participantSub, {color: colors.mutedForeground}]}>{p.client_email}</Text>}
                        {!!p.notes        && <Text style={[s.participantSub, {color: colors.mutedForeground}]}>Nota: {p.notes}</Text>}
                      </View>
                      <View style={[s.participantPill, {backgroundColor: pColor + "16", borderColor: pColor + "35"}]}>
                        <Text style={[s.participantPillText, {color: pColor}]}>
                          {p.status === "CONFIRMED" ? "Confirmado" : p.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </SectionCard>
        )}

        {/* ── Google Calendar ────────────────────────────────────────────────── */}
        {reservation.calendar_event_created && (
          <TouchableOpacity
            style={[s.calCard, {borderColor: "#4285F4" + "30", backgroundColor: "#4285F4" + "08"}]}
            onPress={() => { if (reservation.calendar_event_link) Linking.openURL(reservation.calendar_event_link); }}
            activeOpacity={0.8}
            disabled={!reservation.calendar_event_link}>
            <View style={[s.iconWrapSm, {backgroundColor: "#4285F4" + "18"}]}>
              <Ionicons name="logo-google" size={16} color="#4285F4" />
            </View>
            <Text style={[s.calText, {color: "#4285F4"}]}>Ver en Google Calendar</Text>
            {reservation.calendar_event_link && (
              <Ionicons name="arrow-forward" size={15} color="#4285F4" />
            )}
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

// ── Shared card shadow ─────────────────────────────────────────────────────────
const cardShadow = Platform.select({
  ios:     {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.055, shadowRadius: 10},
  android: {elevation: 2},
}) ?? {};

// ── SectionCard styles ─────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    ...cardShadow,
  },
  infoRow:   {flexDirection: "row", alignItems: "flex-start", gap: 14},
  iconWrap:  {width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center"},
  infoText:  {flex: 1, gap: 2},
  infoLabel: {fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase"},
  infoValue: {fontSize: 14, fontWeight: "600", lineHeight: 20},
  divider:   {height: StyleSheet.hairlineWidth, marginLeft: 50},
});

// ── Page-level styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: {flex: 1},

  // Loading / error
  center:     {flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14},
  errorIcon:  {width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center"},
  errorTitle: {fontSize: 17, fontWeight: "700", textAlign: "center"},
  errorBody:  {fontSize: 14, textAlign: "center", lineHeight: 20},
  hint:       {fontSize: 14, marginTop: 6},
  retryBtn:   {marginTop: 4, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12},
  retryText:  {color: "#fff", fontSize: 14, fontWeight: "700"},

  // Scroll
  scroll: {padding: 16, gap: 12},

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroTop: {alignItems: "flex-start"},
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDot:  {width: 6, height: 6, borderRadius: 3},
  statusText: {fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4},

  qrSection: {alignItems: "center", gap: 10, paddingVertical: 4},
  qrFrame: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios:     {shadowColor: "#000", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.10, shadowRadius: 12},
      android: {elevation: 4},
    }),
  },
  reservationCode: {fontSize: 12, fontWeight: "600", letterSpacing: 1.2},

  heroBottom: {alignItems: "center", gap: 4},
  serviceName:{fontSize: 22, fontWeight: "800", letterSpacing: -0.4, textAlign: "center", lineHeight: 28},
  providerName:{fontSize: 14, fontWeight: "500", textAlign: "center"},

  // ── Reason card ─────────────────────────────────────────────────────────────
  reasonRow:   {flexDirection: "row", alignItems: "flex-start", gap: 10},
  reasonLabel: {fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 2},
  reasonBody:  {fontSize: 13, fontWeight: "500", lineHeight: 18},

  // ── Tracking ─────────────────────────────────────────────────────────────────
  trackingHeader: {flexDirection: "row", alignItems: "center", gap: 12},
  iconWrapSm: {width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center"},
  cardSectionLabel: {fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 1},
  trackingStatus: {fontSize: 14, fontWeight: "600"},
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1,
  },
  liveDot:  {width: 5, height: 5, borderRadius: 3},
  liveText: {fontSize: 10, fontWeight: "800", letterSpacing: 0.6},
  trackingActions: {flexDirection: "row", gap: 10, flexWrap: "wrap"},
  trackBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  trackBtnText: {color: "#fff", fontSize: 13, fontWeight: "700"},

  // ── Participants ──────────────────────────────────────────────────────────────
  participantsHeader: {flexDirection: "row", alignItems: "center", gap: 12},
  participantCount: {fontSize: 14, fontWeight: "600"},
  participantEmpty: {fontSize: 13, fontStyle: "italic"},
  participantList: {borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 4},
  participantRow: {flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12},
  avatar: {width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center"},
  avatarText: {fontSize: 15, fontWeight: "700"},
  participantInfo: {flex: 1, gap: 2},
  participantName: {fontSize: 14, fontWeight: "700"},
  participantSub:  {fontSize: 12},
  participantPill: {
    alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  participantPillText: {fontSize: 11, fontWeight: "700"},

  // ── Google Calendar ───────────────────────────────────────────────────────────
  calCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  calText: {flex: 1, fontSize: 14, fontWeight: "700"},
});
