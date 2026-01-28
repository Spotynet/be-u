import React, {useState, useMemo, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {Reservation, ReservationStatus} from "@/types/global";

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  reservations: Reservation[];
}


export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  reservations = [],
}) => {
  const {colors} = useThemeVariant();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
  });

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate + "T00:00:00"));
    }
  }, [selectedDate]);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const weekDayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

  // Group reservations by date
  const markedDates = useMemo(() => {
    const marked: Record<string, {dots: Array<{color: string}>}> = {};
    if (!reservations || !Array.isArray(reservations)) {
      return marked;
    }
    reservations.forEach((reservation) => {
      if (!reservation || !reservation.date) return;
      const dateKey = reservation.date;
      if (!marked[dateKey]) {
        marked[dateKey] = {dots: []};
      }
      const dotColor = getStatusColor(reservation.status);
      marked[dateKey].dots.push({color: dotColor});
    });
    return marked;
  }, [reservations, colors.primary]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<Date | null> = [];

    // Add previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const handleDatePress = (date: Date) => {
    const isoDate = toISODate(date);
    onSelectDate(isoDate);
    onClose();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return toISODate(date) === selectedDate;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const renderMonthView = () => {
    const days = getMonthDays();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return (
      <View style={styles.monthContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => navigateMonth("prev")}
            style={styles.navButton}
            activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, {color: colors.foreground}]}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity
            onPress={() => navigateMonth("next")}
            style={styles.navButton}
            activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysHeader}>
          {weekDayNames.map((day) => (
            <View key={day} style={styles.weekDayHeader}>
              <Text style={[styles.weekDayText, {color: colors.mutedForeground}]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            if (!date) return <View key={index} style={styles.dayCell} />;

            const isoDate = toISODate(date);
            const marked = markedDates[isoDate];
            const dots = marked?.dots || [];
            const isCurrentMonthDay = isCurrentMonth(date);
            const isSelectedDay = isSelected(date);
            const isTodayDay = isToday(date);

            return (
              <TouchableOpacity
                key={index}
                style={styles.dayCell}
                onPress={() => handleDatePress(date)}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: isSelectedDay
                        ? colors.primary
                        : isTodayDay
                        ? colors.primary + "20"
                        : "transparent",
                      borderColor: isTodayDay && !isSelectedDay ? colors.primary : "transparent",
                      borderWidth: isTodayDay && !isSelectedDay ? 2 : 0,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelectedDay
                          ? "#ffffff"
                          : isCurrentMonthDay
                          ? colors.foreground
                          : colors.mutedForeground,
                        fontWeight: isTodayDay ? "700" : "500",
                      },
                    ]}>
                    {date.getDate()}
                  </Text>
                </View>
                {dots.length > 0 && (
                  <View style={styles.dotsContainer}>
                    {dots.slice(0, 3).map((dot, dotIndex) => (
                      <View
                        key={dotIndex}
                        style={[styles.dot, {backgroundColor: dot.color}]}
                      />
                    ))}
                    {dots.length > 3 && (
                      <Text style={[styles.moreDotsText, {color: colors.mutedForeground}]}>
                        +{dots.length - 3}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
          <View style={[styles.modalHeader, {borderBottomColor: colors.border}]}>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              Seleccionar Fecha
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.calendarContainer}>
            {renderMonthView()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  calendarContainer: {
    flex: 1,
  },
  monthContainer: {
    padding: 20,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  weekDaysHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: "center",
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginTop: 2,
    height: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreDotsText: {
    fontSize: 8,
    fontWeight: "600",
    marginLeft: 2,
  },
});
