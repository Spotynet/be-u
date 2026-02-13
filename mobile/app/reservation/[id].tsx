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
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useLocalSearchParams} from "expo-router";
import {useEffect, useMemo, useState} from "react";
import {reservationApi} from "@/lib/api";
import {Location, Reservation} from "@/types/global";
import {parseISODateAsLocal} from "@/lib/dateUtils";
import {useAuth} from "@/features/auth";
import ReservationQRCode from "@/components/reservation/ReservationQRCode";
import {ReservationActions} from "@/components/reservation/ReservationActions";
import {BookingLocationView} from "@/components/booking/BookingLocationView";
import {AppHeader} from "@/components/ui/AppHeader";

export default function ReservationDetailsScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, {backgroundColor: "#F0F1F3"}]}>
      <AppHeader
        title="Detalles de Reserva"
        showBackButton={true}
        backFallbackRoute="/(tabs)/perfil"
        backButtonCircle={true}
        backgroundColor="#FFFFFF"
        borderBottom="rgba(0,0,0,0.08)"
        rightExtra={
          reservation ? (
            <ReservationActions
              reservation={reservation}
              isClient={reservation.client_details?.id === user?.id}
              onUpdated={(updated) => setReservation(updated)}
              onCancelled={() => fetchReservation()}
              variant="header"
            />
          ) : null
        }
      />

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
          {/* Tarjeta superior: QR centrado, badge arriba-derecha, textos centrados */}
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.statusBadge,
                styles.statusBadgePosition,
                {
                  backgroundColor:
                    reservation.status === "CANCELLED" || reservation.status === "REJECTED"
                      ? "#F87171"
                      : statusColor(reservation.status) + "20",
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      reservation.status === "CANCELLED" || reservation.status === "REJECTED"
                        ? "#ffffff"
                        : statusColor(reservation.status),
                  },
                ]}>
                {reservation.status_display}
              </Text>
            </View>
            <View style={styles.summaryCenter}>
              <View style={styles.qrWrapper}>
                <ReservationQRCode
                  code={reservation.code}
                  size={120}
                  showCodeText={false}
                  backgroundColor="#ffffff"
                  foregroundColor="#000000"
                />
              </View>
              <Text style={styles.reservationCode}>{reservation.code}</Text>
              <Text style={styles.serviceName}>{serviceName}</Text>
              <Text style={styles.qrHint}>Escanea este código para verificar la reserva</Text>
            </View>
          </View>

          {/* Tarjeta inferior: profesional + fecha, hora, ubicación con iconos circulares rosa */}
          <View style={styles.sectionCard}>
            {(reservation.provider_type === "professional" || providerLine) && (
              <View style={styles.prominentBlock}>
                <Text style={styles.prominentLabel}>PROFESIONAL</Text>
                <Text style={styles.prominentValue} numberOfLines={2}>
                  {providerLine}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIconCircle}>
                <Ionicons name="calendar-outline" size={20} color="#EC4899" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>FECHA</Text>
                <Text style={styles.rowValue}>{dateLabel}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconCircle}>
                <Ionicons name="time-outline" size={20} color="#EC4899" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>HORA</Text>
                <Text style={styles.rowValue}>
                  {timeLabel}
                  {endTimeLabel ? ` - ${endTimeLabel}` : ""}
                </Text>
              </View>
            </View>

            {!!addressLabel && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="location-outline" size={20} color="#EC4899" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>UBICACIÓN</Text>
                  <Text style={styles.rowValue}>{addressLabel}</Text>
                </View>
              </View>
            )}

            {!!reservation.notes && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="document-text-outline" size={20} color="#EC4899" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>NOTAS</Text>
                  <Text style={styles.rowValue}>{reservation.notes}</Text>
                </View>
              </View>
            )}

            {reservation.status === "CANCELLED" && !!reservation.cancellation_reason && (
              <View style={[styles.reasonBox, {backgroundColor: "#ef4444" + "10", borderColor: "#ef4444" + "40"}]}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <View style={{flex: 1, gap: 4}}>
                  <Text style={[styles.rowLabel, {color: "#ef4444"}]}>Motivo de cancelación</Text>
                  <Text style={[styles.reasonText, {color: "#ef4444"}]}>{reservation.cancellation_reason}</Text>
                </View>
              </View>
            )}
            {reservation.status === "REJECTED" && !!reservation.rejection_reason && (
              <View style={[styles.reasonBox, {backgroundColor: "#ef4444" + "10", borderColor: "#ef4444" + "40"}]}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <View style={{flex: 1, gap: 4}}>
                  <Text style={[styles.rowLabel, {color: "#ef4444"}]}>Motivo de rechazo</Text>
                  <Text style={[styles.reasonText, {color: "#ef4444"}]}>{reservation.rejection_reason}</Text>
                </View>
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

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: {elevation: 3},
});

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 12},
  loadingText: {fontSize: 14, fontWeight: "600"},
  errorTitle: {fontSize: 18, fontWeight: "800"},
  errorText: {fontSize: 14, textAlign: "center"},
  retryButton: {paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 4},
  retryButtonText: {color: "#fff", fontSize: 14, fontWeight: "800"},
  content: {padding: 16, paddingBottom: 32, gap: 16},
  summaryCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    ...cardShadow,
    position: "relative",
  },
  statusBadgePosition: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  summaryCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 156,
    minHeight: 170,
    ...Platform.select({
      ios: {
        shadowColor: "#6b7280",
        shadowOffset: {width: 3, height: 4},
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {elevation: 6},
    }),
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {fontSize: 11, fontWeight: "800", textTransform: "uppercase"},
  reservationCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: 6,
    textAlign: "center",
  },
  serviceName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  qrHint: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    gap: 16,
    ...cardShadow,
  },
  prominentBlock: {gap: 4, paddingBottom: 4},
  prominentLabel: {fontSize: 11, fontWeight: "800", letterSpacing: 0.5, color: "#9ca3af"},
  prominentValue: {fontSize: 18, fontWeight: "800", color: "#1f2937", letterSpacing: -0.2},
  detailRow: {flexDirection: "row", alignItems: "flex-start", gap: 14},
  detailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDF2F8",
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {flex: 1, gap: 2},
  rowLabel: {fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.3},
  rowValue: {fontSize: 14, fontWeight: "600", color: "#1f2937", lineHeight: 20},
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


