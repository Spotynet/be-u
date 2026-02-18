import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {reservationApi, profileCustomizationApi, serviceApi} from "@/lib/api";
import {Reservation} from "@/types/global";
import {useState, useEffect} from "react";
import {CalendarView} from "@/components/calendar";
import DateTimePicker from "@react-native-community/datetimepicker";
import {CancellationRetentionModal, RetentionAction} from "./CancellationRetentionModal";
import {CancellationReasonModal} from "./CancellationReasonModal";
import {CancellationSuccessModal} from "./CancellationSuccessModal";
import {
  CANCELLATION_REASONS,
  PROVIDER_CANCELLATION_REASONS,
} from "@/constants/cancellationReasons";

type ReservationActionsProps = {
  reservation: Reservation;
  isClient: boolean;
  isProvider?: boolean;
  onUpdated: (updated: Reservation) => void;
  onCancelled: () => void;
  /** "header" = compact icons; "default" = two buttons; "body" = link + Mejorar horario below card */
  variant?: "default" | "header" | "body";
};

function formatDateForInput(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDateToAPI(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTimeToDate(timeStr: string, baseDate: Date): Date {
  const [h, m] = (timeStr || "09:00").slice(0, 5).split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h || 9, m || 0, 0, 0);
  return d;
}

function formatTimeFromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ReservationActions({
  reservation,
  isClient,
  isProvider = false,
  onUpdated,
  onCancelled,
  variant = "default",
}: ReservationActionsProps) {
  const {colors} = useThemeVariant();
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modifyDate, setModifyDate] = useState(() => formatDateForInput(reservation.date));
  const [modifyTime, setModifyTime] = useState(() =>
    parseTimeToDate(reservation.time, formatDateForInput(reservation.date))
  );
  const [modifyNotes, setModifyNotes] = useState(reservation.notes || "");
  const [scheduleData, setScheduleData] = useState<{
    working_hours: {start: string; end: string} | null;
    booked_slots: {start: string; end: string}[];
    break_times: {start: string; end: string}[];
  } | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [disabledDaysIndexes, setDisabledDaysIndexes] = useState<number[] | undefined>(undefined);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [dateAvailabilityError, setDateAvailabilityError] = useState<string | null>(null);
  const [showSimpleDatePicker, setShowSimpleDatePicker] = useState(false);
  const [showSimpleTimePicker, setShowSimpleTimePicker] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const providerId = Number(reservation.provider_details?.id ?? 0);
  const providerType = (reservation.provider_type || "professional") as "professional" | "place";
  const serviceInstanceId =
    reservation.service_instance_id ?? reservation.service_details?.id ?? reservation.service ?? 0;
  const durationMinutes =
    typeof reservation.duration_minutes === "number"
      ? reservation.duration_minutes
      : 60;

  const canModifyOrCancel =
    (isClient || isProvider) &&
    (reservation.status === "PENDING" || reservation.status === "CONFIRMED");

  const UNAVAILABLE_MSG =
    "No disponible en la fecha seleccionada. Selecciona otro día.";

  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const parseLocalDate = (ymd: string): Date => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const isSelectedDateToday = (dateStr: string) =>
    dateStr === formatLocalDate(new Date());

  const getCurrentTimeMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const filterPastTimesForToday = (times: string[], dateStr: string): string[] => {
    if (!isSelectedDateToday(dateStr)) return times;
    const nowMinutes = getCurrentTimeMinutes();
    return times.filter((t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m > nowMinutes;
    });
  };

  const computeAvailableTimes = (
    schedule: NonNullable<typeof scheduleData>,
    dur: number
  ): string[] => {
    if (!schedule.working_hours) return [];
    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };
    const workStart = toMinutes(schedule.working_hours.start);
    const workEnd = toMinutes(schedule.working_hours.end);
    const overlaps = (start: number, end: number, a: number, b: number) =>
      start < b && end > a;
    const isFree = (start: number) => {
      const end = start + dur;
      if (start < workStart || end > workEnd) return false;
      for (const slot of schedule.booked_slots) {
        const [sh, sm] = slot.start.split(":").map(Number);
        const [eh, em] = slot.end.split(":").map(Number);
        if (overlaps(start, end, sh * 60 + sm, eh * 60 + em)) return false;
      }
      for (const br of schedule.break_times) {
        const [bh, bm] = br.start.split(":").map(Number);
        const [eh, em] = br.end.split(":").map(Number);
        if (overlaps(start, end, bh * 60 + bm, eh * 60 + em)) return false;
      }
      return true;
    };
    const result: string[] = [];
    for (let t = workStart; t + dur <= workEnd; t += 15) {
      if (isFree(t)) {
        const hh = Math.floor(t / 60).toString().padStart(2, "0");
        const mm = (t % 60).toString().padStart(2, "0");
        result.push(`${hh}:${mm}`);
      }
    }
    return result;
  };

  const handleDateSelect = async (date: string) => {
    const dateObj = parseLocalDate(date);
    setModifyDate(dateObj);
    setModifyTime(parseTimeToDate("00:00", dateObj));
    setDateAvailabilityError(null);
    setAvailableTimes([]);
    setScheduleData(null);

    if (providerId <= 0) {
      setModifyDate(dateObj);
      return;
    }

    setLoadingSchedule(true);
    try {
      const trimTime = (t: string) => t.slice(0, 5);
      const getBackendDayOfWeek = (d: Date) => (d.getDay() + 6) % 7;

      let computedSchedule: typeof scheduleData = null;

      try {
        const publicResp = await profileCustomizationApi.getPublicAvailability(
          providerType,
          providerId
        );
        const schedules = publicResp.data || [];
        if (schedules.length > 0) {
          const availableDays = new Set<number>();
          schedules.forEach((s: any) => {
            if (s.is_available && Array.isArray(s.time_slots) && s.time_slots.length > 0) {
              availableDays.add((s.day_of_week + 1) % 7);
            }
          });
          const disabled = [0, 1, 2, 3, 4, 5, 6].filter((d) => !availableDays.has(d));
          setDisabledDaysIndexes(
            availableDays.size === 0 ? [0, 1, 2, 3, 4, 5, 6] : disabled.length === 7 ? undefined : disabled
          );
        }
        const targetDay = getBackendDayOfWeek(dateObj);
        const daySchedule = schedules.find(
          (s: any) =>
            s.day_of_week === targetDay &&
            s.is_available &&
            Array.isArray(s.time_slots) &&
            s.time_slots.length > 0
        );
        if (daySchedule) {
          const slots = daySchedule.time_slots;
          const firstSlot = slots[0];
          const lastSlot = slots[slots.length - 1];
          computedSchedule = {
            working_hours: {
              start: trimTime(firstSlot.start_time),
              end: trimTime(lastSlot.end_time),
            },
            booked_slots: [],
            break_times: [],
          };
        }
      } catch {}

      try {
        const response = await reservationApi.getProviderSchedule({
          provider_type: providerType,
          provider_id: providerId,
          date,
        });
        const scheduleFromApi = response.data;
        if (computedSchedule?.working_hours) {
          computedSchedule = {
            ...computedSchedule,
            booked_slots: scheduleFromApi?.booked_slots || [],
            break_times: scheduleFromApi?.break_times || [],
          };
        } else {
          computedSchedule = scheduleFromApi;
        }
      } catch {
        if (!computedSchedule)
          computedSchedule = {working_hours: null, booked_slots: [], break_times: []};
      }

      setScheduleData(computedSchedule);

      if (Number(serviceInstanceId) > 0 && providerType) {
        try {
          const slotsResponse = await serviceApi.getAvailableSlots({
            service_id: Number(serviceInstanceId),
            date,
            service_type: providerType,
          });
          const slots = slotsResponse.data?.slots || [];
          const available = slots
            .filter((s: any) => s.available)
            .map((s: any) => s.time)
            .filter((t: string) => typeof t === "string");
          setAvailableTimes(filterPastTimesForToday(available, date));
        } catch {
          if (computedSchedule) {
            const localTimes = computeAvailableTimes(computedSchedule, durationMinutes);
            setAvailableTimes(filterPastTimesForToday(localTimes, date));
          }
        }
      } else if (computedSchedule) {
        const localTimes = computeAvailableTimes(computedSchedule, durationMinutes);
        setAvailableTimes(filterPastTimesForToday(localTimes, date));
      }

      if (!computedSchedule?.working_hours) {
        setDateAvailabilityError(UNAVAILABLE_MSG);
      }
    } catch {
      setDateAvailabilityError(UNAVAILABLE_MSG);
      setScheduleData(null);
      setAvailableTimes([]);
      setDisabledDaysIndexes(undefined);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (showModifyModal && providerId > 0) {
      let cancelled = false;
      profileCustomizationApi
        .getPublicAvailability(providerType, providerId)
        .then((r) => {
          if (cancelled) return;
          const schedules = r.data || [];
          if (schedules.length > 0) {
            const availableDays = new Set<number>();
            schedules.forEach((s: any) => {
              if (s.is_available && Array.isArray(s.time_slots) && s.time_slots.length > 0) {
                availableDays.add((s.day_of_week + 1) % 7);
              }
            });
            const disabled = [0, 1, 2, 3, 4, 5, 6].filter((d) => !availableDays.has(d));
            setDisabledDaysIndexes(
              availableDays.size === 0 ? [0, 1, 2, 3, 4, 5, 6] : disabled.length === 7 ? undefined : disabled
            );
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [showModifyModal, providerId, providerType]);

  useEffect(() => {
    if (showModifyModal && modifyDate && providerId > 0) {
      handleDateSelect(formatLocalDate(modifyDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModifyModal]);

  if (!canModifyOrCancel) return null;

  const handleOpenRetention = () => {
    setShowRetentionModal(true);
  };

  const handleRetentionChoose = (action: RetentionAction) => {
    setShowRetentionModal(false);
    if (action === "reschedule") {
      openModifyModal();
      return;
    }
    if (action === "cancel") {
      setShowReasonModal(true);
    }
  };

  const handleConfirmCancelWithCode = async (reasonCode: string) => {
    setIsCancelling(true);
    try {
      await reservationApi.cancelReservation(reservation.id, reasonCode);
      setShowReasonModal(false);
      setShowSuccessModal(true);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.reason?.[0] ||
        e?.message ||
        "No se pudo cancelar la reserva";
      Alert.alert("Error", msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSuccessGoBack = () => {
    setShowSuccessModal(false);
    onCancelled();
  };

  const handleCancel = () => {
    if (isProvider) {
      setShowReasonModal(true);
      return;
    }
    handleOpenRetention();
  };

  const handleSaveModify = async () => {
    setIsSaving(true);
    try {
      const dateStr = formatDateToAPI(modifyDate);
      const timeStr = formatTimeFromDate(modifyTime);
      const res = await reservationApi.patchReservation(reservation.id, {
        date: dateStr,
        time: timeStr,
        notes: modifyNotes.trim() || undefined,
      });
      setShowModifyModal(false);
      if (res?.data) onUpdated(res.data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        (Array.isArray(e?.response?.data?.date)
          ? e.response.data.date[0]
          : null) ||
        (Array.isArray(e?.response?.data?.time)
          ? e.response.data.time[0]
          : null) ||
        e?.message ||
        "No se pudo modificar la reserva";
      Alert.alert("Error", String(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const openModifyModal = () => {
    setModifyDate(formatDateForInput(reservation.date));
    setModifyTime(
      parseTimeToDate(reservation.time, formatDateForInput(reservation.date))
    );
    setModifyNotes(reservation.notes || "");
    setShowModifyModal(true);
  };

  const headerButtons = variant === "header" && (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={[styles.headerButton, {borderColor: colors.border}]}
        onPress={openModifyModal}
        activeOpacity={0.7}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Ionicons name="create-outline" size={22} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.headerButton, {borderColor: colors.border}]}
        onPress={handleCancel}
        disabled={isCancelling}
        activeOpacity={0.7}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        {isCancelling ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        )}
      </TouchableOpacity>
    </View>
  );

  const defaultButtons = (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.modifyButton, {backgroundColor: colors.primary}]}
        onPress={openModifyModal}
        activeOpacity={0.8}>
        <Ionicons name="create-outline" size={18} color="#ffffff" />
        <Text style={styles.buttonText}>Modificar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton, {backgroundColor: "#ef4444"}]}
        onPress={handleCancel}
        disabled={isCancelling}
        activeOpacity={0.8}>
        {isCancelling ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons name="close-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Cancelar reserva</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const bodyLinks = variant === "body" && (
    <View style={styles.bodyLinksContainer}>
      <TouchableOpacity
        style={styles.bodyLinkTouchable}
        onPress={handleOpenRetention}
        activeOpacity={0.7}>
        <Text style={[styles.bodyLinkText, {color: colors.mutedForeground}]}>
          Necesito hacer cambios
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.improveButton, {backgroundColor: colors.primary}]}
        onPress={openModifyModal}
        activeOpacity={0.85}>
        <Ionicons name="calendar-outline" size={20} color={colors.primaryForeground} />
        <Text style={[styles.improveButtonText, {color: colors.primaryForeground}]}>
          Mejorar horario
        </Text>
      </TouchableOpacity>
      <Text style={[styles.improveHint, {color: colors.mutedForeground}]}>
        Busca una fecha más cercana sin perder tu lugar actual.
      </Text>
    </View>
  );

  const mainContent =
    variant === "header" ? headerButtons : variant === "body" ? bodyLinks : defaultButtons;

  return (
    <>
      {mainContent}
      <Modal
        visible={showModifyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModifyModal(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModifyModal(false)}>
          <Pressable
            style={[styles.modalContent, {backgroundColor: colors.card}]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              Mejoremos tu cita
            </Text>
            <Text style={[styles.modalSubtitle, {color: colors.mutedForeground}]}>
              Selecciona cuándo prefieres asistir. Mantendremos tu cita original hasta que aseguremos una de estas opciones.
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {providerId > 0 ? (
                <>
                  {dateAvailabilityError && (
                    <View style={[styles.errorCard, {backgroundColor: "#ef4444" + "20", borderColor: "#ef4444"}]}>
                      <Ionicons name="alert-circle" size={18} color="#ef4444" />
                      <Text style={[styles.errorCardText, {color: "#ef4444"}]}>{dateAvailabilityError}</Text>
                    </View>
                  )}

                  <Text style={[styles.label, {color: colors.foreground}]}>Fecha</Text>
                  <View style={styles.calendarWrapper}>
                    <CalendarView
                      reservations={[]}
                      onDayPress={handleDateSelect}
                      selectedDate={formatLocalDate(modifyDate)}
                      minDate={formatLocalDate(new Date())}
                      disabledDaysIndexes={disabledDaysIndexes}
                      showLegend={false}
                    />
                  </View>

                  {modifyDate && (
                    <View style={styles.timeSection}>
                      <Text style={[styles.label, {color: colors.foreground, marginTop: 12}]}>Hora</Text>
                      {loadingSchedule ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
                            Cargando horarios...
                          </Text>
                        </View>
                      ) : scheduleData?.working_hours ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.timeChipsRow}>
                          {availableTimes.map((t) => {
                            const isSelected = formatTimeFromDate(modifyTime) === t;
                            return (
                              <TouchableOpacity
                                key={t}
                                style={[
                                  styles.timeChip,
                                  {
                                    backgroundColor: isSelected ? colors.primary : colors.background,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                  },
                                ]}
                                onPress={() => {
                                  const [h, m] = t.split(":").map(Number);
                                  const d = new Date(modifyDate);
                                  d.setHours(h, m, 0, 0);
                                  setModifyTime(d);
                                }}
                                activeOpacity={0.8}>
                                <Text
                                  style={[
                                    styles.timeChipText,
                                    {color: isSelected ? "#ffffff" : colors.foreground},
                                  ]}>
                                  {t}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      ) : null}
                      {scheduleData?.working_hours && availableTimes.length === 0 && !loadingSchedule && (
                        <Text style={[styles.noSlotsText, {color: colors.mutedForeground}]}>
                          No hay horarios disponibles para este día.
                        </Text>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.label, {color: colors.foreground}]}>Fecha</Text>
                  <TouchableOpacity
                    style={[styles.input, {borderColor: colors.border, backgroundColor: colors.background}]}
                    onPress={() => setShowSimpleDatePicker(true)}>
                    <Text style={{color: colors.foreground}}>
                      {modifyDate.toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                    <Ionicons name="calendar-outline" color={colors.mutedForeground} size={20} />
                  </TouchableOpacity>
                  {showSimpleDatePicker && (
                    <DateTimePicker
                      value={modifyDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      minimumDate={new Date()}
                      onChange={(_, d) => {
                        if (d) setModifyDate(d);
                        if (Platform.OS !== "ios") setShowSimpleDatePicker(false);
                      }}
                    />
                  )}

                  <Text style={[styles.label, {color: colors.foreground, marginTop: 12}]}>Hora</Text>
                  <TouchableOpacity
                    style={[styles.input, {borderColor: colors.border, backgroundColor: colors.background}]}
                    onPress={() => setShowSimpleTimePicker(true)}>
                    <Text style={{color: colors.foreground}}>
                      {formatTimeFromDate(modifyTime)}
                    </Text>
                    <Ionicons name="time-outline" color={colors.mutedForeground} size={20} />
                  </TouchableOpacity>
                  {showSimpleTimePicker && (
                    <DateTimePicker
                      value={modifyTime}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, d) => {
                        if (d) setModifyTime(d);
                        if (Platform.OS !== "ios") setShowSimpleTimePicker(false);
                      }}
                    />
                  )}
                </>
              )}

              <Text style={[styles.label, {color: colors.foreground, marginTop: 16}]}>
                Notas (opcional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {borderColor: colors.border, color: colors.foreground},
                ]}
                placeholder="Agregar o cambiar notas..."
                placeholderTextColor={colors.mutedForeground}
                value={modifyNotes}
                onChangeText={setModifyNotes}
                multiline
                numberOfLines={3}
              />

              <View style={[styles.safeModeRow, {marginTop: 20}]}>
                <View style={styles.safeModeLabelWrap}>
                  <Text style={[styles.label, {color: colors.foreground, marginBottom: 2}]}>
                    Modo Seguro
                  </Text>
                  <Text style={[styles.safeModeHint, {color: colors.mutedForeground}]}>
                    No cancelar mi cita actual hasta confirmar la nueva.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, {borderColor: colors.border}]}
                onPress={() => setShowModifyModal(false)}
                disabled={isSaving}>
                <Text style={{color: colors.foreground}}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, {backgroundColor: colors.primary}]}
                onPress={handleSaveModify}
                disabled={
                  isSaving ||
                  (providerId > 0 &&
                    availableTimes.length > 0 &&
                    !availableTimes.includes(formatTimeFromDate(modifyTime)))
                }>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Buscar mejor horario</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <CancellationRetentionModal
        visible={showRetentionModal}
        onClose={() => setShowRetentionModal(false)}
        onChoose={handleRetentionChoose}
      />
      <CancellationReasonModal
        visible={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        onConfirmCancel={handleConfirmCancelWithCode}
        onChooseReschedule={() => {
          setShowReasonModal(false);
          openModifyModal();
        }}
        isCancelling={isCancelling}
        reasons={isProvider ? PROVIDER_CANCELLATION_REASONS : CANCELLATION_REASONS}
      />
      <CancellationSuccessModal
        visible={showSuccessModal}
        onGoBack={handleSuccessGoBack}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modifyButton: {},
  cancelButton: {},
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  modalScroll: {
    maxHeight: 420,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorCardText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  calendarWrapper: {
    marginBottom: 8,
  },
  timeSection: {
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  timeChipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noSlotsText: {
    fontSize: 13,
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  safeModeRow: {
    paddingVertical: 8,
  },
  safeModeLabelWrap: {
    gap: 2,
  },
  safeModeHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonPrimaryText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
  bodyLinksContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  bodyLinkTouchable: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  bodyLinkText: {
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  improveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  improveButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  improveHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
