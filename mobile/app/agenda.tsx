/**
 * Agenda Screen
 * 
 * Displays a calendar agenda view showing Google Calendar events
 * and reservations for professionals/places.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeVariant } from '@/contexts/ThemeVariantContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@/hooks/useNavigation';
import { CalendarAgendaView } from '@/features/calendar';
import { useAuth } from '@/features/auth';

export default function AgendaScreen() {
  const { colors } = useThemeVariant();
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();
  const { user } = useAuth();

  const isProvider = user?.role === 'PROFESSIONAL' || user?.role === 'PLACE';

  // Calculate current week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);

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

      {/* Content */}
      {isProvider ? (
        <CalendarAgendaView
          startDate={weekStart}
          endDate={weekEnd}
          showReservations={true}
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








