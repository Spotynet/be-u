/**
 * CalendarAgendaView Component
 * 
 * Displays a calendar agenda view showing Google Calendar events
 * and reservations for professionals/places.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeVariant } from '@/contexts/ThemeVariantContext';
import { useCalendarEvents, CalendarEvent } from '../hooks/useCalendarEvents';
import { useReservations } from '@/features/reservations';
// Simple date utilities (date-fns not installed, using native Date)
const formatDate = (date: Date, formatStr: string): string => {
  const day = date.getDate();
  const month = date.toLocaleDateString('es-ES', { month: 'short' });
  const year = date.getFullYear();
  const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return formatStr
    .replace('d', day.toString())
    .replace('MMM', month)
    .replace('yyyy', year.toString())
    .replace('EEEE', dayName)
    .replace('HH:mm', `${hours}:${minutes}`);
};

const parseISO = (isoString: string): Date => {
  return new Date(isoString);
};

const startOfWeek = (date: Date, options?: { weekStartsOn?: number }): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (options?.weekStartsOn || 0);
  return new Date(d.setDate(diff));
};

const endOfWeek = (date: Date, options?: { weekStartsOn?: number }): Date => {
  const start = startOfWeek(date, options);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const eachDayOfInterval = (interval: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  const current = new Date(interval.start);
  while (current <= interval.end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

interface CalendarAgendaViewProps {
  startDate?: Date;
  endDate?: Date;
  showReservations?: boolean;
  hideWeekSelector?: boolean; // Hide week selector for day view
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  startDate,
  endDate,
  showReservations = true,
  hideWeekSelector = false,
}) => {
  const { colors } = useThemeVariant();
  const [selectedDate, setSelectedDate] = useState<Date>(startDate || new Date());
  
  // Calculate initial date range (default to current week)
  const initialWeekStart = startDate || startOfWeek(new Date(), { weekStartsOn: 1 });
  const initialWeekEnd = endDate || endOfWeek(new Date(), { weekStartsOn: 1 });
  
  // Use state for week range so it updates when user navigates
  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart);
  const [weekEnd, setWeekEnd] = useState<Date>(initialWeekEnd);
  
  // Update week range when props change
  useEffect(() => {
    if (startDate) {
      setWeekStart(startDate);
    }
    if (endDate) {
      setWeekEnd(endDate);
    }
  }, [startDate, endDate]);
  
  const startISO = weekStart.toISOString();
  const endISO = weekEnd.toISOString();

  const { events, isLoading, error, hasCalendar, fetchEvents } = useCalendarEvents();
  const { reservations, isLoading: loadingReservations, refreshReservations } = useReservations();
  
  // Fetch events and reservations on mount
  useEffect(() => {
    fetchEvents(startISO, endISO);
    if (showReservations) {
      refreshReservations();
    }
  }, [startISO, endISO]);

  // Helper to check if date is before a reference date
  const isBeforeDate = (date1: Date, date2: Date): boolean => {
    return date1.getTime() < date2.getTime();
  };

  // Combine events and reservations
  const getEventsForDate = (date: Date): Array<CalendarEvent & { type: 'google' | 'reservation' }> => {
    const combined: Array<CalendarEvent & { type: 'google' | 'reservation' }> = [];

    // Add Google Calendar events
    events.forEach(event => {
      try {
        const eventDate = parseISO(event.start);
        if (isSameDay(eventDate, date)) {
          combined.push({ ...event, type: 'google' });
        }
      } catch (e) {
        console.error('Error parsing event date:', e);
      }
    });

    // Add reservations
    if (showReservations && reservations && Array.isArray(reservations)) {
      reservations.forEach((reservation: any) => {
        try {
          const resDate = new Date(reservation.date);
          if (isSameDay(resDate, date)) {
            const startTime = reservation.time || '00:00';
            const endTime = reservation.end_time || startTime;
            combined.push({
              id: `reservation-${reservation.id}`,
              summary: `Reserva: ${reservation.service?.name || reservation.service_name || 'Servicio'}`,
              description: reservation.notes || '',
              location: reservation.location || '',
              start: `${reservation.date}T${startTime}`,
              end: `${reservation.date}T${endTime}`,
              htmlLink: '',
              status: reservation.status,
              attendees: [],
              type: 'reservation',
            });
          }
        } catch (e) {
          console.error('Error processing reservation:', e);
        }
      });
    }

    return combined.sort((a, b) => {
      try {
        const timeA = parseISO(a.start).getTime();
        const timeB = parseISO(b.start).getTime();
        return timeA - timeB;
      } catch {
        return 0;
      }
    });
  };

  // Get all events grouped by date
  const getAllEventsGrouped = (): Record<string, Array<CalendarEvent & { type: 'google' | 'reservation' }>> => {
    const grouped: Record<string, Array<CalendarEvent & { type: 'google' | 'reservation' }>> = {};

    // Process Google Calendar events
    events.forEach(event => {
      try {
        const eventDate = parseISO(event.start);
        const dateKey = eventDate.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push({ ...event, type: 'google' });
      } catch (e) {
        console.error('Error parsing event date:', e);
      }
    });

    // Process reservations
    if (showReservations && reservations && Array.isArray(reservations)) {
      reservations.forEach((reservation: any) => {
        try {
          const resDate = new Date(reservation.date);
          const dateKey = resDate.toISOString().split('T')[0];
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          const startTime = reservation.time || '00:00';
          const endTime = reservation.end_time || startTime;
          grouped[dateKey].push({
            id: `reservation-${reservation.id}`,
            summary: `Reserva: ${reservation.service?.name || reservation.service_name || 'Servicio'}`,
            description: reservation.notes || '',
            location: reservation.location || '',
            start: `${reservation.date}T${startTime}`,
            end: `${reservation.date}T${endTime}`,
            htmlLink: '',
            status: reservation.status,
            attendees: [],
            type: 'reservation',
          });
        } catch (e) {
          console.error('Error processing reservation:', e);
        }
      });
    }

    // Sort events within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        try {
          const timeA = parseISO(a.start).getTime();
          const timeB = parseISO(b.start).getTime();
          return timeA - timeB;
        } catch {
          return 0;
        }
      });
    });

    return grouped;
  };

  // Separate events into current period: past events (before today) and future/present events
  const allEventsGrouped = getAllEventsGrouped();
  const currentPeriodEvents: Record<string, Array<CalendarEvent & { type: 'google' | 'reservation' }>> = {};
  const pastEventsInPeriod: Array<{ date: Date; events: Array<CalendarEvent & { type: 'google' | 'reservation' }> }> = [];
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStartNormalized = new Date(weekStart);
  weekStartNormalized.setHours(0, 0, 0, 0);
  const weekEndNormalized = new Date(weekEnd);
  weekEndNormalized.setHours(23, 59, 59, 999);

  Object.keys(allEventsGrouped).forEach(dateKey => {
    try {
      const eventDate = new Date(dateKey + 'T00:00:00');
      eventDate.setHours(0, 0, 0, 0);
      
      // Only process events within the current period
      if (eventDate >= weekStartNormalized && eventDate <= weekEndNormalized) {
        // Check if event is in the past (before today)
        if (eventDate < todayStart) {
          // Event is in the past but within the selected period
          pastEventsInPeriod.push({
            date: eventDate,
            events: allEventsGrouped[dateKey],
          });
        } else {
          // Event is today or in the future, within the selected period
          currentPeriodEvents[dateKey] = allEventsGrouped[dateKey];
        }
      }
      // Ignore events outside the current period
    } catch (e) {
      console.error('Error processing date key:', dateKey, e);
    }
  });

  // Sort past events by date (most recent first)
  pastEventsInPeriod.sort((a, b) => b.date.getTime() - a.date.getTime());

  const openGoogleEvent = (htmlLink: string) => {
    if (htmlLink) {
      Linking.openURL(htmlLink);
    }
  };

  const formatEventTime = (start: string, end: string): string => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      return `${startTime} - ${endTime}`;
    } catch {
      return start;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return '#34A853';
      case 'PENDING':
        return '#FBBC04';
      case 'CANCELLED':
        return '#EA4335';
      case 'COMPLETED':
        return '#4285F4';
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'Confirmada';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelada';
      case 'COMPLETED':
        return 'Completada';
      default:
        return status || '';
    }
  };

  if (!hasCalendar && !showReservations) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="calendar-outline" size={64} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.foreground }]}>
          No hay calendario conectado
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Conecta tu Google Calendar para ver tus eventos aquí
        </Text>
      </View>
    );
  }

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Cargando eventos...
        </Text>
      </View>
    );
  }

  // Get all days in the range
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Week selector - only show if not in day view */}
      {!hideWeekSelector && (
        <View style={[styles.weekSelector, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={() => {
              const newStart = new Date(weekStart);
              newStart.setDate(newStart.getDate() - 7);
              const newEnd = new Date(weekEnd);
              newEnd.setDate(newEnd.getDate() - 7);
              // Update state to reflect new period
              setWeekStart(newStart);
              setWeekEnd(newEnd);
              // Fetch events for new period
              fetchEvents(newStart.toISOString(), newEnd.toISOString());
            }}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          
          <Text style={[styles.weekText, { color: colors.foreground }]}>
            {formatDate(weekStart, 'd MMM')} - {formatDate(weekEnd, 'd MMM yyyy')}
          </Text>
          
          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={() => {
              const newStart = new Date(weekStart);
              newStart.setDate(newStart.getDate() + 7);
              const newEnd = new Date(weekEnd);
              newEnd.setDate(newEnd.getDate() + 7);
              // Update state to reflect new period
              setWeekStart(newStart);
              setWeekEnd(newEnd);
              // Fetch events for new period
              fetchEvents(newStart.toISOString(), newEnd.toISOString());
            }}>
            <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      )}

      {/* Events by day - Current Period */}
      {days.map((day) => {
        const dayKey = day.toISOString().split('T')[0];
        const dayEvents = currentPeriodEvents[dayKey] || [];
        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selectedDate);

        if (dayEvents.length === 0) {
          return null;
        }

        return (
          <View key={day.toISOString()} style={[styles.daySection, { backgroundColor: colors.background }]}>
            {/* Day header */}
            <View style={[styles.dayHeader, { backgroundColor: colors.card }]}>
              <View style={styles.dayHeaderLeft}>
                <Text style={[styles.dayName, { color: colors.foreground }]}>
                  {formatDate(day, 'EEEE')}
                </Text>
                <Text style={[styles.dayDate, { color: colors.mutedForeground }]}>
                  {formatDate(day, 'd MMM')}
                </Text>
              </View>
              {isToday && (
                <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.todayText}>Hoy</Text>
                </View>
              )}
              <Text style={[styles.eventCount, { color: colors.mutedForeground }]}>
                {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
              </Text>
            </View>

            {/* Events list */}
            {dayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { backgroundColor: colors.card, borderLeftColor: event.type === 'google' ? '#4285F4' : getStatusColor(event.status) }]}
                onPress={() => {
                  if (event.type === 'google' && event.htmlLink) {
                    openGoogleEvent(event.htmlLink);
                  }
                }}
                activeOpacity={0.7}>
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventIconContainer}>
                      <Ionicons
                        name={event.type === 'google' ? 'calendar' : 'time'}
                        size={20}
                        color={event.type === 'google' ? '#4285F4' : getStatusColor(event.status)}
                      />
                    </View>
                    <View style={styles.eventTitleContainer}>
                      <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {event.summary}
                      </Text>
                      {event.type === 'reservation' && (
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                            {getStatusText(event.status)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {event.type === 'google' && event.htmlLink && (
                      <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
                    )}
                  </View>

                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>
                        {formatEventTime(event.start, event.end)}
                      </Text>
                    </View>

                    {event.location && (
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                    )}

                    {event.description && (
                      <Text style={[styles.eventDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {event.description}
                      </Text>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>
                          {event.attendees.length} {event.attendees.length === 1 ? 'invitado' : 'invitados'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}

      {/* Empty state for current period */}
      {days.every(day => {
        const dayKey = day.toISOString().split('T')[0];
        return !currentPeriodEvents[dayKey] || currentPeriodEvents[dayKey].length === 0;
      }) && pastEventsInPeriod.length === 0 && (
        <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="calendar-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            No hay eventos en este período
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            {hasCalendar
              ? 'No tienes eventos de Google Calendar ni reservas en estas fechas'
              : 'Conecta tu Google Calendar para ver tus eventos aquí'}
          </Text>
        </View>
      )}

      {/* Past Events Section - Events from the selected period that are in the past */}
      {pastEventsInPeriod.length > 0 && (
        <View style={[styles.pastEventsSection, { backgroundColor: colors.background }]}>
          <View style={[styles.pastEventsHeader, { backgroundColor: colors.card }]}>
            <Ionicons name="time-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.pastEventsTitle, { color: colors.foreground }]}>
              Eventos Pasados
            </Text>
          </View>
          
          {pastEventsInPeriod.map((pastEventGroup) => {
            const dayKey = pastEventGroup.date.toISOString().split('T')[0];
            const dayEvents = pastEventGroup.events;
            const isToday = isSameDay(pastEventGroup.date, new Date());

            return (
              <View key={dayKey} style={[styles.daySection, { backgroundColor: colors.background }]}>
                {/* Day header */}
                <View style={[styles.dayHeader, { backgroundColor: colors.card, opacity: 0.7 }]}>
                  <View style={styles.dayHeaderLeft}>
                    <Text style={[styles.dayName, { color: colors.mutedForeground }]}>
                      {formatDate(pastEventGroup.date, 'EEEE')}
                    </Text>
                    <Text style={[styles.dayDate, { color: colors.mutedForeground }]}>
                      {formatDate(pastEventGroup.date, 'd MMM yyyy')}
                    </Text>
                  </View>
                  <Text style={[styles.eventCount, { color: colors.mutedForeground }]}>
                    {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                  </Text>
                </View>

                {/* Events list */}
                {dayEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventCard, { backgroundColor: colors.card, borderLeftColor: event.type === 'google' ? '#4285F4' : getStatusColor(event.status), opacity: 0.8 }]}
                    onPress={() => {
                      if (event.type === 'google' && event.htmlLink) {
                        openGoogleEvent(event.htmlLink);
                      }
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <View style={styles.eventIconContainer}>
                          <Ionicons
                            name={event.type === 'google' ? 'calendar' : 'time'}
                            size={20}
                            color={event.type === 'google' ? '#4285F4' : getStatusColor(event.status)}
                          />
                        </View>
                        <View style={styles.eventTitleContainer}>
                          <Text style={[styles.eventTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {event.summary}
                          </Text>
                          {event.type === 'reservation' && (
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) + '20' }]}>
                              <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                                {getStatusText(event.status)}
                              </Text>
                            </View>
                          )}
                        </View>
                        {event.type === 'google' && event.htmlLink && (
                          <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
                        )}
                      </View>

                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                          <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>
                            {formatEventTime(event.start, event.end)}
                          </Text>
                        </View>

                        {event.location && (
                          <View style={styles.eventDetailRow}>
                            <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                            <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {event.location}
                            </Text>
                          </View>
                        )}

                        {event.description && (
                          <Text style={[styles.eventDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                            {event.description}
                          </Text>
                        )}

                        {event.attendees && event.attendees.length > 0 && (
                          <View style={styles.eventDetailRow}>
                            <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
                            <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>
                              {event.attendees.length} {event.attendees.length === 1 ? 'invitado' : 'invitados'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FEE8E7' }]}>
          <Ionicons name="warning" size={20} color="#EA4335" />
          <Text style={[styles.errorText, { color: '#C62828' }]}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  weekNavButton: {
    padding: 8,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
  },
  daySection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dayDate: {
    fontSize: 14,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  eventCount: {
    fontSize: 12,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  eventIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventDetails: {
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 13,
  },
  eventDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    margin: 16,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  pastEventsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  pastEventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  pastEventsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalendarAgendaView;

