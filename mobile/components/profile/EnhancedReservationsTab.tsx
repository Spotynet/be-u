import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth";
import {useReservations, useIncomingReservations} from "@/features/reservations";
import {CalendarView, ReservationCard} from "@/components/calendar";
import {Reservation} from "@/types/global";
import {Alert, Platform} from "react-native";
import {parseISODateAsLocal} from "@/lib/dateUtils";
import {linkApi, providerApi, reservationApi} from "@/lib/api";
import {Image} from "react-native";

interface EnhancedReservationsTabProps {
  userRole: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

export function EnhancedReservationsTab({userRole}: EnhancedReservationsTabProps) {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [timeTab, setTimeTab] = useState<"upcoming" | "history">("upcoming");
  const [teamLinks, setTeamLinks] = useState<any[]>([]);
  const [teamFilterProfessionalId, setTeamFilterProfessionalId] = useState<number | "all">("all");
  const [teamReservations, setTeamReservations] = useState<Reservation[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // For clients
  const {
    reservations: clientReservations,
    isLoading: clientLoading,
    error: clientError,
    refreshReservations: refreshClient,
    cancelReservation,
  } = useReservations(user?.id);

  // For providers
  const {
    reservations: providerReservations,
    isLoading: providerLoading,
    error: providerError,
    filter,
    setFilter,
    refreshReservations: refreshProvider,
    confirmReservation,
    rejectReservation,
    completeReservation,
  } = useIncomingReservations();

  const isClient = userRole === "CLIENT";
  const isProvider = userRole === "PROFESSIONAL" || userRole === "PLACE";
  const isPlace = userRole === "PLACE";
  const canManageAsProvider = userRole === "PROFESSIONAL";

  const fetchTeamLinks = async () => {
    try {
      const res = await linkApi.listMyLinks({status: "ACCEPTED"});
      const links = Array.isArray(res.data) ? res.data : [];
      const enriched = await Promise.all(
        links.map(async (l: any) => {
          const publicId = l.professional_public_profile_id || l.professional_id;
          try {
            const prof = await providerApi.getPublicProfile(Number(publicId));
            return {
              ...l,
              user_image: prof.data?.user_image || null,
            };
          } catch {
            return {
              ...l,
              user_image: null,
            };
          }
        })
      );
      setTeamLinks(enriched);
    } catch (e) {
      // non-fatal; still show place's own reservations
      setTeamLinks([]);
    }
  };

  const fetchTeamReservations = async () => {
    try {
      setTeamLoading(true);
      setTeamError(null);

      const params: any = {status: "all"};
      if (teamFilterProfessionalId !== "all") {
        params.provider_type = "professional";
        params.provider_id = teamFilterProfessionalId;
      }

      const res = await reservationApi.getTeamReservations(params);
      setTeamReservations(res.data?.results || []);
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || "Error al cargar reservas del equipo").toString();
      setTeamError(msg);
    } finally {
      setTeamLoading(false);
    }
  };

  // Use real data from API
  const reservations = isClient ? clientReservations : isPlace ? teamReservations : providerReservations;
  const isLoading = isClient ? clientLoading : isPlace ? teamLoading : providerLoading;
  const error = isClient ? clientError : isPlace ? teamError : providerError;
  const refresh = isClient ? refreshClient : isPlace ? fetchTeamReservations : refreshProvider;

  useEffect(() => {
    if (isAuthenticated) {
      if (isClient) {
        refreshClient();
      } else if (isProvider) {
        if (isPlace) {
          fetchTeamLinks();
          fetchTeamReservations();
        } else {
          // Ensure we fetch all statuses; UI splits into Próximas/Historial.
          setFilter("all" as any);
          refreshProvider();
        }
      }
    }
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isPlace) return;
    fetchTeamReservations();
  }, [isAuthenticated, isPlace, teamFilterProfessionalId]);

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = async (id: number) => {
    // On web, fall back to immediate action because Alert buttons can be blocked by the browser
    if (Platform.OS === "web") {
      try {
        await confirmReservation(id);
      } catch (err) {
        // Error handled in hook
      }
      return;
    }

    Alert.alert("Confirmar Reserva", "¿Confirmar esta reserva?", [
      {text: "Cancelar", style: "cancel"},
      {
        text: "Confirmar",
        onPress: async () => {
          try {
            await confirmReservation(id);
          } catch (err) {
            // Error already handled
          }
        },
      },
    ]);
  };

