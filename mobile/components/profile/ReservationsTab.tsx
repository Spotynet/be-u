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
import {useRouter} from "expo-router";

interface ReservationsTabProps {
  userRole: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

interface Reservation {
  id: number;
  code: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
  provider_name?: string;
  client_name?: string;
}

export function ReservationsTab({userRole}: ReservationsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    fetchReservations();
  }, [activeFilter]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual API call
      // For now, show placeholder
      setReservations([]);
    } catch (err) {
      console.error("Error fetching reservations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "#FFA500";
      case "CONFIRMED":
        return "#22c55e";
      case "COMPLETED":
        return "#3b82f6";
      case "CANCELLED":
      case "REJECTED":
        return "#ef4444";
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "Pendiente";
      case "CONFIRMED":
        return "Confirmada";
      case "COMPLETED":
        return "Completada";
      case "CANCELLED":
        return "Cancelada";
      case "REJECTED":
        return "Rechazada";
      default:
        return status;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" color={colors.mutedForeground} size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay reservas</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
        {userRole === "CLIENT"
          ? "Aún no has hecho ninguna reserva. Explora profesionales y lugares para agendar tu primera cita."
          : "No tienes reservas pendientes. Cuando recibas reservas aparecerán aquí."}
      </Text>
      {userRole === "CLIENT" && (
        <TouchableOpacity
          style={[styles.exploreButton, {backgroundColor: colors.primary}]}
          onPress={() => router.push("/explore")}>
          <Text style={styles.exploreButtonText}>Explorar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "upcoming" && {backgroundColor: colors.primary},
          ]}
          onPress={() => setActiveFilter("upcoming")}>
          <Text
            style={[
              styles.filterText,
              activeFilter === "upcoming"
                ? {color: "#ffffff", fontWeight: "700"}
                : {color: colors.foreground},
            ]}>
            Próximas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "past" && {backgroundColor: colors.primary},
          ]}
          onPress={() => setActiveFilter("past")}>
          <Text
            style={[
              styles.filterText,
              activeFilter === "past"
                ? {color: "#ffffff", fontWeight: "700"}
                : {color: colors.foreground},
            ]}>
            Pasadas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === "all" && {backgroundColor: colors.primary}]}
          onPress={() => setActiveFilter("all")}>
          <Text
            style={[
              styles.filterText,
              activeFilter === "all"
                ? {color: "#ffffff", fontWeight: "700"}
                : {color: colors.foreground},
            ]}>
            Todas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {reservations.map((reservation) => (
            <View
              key={reservation.id}
              style={[styles.reservationCard, {backgroundColor: colors.card}]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.serviceName, {color: colors.foreground}]}>
                  {reservation.service_name}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getStatusColor(reservation.status) + "20"},
                  ]}>
                  <Text style={[styles.statusText, {color: getStatusColor(reservation.status)}]}>
                    {getStatusLabel(reservation.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" color={colors.mutedForeground} size={16} />
                  <Text style={[styles.infoText, {color: colors.mutedForeground}]}>
                    {new Date(reservation.date).toLocaleDateString()} - {reservation.time}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="ticket-outline" color={colors.mutedForeground} size={16} />
                  <Text style={[styles.infoText, {color: colors.mutedForeground}]}>
                    {reservation.code}
                  </Text>
                </View>
                {reservation.provider_name && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person" color={colors.mutedForeground} size={16} />
                    <Text style={[styles.infoText, {color: colors.mutedForeground}]}>
                      {reservation.provider_name}
                    </Text>
                  </View>
                )}
                {reservation.client_name && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person" color={colors.mutedForeground} size={16} />
                    <Text style={[styles.infoText, {color: colors.mutedForeground}]}>
                      {reservation.client_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
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
  emptyText: {
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
  reservationCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
});
