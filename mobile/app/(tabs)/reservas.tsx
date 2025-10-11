import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useAuth} from "@/features/auth";
import {useReservations, useIncomingReservations} from "@/features/reservations";
import {CalendarView, DaySchedule, ReservationCard} from "@/components/calendar";
import {useRouter} from "expo-router";
import {Reservation} from "@/types/global";
import {Alert} from "react-native";

export default function Reservas() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const isClient = user?.role === "CLIENT";
  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

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
  }, [isAuthenticated, user?.role]);

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
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  // Separate active and completed
  const activeReservations = filteredReservations.filter((r) =>
    ["PENDING", "CONFIRMED"].includes(r.status)
  );
  const completedReservations = filteredReservations.filter((r) =>
    ["COMPLETED", "CANCELLED", "REJECTED"].includes(r.status)
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>Mis Reservas</Text>
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="calendar-outline" size={80} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Inicia sesión para ver tus reservas
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, {backgroundColor: colors.primary}]}
            onPress={() => router.push("/login")}
            activeOpacity={0.9}>
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state
  if (isLoading && reservations.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>{isClient ? "Mis Reservas" : "Agenda"}</Text>
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando reservas...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <Text style={styles.headerTitle}>{isClient ? "Mis Reservas" : "Mi Agenda"}</Text>
        <View style={styles.headerActions}>
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === "list" && [styles.toggleButtonActive, {backgroundColor: "#ffffff20"}],
              ]}
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}>
              <Ionicons name="list" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === "calendar" && [
                  styles.toggleButtonActive,
                  {backgroundColor: "#ffffff20"},
                ],
              ]}
              onPress={() => setViewMode("calendar")}
              activeOpacity={0.7}>
              <Ionicons name="calendar" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <View style={styles.content}>
          <CalendarView
            reservations={reservations}
            onDayPress={handleDayPress}
            selectedDate={selectedDate}
          />

          {selectedDate && (
            <DaySchedule
              date={selectedDate}
              reservations={filteredReservations}
              onReservationPress={(reservation) => {
                // Could open detail modal here
              }}
            />
          )}
        </View>
      ) : (
        <>
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
                  filter === "PENDING" && [
                    styles.filterTabActive,
                    {borderBottomColor: colors.primary},
                  ],
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

          {/* List View */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredReservations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" color={colors.mutedForeground} size={64} />
                <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay reservas</Text>
                <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>
                  {isClient
                    ? "Tus reservas aparecerán aquí"
                    : "Las solicitudes de reserva aparecerán aquí"}
                </Text>
              </View>
            ) : (
              <View style={styles.reservationsList}>
                {filteredReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    showActions={isProvider}
                    onConfirm={isProvider ? handleConfirm : undefined}
                    onReject={isProvider ? handleReject : undefined}
                    onCancel={isClient ? handleCancel : undefined}
                    onComplete={isProvider ? handleComplete : undefined}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#ffffff15",
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonActive: {},
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
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 15,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  reservationsList: {
    padding: 16,
  },
});
