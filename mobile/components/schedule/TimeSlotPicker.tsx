import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useThemeVariant} from '@/contexts/ThemeVariantContext';

interface TimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes?: number;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot?: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  serviceDuration?: number; // in minutes
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelect,
  serviceDuration,
}) => {
  const {colors} = useThemeVariant();

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

  const isSlotValid = (slot: TimeSlot) => {
    if (!serviceDuration) return true;
    const slotDuration = slot.duration_minutes || 0;
    return slotDuration >= serviceDuration;
  };

  const filteredSlots = slots.filter(isSlotValid);

  if (filteredSlots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="time-outline"
          size={48}
          color={colors.mutedForeground}
        />
        <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
          No hay horarios disponibles
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: colors.foreground}]}>
        Selecciona un horario
      </Text>
      <FlatList
        data={filteredSlots}
        keyExtractor={(item, index) =>
          `${item.start_time}-${item.end_time}-${index}`
        }
        numColumns={2}
        contentContainerStyle={styles.slotsGrid}
        renderItem={({item}) => {
          const isSelected =
            selectedSlot?.start_time === item.start_time &&
            selectedSlot?.end_time === item.end_time;
          return (
            <TouchableOpacity
              style={[
                styles.slotCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.slotTime,
                  {color: isSelected ? '#ffffff' : colors.foreground},
                ]}>
                {formatTime(item.start_time)}
              </Text>
              <Text
                style={[
                  styles.slotDuration,
                  {color: isSelected ? '#ffffff' : colors.mutedForeground},
                ]}>
                {item.duration_minutes
                  ? `${item.duration_minutes} min`
                  : 'Disponible'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  slotsGrid: {
    gap: 12,
  },
  slotCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    margin: 4,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotDuration: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});

