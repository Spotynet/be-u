/**
 * CalendarStatusBadge Component
 * 
 * Small badge component to show calendar connection status.
 * Can be used in profile headers or service cards.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarStatusBadgeProps {
  isConnected: boolean;
  hasCalendar?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export const CalendarStatusBadge: React.FC<CalendarStatusBadgeProps> = ({
  isConnected,
  hasCalendar = true,
  onPress,
  size = 'small',
  showLabel = true,
}) => {
  // Don't show anything if provider doesn't use calendar
  if (!hasCalendar) {
    return null;
  }

  const isSmall = size === 'small';

  const content = (
    <View style={[
      styles.container,
      isSmall ? styles.containerSmall : styles.containerMedium,
      isConnected ? styles.connected : styles.disconnected,
    ]}>
      <Ionicons
        name={isConnected ? "calendar" : "calendar-outline"}
        size={isSmall ? 12 : 16}
        color={isConnected ? "#34A853" : "#9E9E9E"}
      />
      {showLabel && (
        <Text style={[
          styles.label,
          isSmall ? styles.labelSmall : styles.labelMedium,
          isConnected ? styles.labelConnected : styles.labelDisconnected,
        ]}>
          {isConnected ? "Calendario sincronizado" : "Sin calendario"}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  connected: {
    backgroundColor: '#E6F4EA',
  },
  disconnected: {
    backgroundColor: '#F5F5F5',
  },
  label: {
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 11,
  },
  labelMedium: {
    fontSize: 13,
  },
  labelConnected: {
    color: '#137333',
  },
  labelDisconnected: {
    color: '#666',
  },
});

export default CalendarStatusBadge;











