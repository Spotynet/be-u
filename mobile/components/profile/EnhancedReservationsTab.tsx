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
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth";
import {useReservations, useIncomingReservations} from "@/features/reservations";
import {CalendarView, ReservationCard} from "@/components/calendar";
import {Reservation} from "@/types/global";
import {Alert} from "react-native";

interface EnhancedReservationsTabProps {
  userRole: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

export function EnhancedReservationsTab({userRole}: EnhancedReservationsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  // Mock data for development
  const mockReservations: Reservation[] = [
    {
      id: 1,
      user: 1,
      service: 101,
      service_name: "Corte y Peinado",
      provider_name: "Ana López",
      provider_type: "PROFESSIONAL",
      date: "2024-12-20",
      time: "10:00 AM",
      status: "CONFIRMED",
      duration: "45 min",
      price: 500,
      notes: "Prefiero estilo moderno",
      created_at: "2024-12-15T10:00:00Z",
    },
    {
      id: 2,
      user: 1,
      service: 102,
      service_name: "Color Completo",
      provider_name: "Be-U Spa Premium",
      provider_type: "PLACE",
      date: "2024-12-22",
      time: "2:00 PM",
      status: "PENDING",
      duration: "2 hrs",
      price: 1200,
      notes: "Quiero un tono castaño claro",
      created_at: "2024-12-16T14:00:00Z",
    },
    {
      id: 3,
      user: 1,
      service: 103,
      service_name: "Manicure",
      provider_name: "Sofía Martínez",
      provider_type: "PROFESSIONAL",
      date: "2024-12-18",
      time: "11:30 AM",
      status: "COMPLETED",
      duration: "1 hr",
      price: 350,
      created_at: "2024-12-10T09:00:00Z",
    },
  ];

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

  // Use mock data if no real reservations
  const rawReservations = isClient ? clientReservations : providerReservations;
  const reservations = rawReservations.length > 0 ? rawReservations : mockReservations;
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
  if (isLoading && reservations.length === 0) {
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
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay reservas</Text>
      <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>
        {isClient
          ? "Aún no has hecho ninguna reserva. Explora profesionales y lugares para agendar tu primera cita."
          : "No tienes reservas pendientes. Cuando recibas reservas aparecerán aquí."}
      </Text>
      {isClient && (
        <TouchableOpacity
          style={[styles.exploreButton, {backgroundColor: colors.primary}]}
          onPress={() => router.push("/explore")}>
          <Text style={styles.exploreButtonText}>Explorar</Text>
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
