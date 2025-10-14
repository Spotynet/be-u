import React from "react";
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Reservation} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";

interface DayScheduleProps {
  date: string;
  reservations: Reservation[];
  onReservationPress?: (reservation: Reservation) => void;
}

export const DaySchedule = ({date, reservations, onReservationPress}: DayScheduleProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Generate time slots for the day (6 AM to 10 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Sort reservations by time
  const sortedReservations = [...reservations].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <Text style={[styles.dateText, {color: colors.foreground}]}>
          {new Date(date).toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <View style={[styles.countBadge, {backgroundColor: colors.primary + "15"}]}>
          <Text style={[styles.countText, {color: colors.primary}]}>
            {reservations.length} {reservations.length === 1 ? "reserva" : "reservas"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.schedule} showsVerticalScrollIndicator={false}>
        {sortedReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              No hay reservas para este día
            </Text>
          </View>
        ) : (
          sortedReservations.map((reservation) => (
            <TouchableOpacity
              key={reservation.id}
              style={[
                styles.reservationCard,
                {
                  backgroundColor: colors.card,
                  borderLeftColor: getStatusColor(reservation.status),
                },
              ]}
              onPress={() => onReservationPress?.(reservation)}
              activeOpacity={0.7}>
              <View style={styles.timeSection}>
                <Text style={[styles.timeText, {color: colors.foreground}]}>
                  {reservation.time.substring(0, 5)}
                </Text>
                {reservation.end_time && (
                  <Text style={[styles.endTimeText, {color: colors.mutedForeground}]}>
                    {reservation.end_time.substring(0, 5)}
                  </Text>
                )}
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.serviceName, {color: colors.foreground}]}>
                  {reservation.service_details?.name || "Servicio"}
                </Text>

                <View style={styles.clientInfo}>
                  <Ionicons name="person" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.clientName, {color: colors.mutedForeground}]}>
                    {reservation.client_details?.name || reservation.provider_name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getStatusColor(reservation.status) + "15"},
                  ]}>
                  <Text style={[styles.statusText, {color: getStatusColor(reservation.status)}]}>
                    {reservation.status_display}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  countBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
  },
  schedule: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  reservationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 16,
  },
  timeSection: {
    alignItems: "center",
    minWidth: 60,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  endTimeText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  detailsSection: {
    flex: 1,
    gap: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clientName: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});





