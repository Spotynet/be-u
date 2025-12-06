import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useMemo} from "react";
import {useAuth} from "@/features/auth";
import {useAvailability} from "@/features/services";
import {AvailabilityEditor} from "@/components/calendar";
import {WeeklySchedule} from "@/types/global";
import {useNavigation} from "@/hooks/useNavigation";
import {useRouter} from "expo-router";
import {authApi} from "@/lib/api";
import {
  CalendarStatusBadge,
  useCalendarIntegration,
  useCalendarEvents,
} from "@/features/calendar";

export default function AvailabilityScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {goBack} = useNavigation();
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const [providerId, setProviderId] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";
  const providerType = user?.role === "PROFESSIONAL" ? "professional" : "place";

  // Fetch profile ID from API
  useEffect(() => {
    const fetchProfileId = async () => {
      if (!user || !isProvider) {
        setLoadingProfile(false);
        return;
      }

      try {
        const response = await authApi.getProfile();
        const profileId = response.data?.profile?.id;
        if (profileId) {
          setProviderId(profileId);
        }
      } catch (error) {
        console.error("Error fetching profile ID:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileId();
  }, [user, isProvider]);

  const {
    availability,
    isLoading,
    error,
    fetchAvailability,
    updateAvailability,
    availabilityToSchedule,
  } = useAvailability(providerId, providerType as any);

  // Google Calendar integration
  const {status: calendarStatus} = useCalendarIntegration();
  const {
    events,
    isLoading: loadingEvents,
    error: eventsError,
    fetchEvents,
  } = useCalendarEvents();

  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 7-day window for events (today -> 6 días)
  const {rangeStartISO, rangeEndISO, dayLabels} = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const labels: Record<string, {label: string; shortLabel: string}> = {};
    const today = start.getTime();
    const tomorrow = new Date(start);
    tomorrow.setDate(start.getDate() + 1);
    const tomorrowTs = tomorrow.getTime();

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = day.toISOString().split("T")[0];
      const base = {
        label: day.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        shortLabel: day.toLocaleDateString("es-ES", {weekday: "short"}),
      };

      if (day.getTime() === today) {
        labels[key] = {label: "Hoy", shortLabel: "Hoy"};
      } else if (day.getTime() === tomorrowTs) {
        labels[key] = {label: "Mañana", shortLabel: "Mañana"};
      } else {
        labels[key] = base;
      }
    }

    return {
      rangeStartISO: start.toISOString(),
      rangeEndISO: end.toISOString(),
      dayLabels: labels,
    };
  }, []);

  useEffect(() => {
    if (calendarStatus?.is_connected) {
      fetchEvents(rangeStartISO, rangeEndISO, 100);
    }
  }, [calendarStatus?.is_connected, rangeStartISO, rangeEndISO, fetchEvents]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof events> = {};
    events.forEach((evt) => {
      const dateKey = (evt.start && evt.start.split("T")[0]) || "";
      if (!dateKey) return;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(evt);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    });
    return groups;
  }, [events]);

  const formatEventTime = (startTime: string, endTime: string, isAllDay?: boolean) => {
    if (isAllDay) return "Todo el día";
    try {
      const s = new Date(startTime);
      const e = new Date(endTime);
      const toHHMM = (d: Date) =>
        `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      return `${toHHMM(s)} - ${toHHMM(e)}`;
    } catch {
      return startTime;
    }
  };

  useEffect(() => {
    if (isAuthenticated && isProvider && providerId) {
      fetchAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isProvider, providerId]);

  useEffect(() => {
    if (!isLoading && availability.length > 0) {
      const weeklySchedule = availabilityToSchedule(availability);
      setSchedule(weeklySchedule);
      setHasChanges(false);
    } else if (!isLoading && availability.length === 0 && providerId) {
      // Default schedule (Monday-Friday, 9AM-6PM) - only set if we've already fetched
      setSchedule({
        0: {enabled: true, start_time: "09:00", end_time: "18:00"},
        1: {enabled: true, start_time: "09:00", end_time: "18:00"},
        2: {enabled: true, start_time: "09:00", end_time: "18:00"},
        3: {enabled: true, start_time: "09:00", end_time: "18:00"},
        4: {enabled: true, start_time: "09:00", end_time: "18:00"},
        5: {enabled: false, start_time: "09:00", end_time: "18:00"},
        6: {enabled: false, start_time: "09:00", end_time: "18:00"},
      });
    }
  }, [availability, isLoading, providerId]);

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateAvailability(schedule);
      setHasChanges(false);
      // Refresh availability after save
      await fetchAvailability();
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Show loading while fetching profile
  if (loadingProfile) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/(tabs)/perfil")}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Disponibilidad</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // Redirect if not a provider
  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/(tabs)/perfil")}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Disponibilidad</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Solo profesionales y lugares pueden gestionar su disponibilidad
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
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
          onPress={() => goBack("/(tabs)/perfil")}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>
          Gestionar Disponibilidad
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {isLoading && Object.keys(schedule).length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando disponibilidad...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, {backgroundColor: colors.primary + "10"}]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.infoText, {color: colors.primary}]}>
              Configura tu horario semanal. Los clientes solo podrán reservar en los horarios que
              marques como disponibles.
            </Text>
          </View>

          {/* Google Calendar Integration Notice */}
          <View style={[styles.calendarCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.calendarCardHeader}>
              <View style={styles.calendarCardLeft}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={[styles.calendarCardTitle, {color: colors.foreground}]}>
                  Sincronización con Google Calendar
                </Text>
              </View>
              <CalendarStatusBadge
                isConnected={calendarStatus?.is_connected || false}
                hasCalendar={true}
                size="small"
                showLabel={false}
              />
            </View>
            <Text style={[styles.calendarCardText, {color: colors.mutedForeground}]}>
              {calendarStatus?.is_connected
                ? "Tu Google Calendar está conectado. Los eventos de tu calendario se mostrarán como no disponibles automáticamente."
                : "Conecta tu Google Calendar para sincronizar automáticamente tu disponibilidad. Los horarios ocupados en tu calendario personal se reflejarán aquí."}
            </Text>
            <View style={styles.calendarActions}>
              {!calendarStatus?.is_connected && (
                <TouchableOpacity
                  style={[styles.calendarLinkButton, {borderColor: colors.primary}]}
                  onPress={() => {
                    router.push("/settings");
                  }}>
                  <Text style={[styles.calendarLinkText, {color: colors.primary}]}>
                    Conectar Google Calendar →
                  </Text>
                </TouchableOpacity>
              )}
              {calendarStatus?.is_connected && (
                <TouchableOpacity
                  style={[styles.calendarLinkButton, {borderColor: colors.primary, backgroundColor: colors.primary + "10"}]}
                  onPress={() => {
                    router.push("/agenda");
                  }}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.calendarLinkText, {color: colors.primary}]}>
                    Ver Mi Agenda
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Google Calendar events preview */}
          {calendarStatus?.is_connected && (
            <View style={[styles.eventsCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.eventsHeader}>
                <View style={styles.eventsHeaderLeft}>
                  <Ionicons name="list-circle" size={22} color={colors.primary} />
                  <View>
                    <Text style={[styles.eventsTitle, {color: colors.foreground}]}>
                      Próximos eventos (7 días)
                    </Text>
                    <Text style={[styles.eventsSubtitle, {color: colors.mutedForeground}]}>
                      Tus eventos de Google Calendar se muestran aquí
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => fetchEvents(rangeStartISO, rangeEndISO, 100)}
                  disabled={loadingEvents}
                  activeOpacity={0.7}>
                  {loadingEvents ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="refresh" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

              {loadingEvents && events.length === 0 ? (
                <View style={styles.eventsLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.eventsLoadingText, {color: colors.mutedForeground}]}>
                    Cargando eventos...
                  </Text>
                </View>
              ) : Object.keys(groupedEvents).length === 0 ? (
                <View style={styles.eventsEmpty}>
                  <Ionicons name="calendar-outline" size={40} color={colors.mutedForeground} />
                  <Text style={[styles.eventsEmptyTitle, {color: colors.foreground}]}>
                    Sin eventos esta semana
                  </Text>
                  <Text style={[styles.eventsEmptyText, {color: colors.mutedForeground}]}>
                    Los eventos de tu Google Calendar aparecerán aquí.
                  </Text>
                </View>
              ) : (
                Object.keys(groupedEvents)
                  .sort()
                  .map((dayKey) => {
                    const dayEvents = groupedEvents[dayKey];
                    const labels = dayLabels[dayKey] || {label: dayKey, shortLabel: dayKey};
                    return (
                      <View key={dayKey} style={[styles.dayGroup, {borderColor: colors.border}]}>
                        <View style={styles.dayGroupHeader}>
                          <Text style={[styles.dayGroupLabel, {color: colors.foreground}]}>
                            {labels.label}
                          </Text>
                          <Text style={[styles.dayGroupCount, {color: colors.mutedForeground}]}>
                            {dayEvents.length} {dayEvents.length === 1 ? "evento" : "eventos"}
                          </Text>
                        </View>
                        {dayEvents.map((evt) => (
                          <View
                            key={evt.id}
                            style={[
                              styles.eventItem,
                              {backgroundColor: colors.background, borderColor: colors.border},
                            ]}>
                            <View style={styles.eventItemHeader}>
                              <Text
                                style={[styles.eventTitle, {color: colors.foreground}]}
                                numberOfLines={1}>
                                {evt.summary || "Sin título"}
                              </Text>
                              <Ionicons name="ellipse" size={10} color={colors.primary} />
                            </View>
                            <Text style={[styles.eventTime, {color: colors.mutedForeground}]}>
                              {formatEventTime(evt.start, evt.end, (evt as any).is_all_day)}
                            </Text>
                            {evt.location ? (
                              <Text style={[styles.eventLocation, {color: colors.mutedForeground}]}>
                                {evt.location}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    );
                  })
              )}

              {eventsError && (
                <View style={[styles.eventsError, {backgroundColor: "#FEE8E7"}]}>
                  <Ionicons name="warning" size={16} color="#C62828" />
                  <Text style={[styles.eventsErrorText, {color: "#C62828"}]}>
                    {eventsError}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.fullAgendaButton, {borderColor: colors.primary}]}
                onPress={() => router.push("/agenda")}>
                <Text style={[styles.fullAgendaText, {color: colors.primary}]}>
                  Ver agenda completa →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <AvailabilityEditor schedule={schedule} onChange={handleScheduleChange} />
        </ScrollView>
      )}

      {/* Save Button */}
      {hasChanges && (
        <View
          style={[
            styles.saveContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}>
          <TouchableOpacity
            style={[styles.saveButton, {backgroundColor: colors.primary}]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.9}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                <Text style={styles.saveButtonText}>Guardar Horario</Text>
              </>
            )}
          </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
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
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  saveContainer: {
    padding: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  calendarCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  calendarCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calendarCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  calendarCardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  calendarCardText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  calendarActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  calendarLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  calendarLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  eventsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eventsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  eventsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  eventsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventsLoadingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  eventsEmpty: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  eventsEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  eventsEmptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  dayGroup: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    gap: 8,
  },
  dayGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayGroupLabel: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  dayGroupCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  eventItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  eventItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  eventTime: {
    fontSize: 13,
    fontWeight: "500",
  },
  eventLocation: {
    fontSize: 12,
  },
  eventsError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  eventsErrorText: {
    fontSize: 13,
    flex: 1,
  },
  fullAgendaButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  fullAgendaText: {
    fontSize: 14,
    fontWeight: "700",
  },
});






































