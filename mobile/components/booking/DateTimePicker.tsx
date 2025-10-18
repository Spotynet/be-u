import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {serviceApi} from "@/lib/api";
import {errorUtils} from "@/lib/api";

// Force reload - DateTimePicker component

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  availableSlots?: string[];
  serviceDuration?: string;
  serviceId?: number;
  providerId?: number;
  providerType?: "professional" | "place";
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  availableSlots,
  serviceDuration,
  serviceId,
  providerId,
  providerType,
}: DateTimePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [apiAvailableSlots, setApiAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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

  // Fetch available slots from API when all required props are available
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!serviceId || !providerId || !providerType || !selectedDate) {
        return;
      }

      try {
        setIsLoadingSlots(true);
        const dateString = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD format

        const response = await serviceApi.getAvailableSlots({
          service_id: serviceId,
          date: dateString,
          service_type: providerType,
        });

        // Extract time slots from API response (assuming it returns array of time strings)
        const slots = response.data?.available_slots || response.data?.slots || [];
        setApiAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching available slots:", error);
        // Fallback to default slots if API fails
        const defaultSlots: string[] = [];
        for (let hour = 9; hour <= 18; hour++) {
          defaultSlots.push(`${hour.toString().padStart(2, "0")}:00`);
        }
        setApiAvailableSlots(defaultSlots);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [serviceId, providerId, providerType, selectedDate]);

  // Generate time slots (use API data if available, otherwise fallback)
  const generateTimeSlots = (): string[] => {
    if (availableSlots) return availableSlots;
    if (apiAvailableSlots.length > 0) return apiAvailableSlots;

    // Default fallback slots
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
          {isLoadingSlots ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
                Cargando horarios disponibles...
              </Text>
            </View>
          ) : (
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
          )}
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
