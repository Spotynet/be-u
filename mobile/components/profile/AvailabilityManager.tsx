import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useProfileCustomization} from "@/features/profile/hooks/useProfileCustomization";

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DaySchedule {
  id: number;
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface AvailabilityManagerProps {}

const DAYS = [
  {key: 0, label: "Lunes"},
  {key: 1, label: "Martes"},
  {key: 2, label: "Miércoles"},
  {key: 3, label: "Jueves"},
  {key: 4, label: "Viernes"},
  {key: 5, label: "Sábado"},
  {key: 6, label: "Domingo"},
];

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

export const AvailabilityManager = ({}: AvailabilityManagerProps) => {
  const {colors} = useThemeVariant();
  const {data, isLoading, updateAvailability} = useProfileCustomization();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const schedule = data.availability || [];

  const getDaySchedule = (dayKey: number): DaySchedule => {
    return (
      schedule.find((day) => day.day_of_week === dayKey) || {
        id: 0,
        day_of_week: dayKey,
        is_available: false,
        time_slots: [],
      }
    );
  };

  const toggleDayAvailability = async (dayKey: number) => {
    const daySchedule = getDaySchedule(dayKey);
    const updatedSchedule = schedule.map((day) =>
      day.day_of_week === dayKey
        ? {
            ...day,
            is_available: !day.is_available,
            time_slots: !day.is_available ? day.time_slots : [],
          }
        : day
    );

    // If day doesn't exist in schedule, add it
    if (!schedule.find((day) => day.day_of_week === dayKey)) {
      updatedSchedule.push({
        id: 0,
        day_of_week: dayKey,
        is_available: !daySchedule.is_available,
        time_slots: [],
      });
    }

    try {
      await updateAvailability(updatedSchedule);
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const openTimeModal = (dayKey: number) => {
    setSelectedDay(dayKey);
    setShowTimeModal(true);
  };

  const closeTimeModal = () => {
    setSelectedDay(null);
    setShowTimeModal(false);
  };

  const addTimeSlot = async (dayKey: number, startTime: string, endTime: string) => {
    const daySchedule = getDaySchedule(dayKey);
    const newTimeSlot: TimeSlot = {
      id: 0,
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    };

    const updatedSchedule = schedule.map((day) =>
      day.day_of_week === dayKey ? {...day, time_slots: [...day.time_slots, newTimeSlot]} : day
    );

    // If day doesn't exist in schedule, add it
    if (!schedule.find((day) => day.day_of_week === dayKey)) {
      updatedSchedule.push({
        id: 0,
        day_of_week: dayKey,
        is_available: true,
        time_slots: [newTimeSlot],
      });
    }

    try {
      await updateAvailability(updatedSchedule);
    } catch (error) {
      console.error("Error adding time slot:", error);
    }
  };

  const removeTimeSlot = async (dayKey: number, slotIndex: number) => {
    const updatedSchedule = schedule.map((day) =>
      day.day_of_week === dayKey
        ? {...day, time_slots: day.time_slots.filter((_, index) => index !== slotIndex)}
        : day
    );

    try {
      await updateAvailability(updatedSchedule);
    } catch (error) {
      console.error("Error removing time slot:", error);
    }
  };

  const renderDayCard = (day: {key: number; label: string}) => {
    const daySchedule = getDaySchedule(day.key);

    return (
      <View
        key={day.key}
        style={[styles.dayCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={styles.dayHeader}>
          <Text style={[styles.dayLabel, {color: colors.foreground}]}>{day.label}</Text>
          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              {backgroundColor: daySchedule.is_available ? "#10b981" : colors.muted},
            ]}
            onPress={() => toggleDayAvailability(day.key)}
            activeOpacity={0.7}>
            <Text style={styles.availabilityText}>
              {daySchedule.is_available ? "Disponible" : "No disponible"}
            </Text>
          </TouchableOpacity>
        </View>

        {daySchedule.is_available && (
          <View style={styles.timeSlotsContainer}>
            <View style={styles.timeSlotsHeader}>
              <Text style={[styles.timeSlotsTitle, {color: colors.foreground}]}>Horarios</Text>
              <TouchableOpacity
                style={[styles.addTimeButton, {backgroundColor: colors.primary}]}
                onPress={() => openTimeModal(day.key)}
                activeOpacity={0.9}>
                <Ionicons name="add" color="#ffffff" size={16} />
                <Text style={styles.addTimeText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            {daySchedule.time_slots.length === 0 ? (
              <View style={[styles.emptyTimeSlots, {backgroundColor: colors.muted}]}>
                <Text style={[styles.emptyTimeText, {color: colors.mutedForeground}]}>
                  No hay horarios configurados
                </Text>
              </View>
            ) : (
              <View style={styles.timeSlotsList}>
                {daySchedule.time_slots.map((slot, index) => (
                  <View key={index} style={[styles.timeSlot, {backgroundColor: colors.muted}]}>
                    <Text style={[styles.timeSlotText, {color: colors.foreground}]}>
                      {slot.start_time} - {slot.end_time}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeTimeSlot(day.key, index)}
                      activeOpacity={0.7}>
                      <Ionicons name="close-circle" color="#ef4444" size={20} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderTimeModal = () => {
    if (!selectedDay) return null;

    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");

    const handleAddTimeSlot = () => {
      if (startTime >= endTime) {
        Alert.alert("Error", "La hora de inicio debe ser anterior a la hora de fin.");
        return;
      }

      addTimeSlot(selectedDay, startTime, endTime);
      closeTimeModal();
    };

    return (
      <Modal visible={showTimeModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, {backgroundColor: colors.background}]}>
          <View style={[styles.modalHeader, {borderBottomColor: colors.border}]}>
            <TouchableOpacity onPress={closeTimeModal}>
              <Text style={[styles.modalCancel, {color: colors.primary}]}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              Agregar Horario - {DAYS.find((d) => d.key === selectedDay)?.label}
            </Text>
            <TouchableOpacity onPress={handleAddTimeSlot}>
              <Text style={[styles.modalSave, {color: colors.primary}]}>Agregar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.timeSelector}>
              <View style={styles.timeGroup}>
                <Text style={[styles.timeLabel, {color: colors.foreground}]}>Hora de inicio</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.timeScroll}>
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor: startTime === time ? colors.primary : colors.muted,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setStartTime(time)}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.timeOptionText,
                          {color: startTime === time ? "#ffffff" : colors.foreground},
                        ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeGroup}>
                <Text style={[styles.timeLabel, {color: colors.foreground}]}>Hora de fin</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.timeScroll}>
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor: endTime === time ? colors.primary : colors.muted,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setEndTime(time)}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.timeOptionText,
                          {color: endTime === time ? "#ffffff" : colors.foreground},
                        ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando disponibilidad...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>Disponibilidad</Text>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Configura tus horarios de trabajo y disponibilidad para citas
        </Text>
      </View>

      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {DAYS.map(renderDayCard)}
      </ScrollView>

      {renderTimeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleContainer: {
    flex: 1,
  },
  dayCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  availabilityToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availabilityText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  timeSlotsContainer: {
    marginTop: 8,
  },
  timeSlotsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeSlotsTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  addTimeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyTimeSlots: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyTimeText: {
    fontSize: 14,
  },
  timeSlotsList: {
    gap: 8,
  },
  timeSlot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  timeSelector: {
    gap: 24,
  },
  timeGroup: {
    gap: 12,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  timeScroll: {
    marginTop: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
