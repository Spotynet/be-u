import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useThemeVariant} from '@/contexts/ThemeVariantContext';

interface TimeSlot {
  id?: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DaySchedule {
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface ScheduleEditorProps {
  initialSchedule?: DaySchedule[];
  onSave: (schedule: DaySchedule[]) => void;
  onCancel?: () => void;
}

const DAYS = [
  {value: 0, label: 'Lunes', short: 'L'},
  {value: 1, label: 'Martes', short: 'M'},
  {value: 2, label: 'Miércoles', short: 'X'},
  {value: 3, label: 'Jueves', short: 'J'},
  {value: 4, label: 'Viernes', short: 'V'},
  {value: 5, label: 'Sábado', short: 'S'},
  {value: 6, label: 'Domingo', short: 'D'},
];

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  initialSchedule = [],
  onSave,
  onCancel,
}) => {
  const {colors} = useThemeVariant();
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    // Initialize with all days
    const days: DaySchedule[] = DAYS.map(day => {
      const existing = initialSchedule.find(s => s.day_of_week === day.value);
      return existing || {
        day_of_week: day.value,
        is_available: false,
        time_slots: [],
      };
    });
    return days;
  });

  const toggleDayAvailability = (dayIndex: number) => {
    setSchedule(prev =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {...day, is_available: !day.is_available}
          : day,
      ),
    );
  };

  const addTimeSlot = (dayIndex: number) => {
    setSchedule(prev =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              time_slots: [
                ...day.time_slots,
                {start_time: '09:00', end_time: '17:00', is_active: true},
              ],
            }
          : day,
      ),
    );
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule(prev =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              time_slots: day.time_slots.filter((_, i) => i !== slotIndex),
            }
          : day,
      ),
    );
  };

  const updateTimeSlot = (
    dayIndex: number,
    slotIndex: number,
    field: 'start_time' | 'end_time',
    value: string,
  ) => {
    setSchedule(prev =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              time_slots: day.time_slots.map((slot, sIdx) =>
                sIdx === slotIndex ? {...slot, [field]: value} : slot,
              ),
            }
          : day,
      ),
    );
  };

  const handleSave = () => {
    // Validate time slots
    for (const day of schedule) {
      if (day.is_available) {
        for (const slot of day.time_slots) {
          if (slot.start_time >= slot.end_time) {
            Alert.alert(
              'Error',
              `En ${DAYS[day.day_of_week].label}, la hora de inicio debe ser anterior a la hora de fin`,
            );
            return;
          }
        }
        if (day.time_slots.length === 0) {
          Alert.alert(
            'Error',
            `Debes agregar al menos un horario para ${DAYS[day.day_of_week].label} si está disponible`,
          );
          return;
        }
      }
    }

    // Filter out days that are not available
    const filteredSchedule = schedule.filter(day => day.is_available);
    onSave(filteredSchedule);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>
          Configurar Horarios
        </Text>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Selecciona los días disponibles y agrega los horarios
        </Text>
      </View>

      {schedule.map((day, dayIndex) => (
        <View
          key={day.day_of_week}
          style={[
            styles.dayCard,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <TouchableOpacity
            style={styles.dayHeader}
            onPress={() => toggleDayAvailability(dayIndex)}
            activeOpacity={0.7}>
            <View style={styles.dayHeaderLeft}>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: day.is_available
                      ? colors.primary
                      : 'transparent',
                    borderColor: colors.border,
                  },
                ]}>
                {day.is_available && (
                  <Ionicons name="checkmark" color="#ffffff" size={16} />
                )}
              </View>
              <Text style={[styles.dayLabel, {color: colors.foreground}]}>
                {DAYS[day.day_of_week].label}
              </Text>
            </View>
            <Ionicons
              name={day.is_available ? 'chevron-down' : 'chevron-forward'}
              color={colors.mutedForeground}
              size={20}
            />
          </TouchableOpacity>

          {day.is_available && (
            <View style={styles.timeSlotsContainer}>
              {day.time_slots.map((slot, slotIndex) => (
                <View
                  key={slotIndex}
                  style={[
                    styles.timeSlotRow,
                    {borderColor: colors.border},
                  ]}>
                  <View style={styles.timeInputContainer}>
                    <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>
                      Desde
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.foreground,
                          borderColor: colors.border,
                        },
                      ]}
                      value={slot.start_time}
                      onChangeText={value =>
                        updateTimeSlot(dayIndex, slotIndex, 'start_time', value)
                      }
                      placeholder="09:00"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>

                  <View style={styles.timeInputContainer}>
                    <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>
                      Hasta
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.foreground,
                          borderColor: colors.border,
                        },
                      ]}
                      value={slot.end_time}
                      onChangeText={value =>
                        updateTimeSlot(dayIndex, slotIndex, 'end_time', value)
                      }
                      placeholder="17:00"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeTimeSlot(dayIndex, slotIndex)}
                    activeOpacity={0.7}>
                    <Ionicons name="trash-outline" color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addButton, {borderColor: colors.primary}]}
                onPress={() => addTimeSlot(dayIndex)}
                activeOpacity={0.7}>
                <Ionicons name="add" color={colors.primary} size={20} />
                <Text style={[styles.addButtonText, {color: colors.primary}]}>
                  Agregar Horario
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, {borderColor: colors.border}]}
            onPress={onCancel}
            activeOpacity={0.7}>
            <Text style={[styles.cancelButtonText, {color: colors.foreground}]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.saveButton, {backgroundColor: colors.primary}]}
          onPress={handleSave}
          activeOpacity={0.9}>
          <Text style={styles.saveButtonText}>Guardar Horarios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  dayCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeSlotsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  timeInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

