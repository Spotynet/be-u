import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Linking} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useLocalSearchParams} from "expo-router";
import {useEffect, useMemo, useState} from "react";
import {reservationApi} from "@/lib/api";
import {Location, Reservation} from "@/types/global";
import {parseISODateAsLocal} from "@/lib/dateUtils";
import {useAuth} from "@/features/auth";
import {useNavigation} from "@/hooks/useNavigation";
import ReservationQRCode from "@/components/reservation/ReservationQRCode";
import {ReservationActions} from "@/components/reservation/ReservationActions";
import {BookingLocationView} from "@/components/booking/BookingLocationView";

export default function ReservationDetailsScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {goBack} = useNavigation();
  const {user} = useAuth();

  const params = useLocalSearchParams<{id?: string}>();
  const reservationId = useMemo(() => Number(params.id), [params.id]);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservation = async () => {
    if (!Number.isFinite(reservationId) || reservationId <= 0) {
      setError("Reserva inválida");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await reservationApi.getReservation(reservationId);
      setReservation(res.data);
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || "No se pudo cargar la reserva").toString();
      setError(msg);
      setReservation(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const statusColor = (status?: string) => {
    switch (String(status || "").toUpperCase()) {
      case "CONFIRMED":
        return "#10b981";
      case "PENDING":
        return "#f59e0b";
      case "COMPLETED":
        return "#6b7280";
      case "CANCELLED":
        return "#ef4444";
      case "REJECTED":
        return "#dc2626";
      default:
        return colors.primary;
    }
  };

  const serviceName =
    reservation?.service_details?.name ||
    // fallback for any alternate shapes
    ((reservation as any)?.service_name as string | undefined) ||
    "Servicio";

  const providerLine =
    reservation?.provider_name ||
    reservation?.provider_details?.name ||
    (reservation?.provider_type === "professional"
      ? "Profesional"
      : reservation?.provider_type === "place"
        ? "Establecimiento"
        : "Proveedor");

  const dateLabel =
    reservation?.date
      ? parseISODateAsLocal(reservation.date).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  const timeLabel = reservation?.time ? String(reservation.time).slice(0, 5) : "";
  const endTimeLabel = reservation?.end_time ? String(reservation.end_time).slice(0, 5) : "";

  // Prioritize service_address, then construct from provider details
  const addressLabel = (() => {
    // First, try service_address if available
    if (reservation?.service_address && typeof reservation.service_address === "string" && reservation.service_address.trim()) {
      return reservation.service_address.trim();
    }
    
    // Fallback to constructing from provider details
    const d: any = reservation?.provider_details;
    if (!d) return "";
    
    // Try location.address from provider_details first (from PublicProfile)
    if (d.location?.address && typeof d.location.address === "string" && d.location.address.trim()) {
      const address = d.location.address.trim();
      // Clean up repeated segments (e.g., "Mexico, Mexico" -> "Mexico")
      const parts = address.split(/,\s*/);
      const uniqueParts = [...new Set(parts.filter(p => p.trim()))];
      return uniqueParts.join(", ");
    }
    
    // Fallback to constructing address from individual fields
    const parts: string[] = [];
    if (typeof d.address === "string" && d.address.trim()) parts.push(d.address.trim());
    if (typeof d.city === "string" && d.city.trim()) parts.push(d.city.trim());
    if (typeof d.country === "string" && d.country.trim()) parts.push(d.country.trim());
    
    // Remove duplicates from parts
    const uniqueParts = [...new Set(parts.filter(p => p))];
    return uniqueParts.join(", ");
  })();

  const locationForMap = (() => {
    if (reservation?.service_latitude && reservation?.service_longitude) {
      return {
        latitude: reservation.service_latitude,
        longitude: reservation.service_longitude,
        address: reservation.service_address || addressLabel || undefined,
      } satisfies Location;
    }
    const fallback = (reservation as any)?.provider_details?.location;
    if (fallback?.latitude && fallback?.longitude) {
      return {
        latitude: Number(fallback.latitude),
        longitude: Number(fallback.longitude),
        address: fallback.address || addressLabel || undefined,
      } satisfies Location;
    }
    return null;
  })();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: Math.max(insets.top + 12, 16), borderBottomColor: colors.border}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBack("/(tabs)/perfil")} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Reserva</Text>
        <View style={styles.headerRight}>
          {reservation && (
            <ReservationActions
              reservation={reservation}
              isClient={reservation.client_details?.id === user?.id}
              onUpdated={(updated) => setReservation(updated)}
              onCancelled={() => fetchReservation()}
              variant="header"
            />
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>Cargando reserva...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>No se pudo cargar</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={fetchReservation}
            activeOpacity={0.9}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !reservation ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>Reserva no encontrada</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View style={[styles.summaryCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.summaryTop}>
              <ReservationQRCode code={reservation.code} size={120} showCodeText />
              <View style={[styles.statusBadge, {backgroundColor: statusColor(reservation.status) + "15"}]}>
                <Text style={[styles.statusText, {color: statusColor(reservation.status)}]}>{reservation.status_display}</Text>
              </View>
            </View>
            <Text style={[styles.serviceName, {color: colors.foreground}]}>{serviceName}</Text>
            <Text style={[styles.qrHint, {color: colors.mutedForeground}]}>
              Escanea este código para verificar la reserva
            </Text>
          </View>

          {/* Details */}
          <View style={[styles.sectionCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {reservation.provider_type === "professional" && (
              <View style={styles.prominentBlock}>
                <Text style={[styles.prominentLabel, {color: colors.mutedForeground}]}>Profesional</Text>
                <Text style={[styles.prominentValue, {color: colors.foreground}]} numberOfLines={2}>
                  {providerLine}
                </Text>
              </View>
            )}

            <View style={styles.row}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, {color: colors.mutedForeground}]}>Fecha</Text>
                <Text style={[styles.rowValue, {color: colors.foreground}]}>{dateLabel}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Ionicons name="time" size={18} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, {color: colors.mutedForeground}]}>Hora</Text>
                <Text style={[styles.rowValue, {color: colors.foreground}]}>
                  {timeLabel}
                  {endTimeLabel ? ` - ${endTimeLabel}` : ""}
                </Text>
              </View>
            </View>

            {!!addressLabel && (
              <View style={styles.row}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, {color: colors.mutedForeground}]}>Ubicación</Text>
                  <Text style={[styles.rowValue, {color: colors.foreground}]}>{addressLabel}</Text>
                </View>
              </View>
            )}

            {!!reservation.notes && (
              <View style={styles.row}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, {color: colors.mutedForeground}]}>Notas</Text>
                  <Text style={[styles.rowValue, {color: colors.foreground}]}>{reservation.notes}</Text>
                </View>
              </View>
            )}

            {(reservation.cancellation_reason || reservation.rejection_reason) && (
              <View style={[styles.reasonBox, {backgroundColor: "#ef4444" + "10", borderColor: "#ef4444" + "40"}]}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={[styles.reasonText, {color: "#ef4444"}]}>
                  {reservation.cancellation_reason || reservation.rejection_reason}
                </Text>
              </View>
            )}
          </View>

          <BookingLocationView
            location={locationForMap}
            address={addressLabel}
          />

          {/* Google Calendar */}
          {reservation.calendar_event_created && (
            <TouchableOpacity
              style={[styles.calendarLink, {backgroundColor: "#4285F4" + "10", borderColor: "#4285F4" + "30"}]}
              onPress={() => {
                if (reservation.calendar_event_link) Linking.openURL(reservation.calendar_event_link);
              }}
              activeOpacity={0.8}
              disabled={!reservation.calendar_event_link}>
              <Ionicons name="logo-google" size={16} color="#4285F4" />
              <Text style={[styles.calendarLinkText, {color: "#4285F4"}]}>Evento en Google Calendar</Text>
              {reservation.calendar_event_link ? <Ionicons name="open-outline" size={16} color="#4285F4" /> : null}
            </TouchableOpacity>
          )}

          <View style={{height: 24}} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center"},
  headerTitle: {fontSize: 18, fontWeight: "800"},
  headerRight: {minWidth: 44, alignItems: "flex-end", justifyContent: "center"},
  center: {flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 12},
  loadingText: {fontSize: 14, fontWeight: "600"},
  errorTitle: {fontSize: 18, fontWeight: "800"},
  errorText: {fontSize: 14, textAlign: "center"},
  retryButton: {paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 4},
  retryButtonText: {color: "#fff", fontSize: 14, fontWeight: "800"},
  content: {padding: 16, paddingBottom: 32, gap: 12},
  summaryCard: {padding: 16, borderRadius: 16, borderWidth: 1},
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  statusBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  statusText: {fontSize: 11, fontWeight: "800", textTransform: "uppercase"},
  serviceName: {fontSize: 22, fontWeight: "900", letterSpacing: -0.4},
  qrHint: {fontSize: 12, fontWeight: "600", marginTop: 6},
  sectionCard: {padding: 14, borderRadius: 16, borderWidth: 1, gap: 12},
  prominentBlock: {gap: 4, paddingBottom: 8},
  prominentLabel: {fontSize: 12, fontWeight: "800", letterSpacing: 0.2},
  prominentValue: {fontSize: 20, fontWeight: "900", letterSpacing: -0.2},
  row: {flexDirection: "row", alignItems: "flex-start", gap: 10},
  rowText: {flex: 1, gap: 2},
  rowLabel: {fontSize: 12, fontWeight: "700"},
  rowValue: {fontSize: 14, fontWeight: "700"},
  reasonBox: {flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1},
  reasonText: {flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 18},
  calendarLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  calendarLinkText: {flex: 1, fontSize: 14, fontWeight: "800"},
});


