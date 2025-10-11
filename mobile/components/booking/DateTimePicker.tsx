import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";

// Force reload - DateTimePicker component

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  availableSlots?: string[];
  serviceDuration?: string;
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  availableSlots,
  serviceDuration,
}: DateTimePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate dates for the current month
  const generateDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      dates.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i));
    }

    return dates;
  };

  // Generate time slots (9 AM to 6 PM, hourly)
  const generateTimeSlots = (): string[] => {
    if (availableSlots) return availableSlots;
    const slots: string[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`;
      slots.push(time);
    }
    return slots;
  };

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

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const dates = generateDates();
  const timeSlots = generateTimeSlots();

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isDatePast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <View style={styles.container}>
      {/* Calendar */}
      <View style={styles.calendar}>
        {/* Month Navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, {color: colors.foreground}]}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>

        {/* Day Names */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((day) => (
            <View key={day} style={styles.dayNameCell}>
              <Text style={[styles.dayName, {color: colors.mutedForeground}]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Dates Grid */}
        <View style={styles.datesGrid}>
          {dates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                isDateSelected(date) && {backgroundColor: colors.primary},
                isDatePast(date) && styles.dateCellDisabled,
              ]}
              disabled={!date || isDatePast(date)}
              onPress={() => date && onDateChange(date)}>
              {date && (
                <Text
                  style={[
                    styles.dateText,
                    {color: colors.foreground},
                    isDateSelected(date) && {color: "#ffffff", fontWeight: "700"},
                    isDatePast(date) && {color: colors.mutedForeground, opacity: 0.4},
                  ]}>
                  {date.getDate()}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time Slots */}
      {selectedDate && (
        <View style={styles.timeSection}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Hora</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSlotsContainer}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  {
                    borderColor: colors.border,
                    backgroundColor: selectedTime === time ? colors.primary : colors.card,
                  },
                ]}
                onPress={() => onTimeChange(time)}>
                <Text
                  style={[
                    styles.timeText,
                    {color: selectedTime === time ? "#ffffff" : colors.foreground},
                  ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  calendar: {
    gap: 12,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  dayNamesRow: {
    flexDirection: "row",
  },
  dayNameCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
  },
  datesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateCell: {
    width: "14.28%", // 7 days
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  dateCellDisabled: {
    opacity: 0.3,
  },
  dateText: {
    fontSize: 14,
  },
  timeSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  timeSlotsContainer: {
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
