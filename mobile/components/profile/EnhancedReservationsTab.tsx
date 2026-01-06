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

  // Use real data from API
  const reservations = isClient ? clientReservations : providerReservations;
  const isLoading = isClient ? clientLoading : providerLoading;
  const error = isClient ? clientError : providerError;

  useEffect(() => {
    if (isAuthenticated) {
      if (isClient) {
        refreshClient();
      } else if (isProvider) {
        refreshProvider();
      }
    }
  }, [isAuthenticated, userRole]);

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
          } catch (err) {
            // Error already handled
          }
        },
      },
    ]);
  };

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    if (selectedDate && r.date !== selectedDate) return false;
    if (filter !== "all" && r.status !== filter) return false;
    return true;
  });

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
          onPress={isClient ? refreshClient : refreshProvider}
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

      {/* Status Filter Tabs (for providers) */}
      {isProvider && (
        <View
          style={[
            styles.filterTabs,
            {backgroundColor: colors.background, borderBottomColor: colors.border},
          ]}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "all" && [styles.filterTabActive, {borderBottomColor: colors.primary}],
            ]}
            onPress={() => setFilter("all")}>
            <Text
              style={[
                styles.filterTabText,
                {color: filter === "all" ? colors.primary : colors.mutedForeground},
              ]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "PENDING" && [styles.filterTabActive, {borderBottomColor: colors.primary}],
            ]}
            onPress={() => setFilter("PENDING")}>
            <Text
              style={[
                styles.filterTabText,
                {color: filter === "PENDING" ? colors.primary : colors.mutedForeground},
              ]}>
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "CONFIRMED" && [
                styles.filterTabActive,
                {borderBottomColor: colors.primary},
              ],
            ]}
            onPress={() => setFilter("CONFIRMED")}>
            <Text
              style={[
                styles.filterTabText,
                {color: filter === "CONFIRMED" ? colors.primary : colors.mutedForeground},
              ]}>
              Confirmadas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          style={styles.content}
          data={filteredReservations}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reservationsList}
          renderItem={({item}) => (
            <ReservationCard
              reservation={item}
              showActions={isProvider}
              onConfirm={isProvider ? handleConfirm : undefined}
              onReject={isProvider ? handleReject : undefined}
              onCancel={isClient ? handleCancel : undefined}
              onComplete={isProvider ? handleComplete : undefined}
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