  const handleReject = async (id: number) => {
    // Alert.prompt is not supported on web; use a simple confirm flow there
    if (Platform.OS === "web") {
      try {
        await rejectReservation(id, "");
      } catch (err) {
        // Error handled in hook
      }
      return;
    }

    Alert.prompt(
      "Rechazar Reserva",
      "¿Por qué rechazas esta reserva?",
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Rechazar",
          style: "destructive",
          onPress: async (reason) => {
            try {
              await rejectReservation(id, reason);
            } catch (err) {
              // Error already handled
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleCancel = async (id: number) => {
    Alert.prompt(
      "Cancelar Reserva",
      "¿Por qué cancelas esta reserva? (opcional)",
      [
        {text: "No cancelar", style: "cancel"},
        {
          text: "Cancelar Reserva",
          style: "destructive",
          onPress: async (reason) => {
            try {
              await cancelReservation(id, reason);
            } catch (err) {
              // Error already handled
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleComplete = async (id: number) => {
    Alert.alert("Completar Reserva", "¿Marcar esta reserva como completada?", [
      {text: "Cancelar", style: "cancel"},
      {
        text: "Completar",
        onPress: async () => {
          try {
            await completeReservation(id);
            // Immediately switch to Historial so the user sees it moved.
            setTimeTab("history");
          } catch (err) {
            // Error already handled
          }
        },
      },
    ]);
  };

  const toHHMM = (t?: string) => (t || "").slice(0, 5);

  const parseReservationDateTime = (dateStr: string, timeStr?: string): Date => {
    const d = parseISODateAsLocal(dateStr);
    const hhmm = toHHMM(timeStr);
    const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
    if (Number.isFinite(h) && Number.isFinite(m)) {
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d;
  };

  const isHistoryReservation = (r: any) => {
    const status = String(r.status || "").toUpperCase();
    // If marked as completed/finished, always treat as history so it moves tabs immediately.
    if (status === "COMPLETED" || status === "FINISHED") return true;

    const now = new Date();
    const end = r.end_time
      ? parseReservationDateTime(r.date, r.end_time)
      : parseReservationDateTime(r.date, r.time);
    return end.getTime() < now.getTime();
  };

  // Filter reservations by selected date and Próximas/Historial
  const filteredReservations = reservations.filter((r: any) => {
    if (selectedDate && r.date !== selectedDate) return false;
    return timeTab === "upcoming" ? !isHistoryReservation(r) : isHistoryReservation(r);
  });

  const sortedReservations = timeTab === "upcoming"
    ? [...filteredReservations].sort((a: any, b: any) => {
        const aStart = parseReservationDateTime(a.date, a.time);
        const bStart = parseReservationDateTime(b.date, b.time);
        return aStart.getTime() - bStart.getTime();
      })
    : filteredReservations;

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
          Cargando reservas...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
          Error al cargar reservas
        </Text>
        <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: colors.primary}]}
          onPress={refresh}
          activeOpacity={0.9}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" color={colors.mutedForeground} size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
        {filteredReservations.length === 0 && reservations.length > 0
          ? "No hay reservas con este filtro"
          : "No hay reservas"}
      </Text>
      <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>
        {filteredReservations.length === 0 && reservations.length > 0
          ? "Intenta cambiar el filtro o la fecha para ver más reservas."
          : isClient
          ? "Aún no has hecho ninguna reserva. Explora profesionales y lugares para agendar tu primera cita."
          : "No tienes reservas pendientes. Cuando recibas reservas aparecerán aquí."}
      </Text>
      {isClient && filteredReservations.length === 0 && reservations.length === 0 && (
        <TouchableOpacity
          style={[styles.exploreButton, {backgroundColor: colors.primary}]}
          onPress={() => router.push("/(tabs)/explore")}
          activeOpacity={0.9}>
          <Text style={styles.exploreButtonText}>Explorar Servicios</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Collapsible Calendar Header */}
      <TouchableOpacity
        style={[
          styles.calendarHeader,
          {backgroundColor: colors.card, borderBottomColor: colors.border},
        ]}
        onPress={() => setIsCalendarExpanded(!isCalendarExpanded)}
        activeOpacity={0.7}>
        <View style={styles.calendarHeaderContent}>
          <View style={styles.calendarHeaderLeft}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.calendarHeaderText, {color: colors.foreground}]}>
              {selectedDate ? `Filtrar por fecha: ${selectedDate}` : "Filtrar por fecha"}
            </Text>
          </View>
          <Ionicons
            name={isCalendarExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.mutedForeground}
          />
        </View>
      </TouchableOpacity>

      {/* Expandable Calendar */}
      {isCalendarExpanded && (
        <View style={[styles.calendarContainer, {backgroundColor: colors.card}]}>
          <CalendarView
            reservations={reservations}
            onDayPress={handleDayPress}
            selectedDate={selectedDate}
          />
          {selectedDate && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setSelectedDate(undefined)}
              activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              <Text style={[styles.clearFilterText, {color: colors.mutedForeground}]}>
                Limpiar filtro
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tabs: Próximas / Historial */}
      <View
        style={[
          styles.filterTabs,
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            timeTab === "upcoming" && [styles.filterTabActive, {borderBottomColor: colors.primary}],
          ]}
          onPress={() => setTimeTab("upcoming")}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.filterTabText,
              {color: timeTab === "upcoming" ? colors.primary : colors.mutedForeground},
            ]}>
            Próximas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            timeTab === "history" && [styles.filterTabActive, {borderBottomColor: colors.primary}],
          ]}
          onPress={() => setTimeTab("history")}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.filterTabText,
              {color: timeTab === "history" ? colors.primary : colors.mutedForeground},
            ]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Place: filter by linked professional */}
      {isPlace && (
        <View style={styles.teamFilterWrapper}>
          <ScrollView
            style={styles.teamFilterScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamFilterRow}>
            {/* Todos */}
            <TouchableOpacity
              style={styles.teamFilterItem}
              onPress={() => setTeamFilterProfessionalId("all")}
              activeOpacity={0.8}>
              <View
                style={[
                  styles.teamFilterAvatarRing,
                  {borderColor: teamFilterProfessionalId === "all" ? colors.primary : colors.border},
                ]}>
                <View
                  style={[
                    styles.teamFilterAvatar,
                    {backgroundColor: colors.card, borderColor: colors.background},
                  ]}>
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={teamFilterProfessionalId === "all" ? colors.primary : colors.mutedForeground}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.teamFilterName,
                  {color: teamFilterProfessionalId === "all" ? colors.primary : colors.mutedForeground},
                ]}
                numberOfLines={1}>
                Todos
              </Text>
            </TouchableOpacity>

            {/* Profesionales */}
            {teamLinks.map((l: any) => {
              const selected = teamFilterProfessionalId === l.professional_id;
              const label = String(l.professional_name || "Profesional").split(" ")[0];
              return (
                <TouchableOpacity
                  key={String(l.id)}
                  style={styles.teamFilterItem}
                  onPress={() => setTeamFilterProfessionalId(l.professional_id)}
                  activeOpacity={0.8}>
                  <View
                    style={[
                      styles.teamFilterAvatarRing,
                      {borderColor: selected ? colors.primary : colors.border},
                    ]}>
                    <View
                      style={[
                        styles.teamFilterAvatar,
                        {backgroundColor: colors.card, borderColor: colors.background},
                      ]}>
                      {l.user_image ? (
                        <Image source={{uri: l.user_image}} style={styles.teamFilterAvatarImage} />
                      ) : (
                        <Text style={[styles.teamFilterAvatarText, {color: colors.foreground}]}>
                          {label.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.teamFilterName,
                      {color: selected ? colors.primary : colors.mutedForeground},
                    ]}
                    numberOfLines={1}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          style={styles.content}
          data={sortedReservations}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reservationsList}
          renderItem={({item}) => (
            <ReservationCard
              reservation={item}
              showActions={canManageAsProvider}
              onConfirm={canManageAsProvider ? handleConfirm : undefined}
              onReject={canManageAsProvider ? handleReject : undefined}
              onCancel={isClient ? handleCancel : undefined}
              onComplete={canManageAsProvider && timeTab === "history" ? handleComplete : undefined}
              onPress={() => router.push(`/reservation/${item.id}` as any)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  calendarHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarHeaderText: {
    fontSize: 15,
    fontWeight: "600",
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  filterTabActive: {
    borderBottomWidth: 3,
  },
  filterTabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  teamFilterWrapper: {
    // Prevent vertical stretching on web and avoid huge whitespace.
    maxHeight: 92,
  },
  teamFilterScroll: {
    flexGrow: 0,
  },
  teamFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  teamFilterItem: {
    alignItems: "center",
    width: 64,
  },
  teamFilterAvatarRing: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 2,
    marginBottom: 6,
  },
  teamFilterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  teamFilterAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    resizeMode: "cover",
  },
  teamFilterAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  teamFilterName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  exploreButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  reservationsList: {
    padding: 16,
  },
});
