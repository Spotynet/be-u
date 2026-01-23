/**
 * Agenda Screen
 * 
 * Displays a calendar agenda view showing Google Calendar events
 * and reservations for professionals/places.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeVariant } from '@/contexts/ThemeVariantContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@/hooks/useNavigation';
import { CalendarAgendaView, CalendarConnectionCard } from '@/features/calendar';
import { useAuth } from '@/features/auth';
import { Calendar, DateData } from 'react-native-calendars';

type ViewMode = 'week' | 'day';

export default function AgendaScreen() {
  const { colors } = useThemeVariant();
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const isProvider = user?.role === 'PROFESSIONAL' || user?.role === 'PLACE';

  // Calculate current week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);

  // Calculate day range for single day view
  const dayStart = new Date(selectedDay);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDay);
  dayEnd.setHours(23, 59, 59, 999);

  const handleDaySelect = (day: DateData) => {
    const selected = new Date(day.dateString + 'T00:00:00');
    setSelectedDay(selected);
    setShowCalendarPicker(false);
    setViewMode('day');
  };

  const formatSelectedDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDay);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDay(newDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 16,
          },
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBack('/(tabs)/perfil')}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Mi Agenda
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* View Mode Selector */}
      {isProvider && (
        <>
          <View style={styles.connectionSection}>
            <CalendarConnectionCard />
          </View>
          <View style={[styles.viewModeSelector, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.viewModeOption,
                viewMode === 'week' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode('week')}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.viewModeText,
                  { color: viewMode === 'week' ? '#ffffff' : colors.foreground },
                ]}>
                Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeOption,
                viewMode === 'day' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode('day')}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.viewModeText,
                  { color: viewMode === 'day' ? '#ffffff' : colors.foreground },
                ]}>
                Día
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Day Selector for Day View */}
      {isProvider && viewMode === 'day' && (
        <View style={[styles.daySelector, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.dayNavButton}
            onPress={() => navigateDay('prev')}
            activeOpacity={0.7}>
            <Ionicons name="chevron-back" color={colors.foreground} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dayPickerButton}
            onPress={() => setShowCalendarPicker(true)}
            activeOpacity={0.7}>
            <Ionicons name="calendar-outline" color={colors.primary} size={18} />
            <Text style={[styles.dayPickerText, { color: colors.foreground }]}>
              {formatSelectedDate(selectedDay)}
            </Text>
            <Ionicons name="chevron-down" color={colors.mutedForeground} size={16} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dayNavButton}
            onPress={() => navigateDay('next')}
            activeOpacity={0.7}>
            <Ionicons name="chevron-forward" color={colors.foreground} size={20} />
          </TouchableOpacity>
        </View>
      )}

      {/* Calendar Picker Modal */}
      <Modal
        visible={showCalendarPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendarPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Seleccionar Fecha
              </Text>
              <TouchableOpacity
                onPress={() => setShowCalendarPicker(false)}
                activeOpacity={0.7}>
                <Ionicons name="close" color={colors.foreground} size={24} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDaySelect}
              markedDates={{
                [selectedDay.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: colors.primary,
                },
              }}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                textSectionTitleColor: colors.mutedForeground,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.foreground,
                textDisabledColor: colors.mutedForeground,
                arrowColor: colors.primary,
                monthTextColor: colors.foreground,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Content */}
      {isProvider ? (
        <CalendarAgendaView
          startDate={viewMode === 'week' ? weekStart : dayStart}
          endDate={viewMode === 'week' ? weekEnd : dayEnd}
          showReservations={true}
          hideWeekSelector={viewMode === 'day'}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            Solo para profesionales
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            Esta vista está disponible solo para profesionales y lugares
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  viewModeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  connectionSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  viewModeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dayNavButton: {
    padding: 8,
  },
  dayPickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dayPickerText: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
  },
});




















