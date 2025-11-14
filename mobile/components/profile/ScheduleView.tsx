import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useThemeVariant} from '@/contexts/ThemeVariantContext';
import {useRouter} from 'expo-router';

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day_of_week: number;
  day_name?: string;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface ScheduleViewProps {
  schedule: DaySchedule[];
  editable?: boolean;
  onEdit?: () => void;
  linkId?: number; // For linked professional schedules
}

const DAY_NAMES = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  editable = false,
  onEdit,
  linkId,
}) => {
  const {colors} = useThemeVariant();
  const router = useRouter();

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const handleEdit = () => {
    if (linkId) {
      router.push(`/profile/schedule?linkId=${linkId}`);
    } else {
      router.push('/profile/schedule');
    }
    if (onEdit) {
      onEdit();
    }
  };

  const availableDays = schedule.filter(day => day.is_available && day.time_slots.length > 0);

  if (availableDays.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.card}]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar-outline" color={colors.primary} size={20} />
            <Text style={[styles.title, {color: colors.foreground}]}>Horarios</Text>
          </View>
          {editable && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.7}>
              <Ionicons name="create-outline" color={colors.primary} size={18} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="time-outline"
            size={32}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
            No hay horarios configurados
          </Text>
          {editable && (
            <TouchableOpacity
              style={[styles.addButton, {borderColor: colors.primary}]}
              onPress={handleEdit}
              activeOpacity={0.7}>
              <Text style={[styles.addButtonText, {color: colors.primary}]}>
                Configurar Horarios
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.card}]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" color={colors.primary} size={20} />
          <Text style={[styles.title, {color: colors.foreground}]}>Horarios</Text>
        </View>
        {editable && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.7}>
            <Ionicons name="create-outline" color={colors.primary} size={18} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.scheduleContainer}>
          {availableDays.map((day, index) => (
            <View
              key={day.day_of_week}
              style={[
                styles.dayCard,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}>
              <Text style={[styles.dayName, {color: colors.foreground}]}>
                {day.day_name || DAY_NAMES[day.day_of_week]}
              </Text>
              <View style={styles.slotsContainer}>
                {day.time_slots.map((slot, slotIndex) => (
                  <View
                    key={slotIndex}
                    style={[styles.slotBadge, {backgroundColor: colors.primary + '15'}]}>
                    <Text style={[styles.slotText, {color: colors.primary}]}>
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dayCard: {
    minWidth: 140,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  slotsContainer: {
    gap: 6,
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

