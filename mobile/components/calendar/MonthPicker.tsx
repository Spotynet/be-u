import React, {useState, useMemo} from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {Reservation, ReservationStatus} from "@/types/global";

interface MonthPickerProps {
  reservations: Reservation[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  initialDate?: Date;
}

export const MonthPicker = ({
  reservations,
  onDayPress,
  selectedDate,
  initialDate,
}: MonthPickerProps) => {
  const {colors} = useThemeVariant();
  const [currentDate, setCurrentDate] = useState<Date>(
    () => initialDate || (selectedDate ? new Date(selectedDate + "T00:00:00") : new Date())
  );

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const weekDayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "CONFIRMED": return "#10b981";
      case "PENDING": return "#f59e0b";
      case "COMPLETED": return "#6b7280";
      case "CANCELLED": return "#ef4444";
      case "REJECTED": return "#dc2626";
      default: return colors.primary;
    }
  };

  const markedDates = useMemo(() => {
    const marked: Record<string, {dots: Array<{color: string}>}> = {};
    (reservations || []).forEach((r: any) => {
      if (!r?.date) return;
      if (!marked[r.date]) marked[r.date] = {dots: []};
      marked[r.date].dots.push({color: getStatusColor(r.status)});
    });
    return marked;
  }, [reservations, colors.primary]);

  const navigateMonth = (dir: "prev" | "next") => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + (dir === "next" ? 1 : -1));
    setCurrentDate(d);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Date[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  const handleDatePress = (date: Date) => {
    onDayPress(toISODate(date));
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };
  const isSelected = (d: Date) => selectedDate && toISODate(d) === selectedDate;
  const isCurrentMonth = (d: Date) => d.getMonth() === currentDate.getMonth();

  const days = getMonthDays();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => navigateMonth("prev")} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, {color: colors.foreground}]}>
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth("next")} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysHeader}>
        {weekDayNames.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={[styles.weekDayText, {color: colors.mutedForeground}]}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date, idx) => {
          const iso = toISODate(date);
          const marked = markedDates[iso];
          const dots = marked?.dots || [];
          const selected = isSelected(date);
          const today = isToday(date);
          const currentMonth = isCurrentMonth(date);

          return (
            <TouchableOpacity
              key={idx}
              style={styles.dayCell}
              onPress={() => handleDatePress(date)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: selected ? colors.primary : today ? colors.primary + "20" : "transparent",
                    borderColor: today && !selected ? colors.primary : "transparent",
                    borderWidth: today && !selected ? 2 : 0,
                  },
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: selected ? "#ffffff" : currentMonth ? colors.foreground : colors.mutedForeground,
                      fontWeight: today ? "700" : "500",
                    },
                  ]}>
                  {date.getDate()}
                </Text>
              </View>
              {dots.length > 0 && (
                <View style={styles.dotsRow}>
                  {dots.slice(0, 3).map((dot, i) => (
                    <View key={i} style={[styles.dot, {backgroundColor: dot.color}]} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  weekDaysHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekDayText: {
    fontSize: 11,
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
    paddingVertical: 2,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 15,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
