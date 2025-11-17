import React from "react";
import {View, Text, StyleSheet} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilitySchedule {
  id: number;
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface AvailabilityDisplayProps {
  availability: AvailabilitySchedule[];
}

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const DAY_ABBREVIATIONS = ["L", "M", "X", "J", "V", "S", "D"];

export const AvailabilityDisplay = ({availability}: AvailabilityDisplayProps) => {
  const {colors} = useThemeVariant();

  // Create a map of day_of_week to schedule for easy lookup
  const availabilityMap = new Map<number, AvailabilitySchedule>();
  availability.forEach((schedule) => {
    availabilityMap.set(schedule.day_of_week, schedule);
  });

  // Format time from "HH:MM:SS" or "HH:MM" to "HH:MM AM/PM"
  const formatTime = (time: string): string => {
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch {
      return time;
    }
  };

  // Group consecutive days with same availability
  const groupAvailability = () => {
    const groups: Array<{
      days: number[];
      schedule: AvailabilitySchedule | null;
    }> = [];

    for (let day = 0; day < 7; day++) {
      const schedule = availabilityMap.get(day);
      const isAvailable = schedule?.is_available && schedule.time_slots.length > 0;

      // Check if we can add to the last group
      if (groups.length > 0) {
        const lastGroup = groups[groups.length - 1];
        const lastSchedule = lastGroup.schedule;
        const lastIsAvailable =
          lastSchedule?.is_available && lastSchedule.time_slots.length > 0;

        // Check if time slots match
        if (isAvailable && lastIsAvailable && lastSchedule) {
          const currentSlots = schedule?.time_slots || [];
          const lastSlots = lastSchedule.time_slots;

          // Check if slots are the same
          const slotsMatch =
            currentSlots.length === lastSlots.length &&
            currentSlots.every(
              (slot, idx) =>
                slot.start_time === lastSlots[idx]?.start_time &&
                slot.end_time === lastSlots[idx]?.end_time
            );

          if (slotsMatch) {
            lastGroup.days.push(day);
            continue;
          }
        } else if (!isAvailable && !lastIsAvailable) {
          // Both unavailable, can group
          lastGroup.days.push(day);
          continue;
        }
      }

      // Create new group
      groups.push({
        days: [day],
        schedule: schedule || null,
      });
    }

    return groups;
  };

  const groups = groupAvailability();

  const formatDayRange = (days: number[]): string => {
    if (days.length === 1) {
      return DAY_NAMES[days[0]];
    } else if (days.length === 2) {
      return `${DAY_NAMES[days[0]]} y ${DAY_NAMES[days[1]]}`;
    } else {
      return `${DAY_NAMES[days[0]]} - ${DAY_NAMES[days[days.length - 1]]}`;
    }
  };

  const formatTimeSlots = (timeSlots: TimeSlot[]): string => {
    if (timeSlots.length === 0) return "No disponible";
    if (timeSlots.length === 1) {
      return `${formatTime(timeSlots[0].start_time)} - ${formatTime(timeSlots[0].end_time)}`;
    }
    // Multiple slots - show first and last, or all if few
    if (timeSlots.length <= 3) {
      return timeSlots
        .map((slot) => `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`)
        .join(", ");
    }
    return `${formatTime(timeSlots[0].start_time)} - ${formatTime(timeSlots[timeSlots.length - 1].end_time)}`;
  };

  // Check if there's any availability
  const hasAvailability = availability.some(
    (schedule) => schedule.is_available && schedule.time_slots.length > 0
  );

  if (!hasAvailability) {
    return (
      <View style={[styles.container, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={styles.header}>
          <Ionicons name="time-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.title, {color: colors.foreground}]}>Horarios</Text>
        </View>
        <Text style={[styles.noAvailabilityText, {color: colors.mutedForeground}]}>
          No hay horarios disponibles configurados
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, {color: colors.foreground}]}>Horarios</Text>
      </View>

      <View style={styles.scheduleList}>
        {groups.map((group, index) => {
          const schedule = group.schedule;
          const isAvailable = schedule?.is_available && schedule.time_slots.length > 0;

          return (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.dayInfo}>
                <View style={styles.dayBadges}>
                  {group.days.map((day) => (
                    <View
                      key={day}
                      style={[
                        styles.dayBadge,
                        {
                          backgroundColor: isAvailable
                            ? colors.primary + "20"
                            : colors.muted + "40",
                        },
                      ]}>
                      <Text
                        style={[
                          styles.dayBadgeText,
                          {
                            color: isAvailable ? colors.primary : colors.mutedForeground,
                          },
                        ]}>
                        {DAY_ABBREVIATIONS[day]}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.dayRange, {color: colors.foreground}]}>
                  {formatDayRange(group.days)}
                </Text>
              </View>
              <Text style={[styles.timeRange, {color: colors.mutedForeground}]}>
                {isAvailable ? formatTimeSlots(schedule!.time_slots) : "No disponible"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  noAvailabilityText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    gap: 8,
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayBadges: {
    flexDirection: "row",
    gap: 4,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dayRange: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  timeRange: {
    fontSize: 14,
    marginLeft: 36, // Align with day range text
  },
});

