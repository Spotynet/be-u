import React from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {Calendar, DateData} from "react-native-calendars";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Reservation, ReservationStatus} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";

interface CalendarViewProps {
  reservations: Reservation[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
}

export const CalendarView = ({
  reservations,
  onDayPress,
  selectedDate,
  minDate,
  maxDate,
}: CalendarViewProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Group reservations by date
  const markedDates: any = {};

  reservations.forEach((reservation) => {
    const dateKey = reservation.date;

    if (!markedDates[dateKey]) {
      markedDates[dateKey] = {
        marked: true,
        dots: [],
      };
    }

    // Add dot based on status
    const dotColor = getStatusColor(reservation.status);
    markedDates[dateKey].dots.push({
      color: dotColor,
      selectedDotColor: dotColor,
    });
  });

  // Add selection to marked dates
  if (selectedDate && markedDates[selectedDate]) {
    markedDates[selectedDate].selected = true;
    markedDates[selectedDate].selectedColor = colors.primary;
  } else if (selectedDate) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: colors.primary,
    };
  }

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "CONFIRMED":
        return "#10b981"; // Green
      case "PENDING":
        return "#f59e0b"; // Orange
      case "COMPLETED":
        return "#6b7280"; // Gray
      case "CANCELLED":
        return "#ef4444"; // Red
      case "REJECTED":
        return "#dc2626"; // Dark red
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day: DateData) => onDayPress(day.dateString)}
        minDate={minDate}
        maxDate={maxDate}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.mutedForeground,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#ffffff",
          todayTextColor: colors.primary,
          dayTextColor: colors.foreground,
          textDisabledColor: colors.mutedForeground,
          dotColor: colors.primary,
          selectedDotColor: "#ffffff",
          arrowColor: colors.primary,
          monthTextColor: colors.foreground,
          indicatorColor: colors.primary,
          textDayFontWeight: "500",
          textMonthFontWeight: "700",
          textDayHeaderFontWeight: "600",
          textDayFontSize: 15,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 13,
        }}
      />

      {/* Legend */}
      <View style={[styles.legend, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <Text style={[styles.legendTitle, {color: colors.foreground}]}>Estado:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: "#10b981"}]} />
            <Text style={[styles.legendText, {color: colors.foreground}]}>Confirmada</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: "#f59e0b"}]} />
            <Text style={[styles.legendText, {color: colors.foreground}]}>Pendiente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: "#6b7280"}]} />
            <Text style={[styles.legendText, {color: colors.foreground}]}>Completada</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  legend: {
    padding: 16,
    borderTopWidth: 1,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
});





