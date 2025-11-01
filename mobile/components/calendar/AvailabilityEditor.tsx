import React, {useState} from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {WeeklySchedule, DayOfWeek} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

interface AvailabilityEditorProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

const DAYS = [
  {id: 0, name: "Lunes", short: "L"},
  {id: 1, name: "Martes", short: "M"},
  {id: 2, name: "Miércoles", short: "X"},
  {id: 3, name: "Jueves", short: "J"},
  {id: 4, name: "Viernes", short: "V"},
  {id: 5, name: "Sábado", short: "S"},
  {id: 6, name: "Domingo", short: "D"},
];

export const AvailabilityEditor = ({schedule, onChange}: AvailabilityEditorProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [showTimePicker, setShowTimePicker] = useState<{
    day: number;
    type: "start" | "end";
  } | null>(null);

  const toggleDay = (dayId: number) => {
    const newSchedule = {...schedule};
    if (newSchedule[dayId]) {
      newSchedule[dayId].enabled = !newSchedule[dayId].enabled;
    } else {
      newSchedule[dayId] = {
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
      };
    }
    onChange(newSchedule);
  };

  const updateTime = (dayId: number, type: "start" | "end", time: string) => {
    const newSchedule = {...schedule};
    if (!newSchedule[dayId]) {
      newSchedule[dayId] = {
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
      };
    }

    if (type === "start") {
      newSchedule[dayId].start_time = time;
    } else {
      newSchedule[dayId].end_time = time;
    }

    onChange(newSchedule);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(null);
    }

    if (event.type === "set" && selectedDate && showTimePicker) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      updateTime(showTimePicker.day, showTimePicker.type, timeString);

      if (Platform.OS === "ios") {
        setShowTimePicker(null);
      }
    } else if (event.type === "dismissed") {
      setShowTimePicker(null);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>Horario Semanal</Text>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Configura tu disponibilidad para cada día de la semana
        </Text>
      </View>

      <View style={styles.daysContainer}>
        {DAYS.map((day) => {
          const daySchedule = schedule[day.id];
          const isEnabled = daySchedule?.enabled ?? false;

          return (
            <View
              key={day.id}
              style={[
                styles.dayCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isEnabled ? colors.primary : colors.border,
                },
              ]}>
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <View
                    style={[
                      styles.dayBadge,
                      {backgroundColor: isEnabled ? colors.primary : colors.muted},
                    ]}>
                    <Text
                      style={[
                        styles.dayShort,
                        {color: isEnabled ? "#ffffff" : colors.mutedForeground},
                      ]}>
                      {day.short}
                    </Text>
                  </View>
                  <Text style={[styles.dayName, {color: colors.foreground}]}>{day.name}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.toggle,
                    {backgroundColor: isEnabled ? colors.primary : colors.muted},
                  ]}
                  onPress={() => toggleDay(day.id)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.toggleKnob,
                      {
                        backgroundColor: "#ffffff",
                        transform: [{translateX: isEnabled ? 20 : 0}],
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {isEnabled && daySchedule && (
                <View style={styles.timeSection}>
                  <TouchableOpacity
                    style={[styles.timeButton, {backgroundColor: colors.muted}]}
                    onPress={() => setShowTimePicker({day: day.id, type: "start"})}
                    activeOpacity={0.7}>
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>Inicio:</Text>
                    <Text style={[styles.timeValue, {color: colors.foreground}]}>
                      {daySchedule.start_time}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.timeSeparator, {color: colors.mutedForeground}]}>—</Text>

                  <TouchableOpacity
                    style={[styles.timeButton, {backgroundColor: colors.muted}]}
                    onPress={() => setShowTimePicker({day: day.id, type: "end"})}
                    activeOpacity={0.7}>
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>Fin:</Text>
                    <Text style={[styles.timeValue, {color: colors.foreground}]}>
                      {daySchedule.end_time}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Time Picker */}
      {showTimePicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={(() => {
            const daySchedule = schedule[showTimePicker.day];
            const timeStr =
              showTimePicker.type === "start" ? daySchedule?.start_time : daySchedule?.end_time;
            const [hours, minutes] = (timeStr || "09:00").split(":");
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date;
          })()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  daysContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  dayCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dayShort: {
    fontSize: 16,
    fontWeight: "700",
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  timeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: "700",
  },
});

































