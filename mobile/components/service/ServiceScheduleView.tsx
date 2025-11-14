import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {Ionicons} from '@expo/vector-icons';
import {useThemeVariant} from '@/contexts/ThemeVariantContext';
import {profileCustomizationApi} from '@/lib/api';
import {TimeSlotPicker} from '@/components/schedule/TimeSlotPicker';

interface ServiceScheduleViewProps {
  providerType: 'professional' | 'place';
  providerId: number;
  serviceId?: number;
  serviceDuration?: number; // in minutes
  onSlotSelect?: (date: string, slot: any) => void;
}

export const ServiceScheduleView: React.FC<ServiceScheduleViewProps> = ({
  providerType,
  providerId,
  serviceId,
  serviceDuration,
  onSlotSelect,
}) => {
  const {colors} = useThemeVariant();
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [providerType, providerId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, serviceId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await profileCustomizationApi.getPublicAvailability(
        providerType,
        providerId,
      );
      setAvailability(response.data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date: string) => {
    try {
      setLoadingSlots(true);
      const response = await profileCustomizationApi.getAvailableSlots(
        providerType,
        providerId,
        date,
        serviceId,
      );
      setAvailableSlots(response.data?.available_slots || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const getAvailableDays = () => {
    const today = new Date();
    const markedDates: any = {};
    const availableDays: string[] = [];

    // Get days that have availability
    const daysWithAvailability = availability
      .filter(day => day.is_available && day.time_slots?.length > 0)
      .map(day => day.day_of_week);

    // Generate dates for next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert to Monday=0 format

      if (daysWithAvailability.includes(dayOfWeek)) {
        const dateStr = date.toISOString().split('T')[0];
        availableDays.push(dateStr);
        markedDates[dateStr] = {
          marked: true,
          dotColor: colors.primary,
        };
      }
    }

    // Mark selected date
    if (selectedDate) {
      markedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return {markedDates, availableDays};
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    if (onSlotSelect && selectedDate) {
      onSlotSelect(selectedDate, slot);
    }
  };

  const {markedDates} = getAvailableDays();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: colors.foreground}]}>
        Disponibilidad
      </Text>

      <Calendar
        current={new Date().toISOString().split('T')[0]}
        minDate={new Date().toISOString().split('T')[0]}
        markedDates={markedDates}
        onDayPress={handleDateSelect}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.foreground,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.primary,
          dayTextColor: colors.foreground,
          textDisabledColor: colors.mutedForeground,
          dotColor: colors.primary,
          arrowColor: colors.primary,
          monthTextColor: colors.foreground,
          textDayFontWeight: '600',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
      />

      {selectedDate && (
        <View style={styles.slotsContainer}>
          {loadingSlots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <TimeSlotPicker
              slots={availableSlots}
              selectedSlot={selectedSlot}
              onSelect={handleSlotSelect}
              serviceDuration={serviceDuration}
            />
          )}
        </View>
      )}

      {!selectedDate && (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="calendar-outline"
            size={48}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
            Selecciona una fecha para ver los horarios disponibles
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 16,
  },
  slotsContainer: {
    marginTop: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
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

