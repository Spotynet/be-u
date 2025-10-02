import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Image} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";

export default function Reservas() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [activeTab, setActiveTab] = useState<"activas" | "finalizadas">("activas");

  const activeReservations = [
    {
      id: 1,
      salonName: "BE-U Spa",
      status: "confirmada",
      date: "25/07/2024",
      time: "10:00 am",
      location: "Toluca 32, CDMX",
      rating: 4.9,
      service: "Tratamiento Facial",
      duration: "60 min",
      price: "$1,200",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop",
    },
    {
      id: 2,
      salonName: "BE-U Hair Studio",
      status: "pendiente",
      date: "28/07/2024",
      time: "2:00 pm",
      location: "Roma Norte, CDMX",
      rating: 4.8,
      service: "Corte y Peinado",
      duration: "45 min",
      price: "$800",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=200&fit=crop",
    },
  ];

  const completedReservations = [
    {
      id: 3,
      salonName: "BE-U Beauty",
      status: "completada",
      date: "20/07/2024",
      time: "11:00 am",
      location: "Polanco, CDMX",
      rating: 4.9,
      service: "Manicure y Pedicure",
      duration: "90 min",
      price: "$600",
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=200&fit=crop",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "#10b981"; // Green
      case "pendiente":
        return "#f59e0b"; // Orange
      case "completada":
        return "#6b7280"; // Gray
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmada":
        return "checkmark-circle";
      case "pendiente":
        return "time";
      case "completada":
        return "checkmark-done-circle";
      default:
        return "help-circle";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmada":
        return "Reserva confirmada";
      case "pendiente":
        return "Reserva pendiente";
      case "completada":
        return "Reserva completada";
      default:
        return "Estado desconocido";
    }
  };

  const currentReservations = activeTab === "activas" ? activeReservations : completedReservations;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: "#ffffff"}]}>Mis Reservas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, {backgroundColor: colors.background}]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "activas" && styles.activeTab,
            activeTab === "activas" && {borderBottomColor: colors.primary},
          ]}
          onPress={() => setActiveTab("activas")}>
          <Text
            style={[
              styles.tabText,
              {color: activeTab === "activas" ? colors.primary : colors.mutedForeground},
            ]}>
            Activas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "finalizadas" && styles.activeTab,
            activeTab === "finalizadas" && {borderBottomColor: colors.primary},
          ]}
          onPress={() => setActiveTab("finalizadas")}>
          <Text
            style={[
              styles.tabText,
              {color: activeTab === "finalizadas" ? colors.primary : colors.mutedForeground},
            ]}>
            Finalizadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reservations List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" color={colors.mutedForeground} size={64} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay reservas {activeTab === "activas" ? "activas" : "finalizadas"}
            </Text>
            <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>
              {activeTab === "activas"
                ? "Tus próximas citas aparecerán aquí"
                : "Tus citas completadas aparecerán aquí"}
            </Text>
          </View>
        ) : (
          currentReservations.map((reservation) => (
            <View
              key={reservation.id}
              style={[
                styles.reservationCard,
                {backgroundColor: colors.card, borderColor: getStatusColor(reservation.status)},
              ]}>
              {/* Salon Image */}
              <View style={styles.imageContainer}>
                <Image source={{uri: reservation.image}} style={styles.salonImage} />
                <View style={[styles.ratingBadge, {backgroundColor: "#ef4444"}]}>
                  <Ionicons name="star" color="#ffffff" size={12} />
                  <Text style={styles.ratingText}>{reservation.rating}</Text>
                </View>
              </View>

              {/* Salon Info */}
              <View style={styles.salonInfo}>
                <Text style={[styles.salonName, {color: colors.foreground}]}>
                  {reservation.salonName}
                </Text>
                <View style={styles.serviceInfo}>
                  <Ionicons name="checkmark-circle" color={colors.primary} size={16} />
                  <Text style={[styles.serviceText, {color: colors.mutedForeground}]}>
                    {reservation.service} • {reservation.duration}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.statusContainer}>
                  <Ionicons
                    name={getStatusIcon(reservation.status)}
                    color={getStatusColor(reservation.status)}
                    size={20}
                  />
                  <Text style={[styles.statusText, {color: getStatusColor(reservation.status)}]}>
                    {getStatusText(reservation.status)}
                  </Text>
                </View>

                {/* Date and Time */}
                <Text style={[styles.dateTime, {color: colors.foreground}]}>
                  {reservation.date} {reservation.time}
                </Text>

                {/* Location */}
                <Text style={[styles.location, {color: colors.foreground}]}>
                  {reservation.location}
                </Text>

                {/* Price */}
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, {color: colors.primary}]}>{reservation.price}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  reservationCard: {
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 120,
  },
  salonImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  salonInfo: {
    padding: 16,
  },
  salonName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  serviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  serviceText: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateTime: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
