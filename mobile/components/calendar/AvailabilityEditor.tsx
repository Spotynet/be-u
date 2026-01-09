import React, {useMemo, useState, useRef, useEffect} from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Modal} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {WeeklySchedule, DayOfWeek} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

interface AvailabilityEditorProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

const DAYS = [
  {id: 0, name: "Lunes", short: "L"},
  {id: 1, name: "Martes", short: "M"},
  {id: 2, name: "Miércoles", short: "X"},
  {id: 3, name: "Jueves", short: "J"},
  {id: 4, name: "Viernes", short: "V"},
  {id: 5, name: "Sábado", short: "S"},
  {id: 6, name: "Domingo", short: "D"},
];

export const AvailabilityEditor = ({schedule, onChange}: AvailabilityEditorProps) => {
  const {colors} = useThemeVariant();
  const [showTimePicker, setShowTimePicker] = useState<{
    day: number;
    type: "start" | "end";
  } | null>(null);
  const [showBreakPicker, setShowBreakPicker] = useState<{
    day: number;
    breakIndex?: number;
    type: "start" | "end";
  } | null>(null);
  const [iosTempDate, setIosTempDate] = useState<Date | null>(null);
  // Local state for web text inputs - allows free editing
  // Use ref to persist across re-renders caused by parent schedule updates
  const webTimeInputsRef = useRef<Record<string, string>>({});
  const [webTimeInputs, setWebTimeInputs] = useState<Record<string, string>>({});
  
  // Keep ref in sync with state
  useEffect(() => {
    webTimeInputsRef.current = webTimeInputs;
  }, [webTimeInputs]);

  const toggleDay = (dayId: number) => {
    const newSchedule = {...schedule};
    if (newSchedule[dayId]) {
      newSchedule[dayId].enabled = !newSchedule[dayId].enabled;
    } else {
      newSchedule[dayId] = {
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
        breaks: [],
      };
    }
    onChange(newSchedule);
  };

  const updateTime = (dayId: number, type: "start" | "end", time: string) => {
    const newSchedule = {...schedule};
    if (!newSchedule[dayId]) {
      newSchedule[dayId] = {
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
        breaks: [],
      };
    }

    if (type === "start") {
      newSchedule[dayId].start_time = time;
    } else {
      newSchedule[dayId].end_time = time;
    }

    onChange(newSchedule);
  };

  const normalizeTimeInput = (text: string): string => {
    // Allow empty string for deletion - don't restrict it
    if (text === "") return "";
    
    // Remove non-digit and non-colon characters, but allow partial input
    let cleaned = text.replace(/[^0-9:]/g, "");
    // Limit length to 5 (HH:MM) but allow shorter inputs
    if (cleaned.length > 5) cleaned = cleaned.slice(0, 5);
    
    // Don't auto-insert colon - let user type naturally
    // They can type "09:00" or "0900" and we'll format on blur if needed
    return cleaned;
  };

  const isValidTimeFormat = (time: string): boolean => {
    // Must match HH:MM format where HH is 00-23 and MM is 00-59
    if (!time || time.length === 0) return false;
    return /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(time);
  };

  const getWebInputKey = (dayId: number, type: "start" | "end", breakIndex?: number): string => {
    if (breakIndex !== undefined) {
      return `break_${dayId}_${breakIndex}_${type}`;
    }
    return `work_${dayId}_${type}`;
  };

  const handleWebTimeChange = (
    dayId: number,
    type: "start" | "end",
    text: string,
    breakIndex?: number
  ) => {
    const key = getWebInputKey(dayId, type, breakIndex);
    const normalized = normalizeTimeInput(text);
    
    // Always update local state immediately for responsive UI
    // This allows free editing including deletion
    setWebTimeInputs((prev) => {
      const next = {...prev};
      if (normalized === "") {
        // Keep empty string in state to allow deletion
        next[key] = "";
      } else {
        next[key] = normalized;
      }
      return next;
    });

    // Only update schedule if format is valid (don't update on partial input)
    if (isValidTimeFormat(normalized)) {
      if (breakIndex !== undefined) {
        updateBreakTime(dayId, breakIndex, type, normalized);
      } else {
        updateTime(dayId, type, normalized);
      }
    }
  };

  const formatTimeString = (input: string): string | null => {
    if (!input || input.length === 0) return null;
    
    // Remove all non-digits
    const digits = input.replace(/\D/g, "");
    
    // If we have 3-4 digits, try to format as HH:MM
    if (digits.length >= 3) {
      const hours = digits.slice(0, 2);
      const minutes = digits.slice(2, 4).padEnd(2, "0");
      const formatted = `${hours}:${minutes}`;
      if (isValidTimeFormat(formatted)) {
        return formatted;
      }
    }
    
    // If already in HH:MM format, validate it
    if (input.includes(":") && isValidTimeFormat(input)) {
      return input;
    }
    
    return null;
  };

  const handleWebTimeBlur = (
    dayId: number,
    type: "start" | "end",
    scheduleValue: string,
    breakIndex?: number
  ) => {
    const key = getWebInputKey(dayId, type, breakIndex);
    // Use ref to get the most current value
    const currentValue = webTimeInputsRef.current[key];
    
    // Try to format the input if it's not already in HH:MM format
    const formattedValue = currentValue ? formatTimeString(currentValue) : null;
    
    // On blur, validate and commit if valid, otherwise revert to schedule value
    if (formattedValue && isValidTimeFormat(formattedValue)) {
      if (breakIndex !== undefined) {
        updateBreakTime(dayId, breakIndex, type, formattedValue);
      } else {
        updateTime(dayId, type, formattedValue);
      }
    }
    
    // Always clear draft after blur (will show schedule value on next render)
    setWebTimeInputs((prev) => {
      const next = {...prev};
      delete next[key];
      return next;
    });
  };

  const getWebTimeValue = (
    dayId: number,
    type: "start" | "end",
    scheduleValue: string,
    breakIndex?: number
  ): string => {
    const key = getWebInputKey(dayId, type, breakIndex);
    // If there's a draft value (including empty string), use it
    if (key in webTimeInputs) {
      return webTimeInputs[key];
    }
    // Otherwise use the schedule value
    return scheduleValue || "";
  };

  const addBreak = (dayId: number) => {
    const newSchedule = {...schedule};
    if (!newSchedule[dayId] || !newSchedule[dayId].enabled) return;
    
    if (!newSchedule[dayId].breaks) {
      newSchedule[dayId].breaks = [];
    }
    
    // Add a default break (12:00 - 13:00)
    newSchedule[dayId].breaks.push({
      start_time: "12:00",
      end_time: "13:00",
      label: "Almuerzo",
      is_active: true,
    });
    
    onChange(newSchedule);
  };

  const removeBreak = (dayId: number, breakIndex: number) => {
    const newSchedule = {...schedule};
    if (!newSchedule[dayId] || !newSchedule[dayId].breaks) return;
    
    newSchedule[dayId].breaks = newSchedule[dayId].breaks.filter((_, idx) => idx !== breakIndex);
    onChange(newSchedule);
  };

  const updateBreakTime = (dayId: number, breakIndex: number, type: "start" | "end", time: string) => {
    const newSchedule = {...schedule};
    if (!newSchedule[dayId] || !newSchedule[dayId].breaks) return;
    
    if (newSchedule[dayId].breaks[breakIndex]) {
      if (type === "start") {
        newSchedule[dayId].breaks[breakIndex].start_time = time;
      } else {
        newSchedule[dayId].breaks[breakIndex].end_time = time;
      }
    }
    
    onChange(newSchedule);
  };

  const updateBreakLabel = (dayId: number, breakIndex: number, label: string) => {
    const newSchedule = {...schedule};
    if (!newSchedule[dayId] || !newSchedule[dayId].breaks) return;
    
    if (newSchedule[dayId].breaks[breakIndex]) {
      newSchedule[dayId].breaks[breakIndex].label = label;
    }
    
    onChange(newSchedule);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(null);
      setShowBreakPicker(null);
    }

    // On iOS, the spinner fires "set" continuously while scrolling.
    // We don't commit immediately; we store the temp selection and commit on "Done".
    if (Platform.OS === "ios") {
      if (selectedDate) setIosTempDate(selectedDate);
      return;
    }

    if (event.type === "set" && selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      if (showTimePicker) {
        updateTime(showTimePicker.day, showTimePicker.type, timeString);
      } else if (showBreakPicker && showBreakPicker.breakIndex !== undefined) {
        updateBreakTime(showBreakPicker.day, showBreakPicker.breakIndex, showBreakPicker.type, timeString);
      }
    } else if (event.type === "dismissed") {
      setShowTimePicker(null);
      setShowBreakPicker(null);
    }
  };

  const iosPickerVisible = Platform.OS === "ios" && (showTimePicker || showBreakPicker);

  const iosInitialDate = useMemo(() => {
    if (showTimePicker) {
      const daySchedule = schedule[showTimePicker.day];
      const timeStr = showTimePicker.type === "start" ? daySchedule?.start_time : daySchedule?.end_time;
      const [hours, minutes] = (timeStr || "09:00").split(":");
      const d = new Date();
      d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return d;
    }
    if (showBreakPicker && showBreakPicker.breakIndex !== undefined) {
      const daySchedule = schedule[showBreakPicker.day];
      const breakTime = daySchedule?.breaks?.[showBreakPicker.breakIndex];
      const timeStr = showBreakPicker.type === "start" ? breakTime?.start_time : breakTime?.end_time;
      const [hours, minutes] = (timeStr || "12:00").split(":");
      const d = new Date();
      d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  }, [showTimePicker, showBreakPicker, schedule]);

  const closeIosPicker = () => {
    setShowTimePicker(null);
    setShowBreakPicker(null);
    setIosTempDate(null);
  };

  const commitIosPicker = () => {
    const selected = iosTempDate || iosInitialDate;
    const hours = selected.getHours().toString().padStart(2, "0");
    const minutes = selected.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    if (showTimePicker) {
      updateTime(showTimePicker.day, showTimePicker.type, timeString);
    } else if (showBreakPicker && showBreakPicker.breakIndex !== undefined) {
      updateBreakTime(showBreakPicker.day, showBreakPicker.breakIndex, showBreakPicker.type, timeString);
    }

    closeIosPicker();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>Horario Semanal</Text>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Configura tu disponibilidad para cada día de la semana
        </Text>
      </View>

      <View style={styles.daysContainer}>
        {DAYS.map((day) => {
          const daySchedule = schedule[day.id];
          const isEnabled = daySchedule?.enabled ?? false;

          return (
            <View
              key={day.id}
              style={[
                styles.dayCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isEnabled ? colors.primary : colors.border,
                },
              ]}>
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <View
                    style={[
                      styles.dayBadge,
                      {backgroundColor: isEnabled ? colors.primary : colors.muted},
                    ]}>
                    <Text
                      style={[
                        styles.dayShort,
                        {color: isEnabled ? "#ffffff" : colors.mutedForeground},
                      ]}>
                      {day.short}
                    </Text>
                  </View>
                  <Text style={[styles.dayName, {color: colors.foreground}]}>{day.name}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.toggle,
                    {backgroundColor: isEnabled ? colors.primary : colors.muted},
                  ]}
                  onPress={() => toggleDay(day.id)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.toggleKnob,
                      {
                        backgroundColor: "#ffffff",
                        transform: [{translateX: isEnabled ? 20 : 0}],
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {isEnabled && daySchedule && (
                <View style={styles.timeSectionContainer}>
                  {/* Working Hours */}
                  <View style={styles.timeSection}>
                    {Platform.OS === "web" ? (
                      <View style={styles.webTimeButton}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>Inicio:</Text>
                        <TextInput
                          style={[
                            styles.webTimeInput,
                            {color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card},
                          ]}
                          value={getWebTimeValue(day.id, "start", daySchedule.start_time)}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.mutedForeground}
                          onChangeText={(text) => handleWebTimeChange(day.id, "start", text)}
                          onBlur={() => handleWebTimeBlur(day.id, "start", daySchedule.start_time)}
                          maxLength={5}
                          editable={true}
                          keyboardType="numeric"
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.timeButton, {backgroundColor: colors.muted}]}
                        onPress={() => setShowTimePicker({day: day.id, type: "start"})}
                        activeOpacity={0.7}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>Inicio:</Text>
                        <Text style={[styles.timeValue, {color: colors.foreground}]}>
                          {daySchedule.start_time}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <Text style={[styles.timeSeparator, {color: colors.mutedForeground}]}>—</Text>

                    {Platform.OS === "web" ? (
                      <View style={styles.webTimeButton}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>Fin:</Text>
                        <TextInput
                          style={[
                            styles.webTimeInput,
                            {color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card},
                          ]}
                          value={getWebTimeValue(day.id, "end", daySchedule.end_time)}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.mutedForeground}
                          onChangeText={(text) => handleWebTimeChange(day.id, "end", text)}
                          onBlur={() => handleWebTimeBlur(day.id, "end", daySchedule.end_time)}
                          maxLength={5}
                          editable={true}
                          keyboardType="numeric"
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.timeButton, {backgroundColor: colors.muted}]}
                        onPress={() => setShowTimePicker({day: day.id, type: "end"})}
                        activeOpacity={0.7}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.timeLabel, {color: colors.mutedForeground}]}>Fin:</Text>
                        <Text style={[styles.timeValue, {color: colors.foreground}]}>
                          {daySchedule.end_time}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Breaks Section */}
                  <View style={styles.breaksSection}>
                    <View style={styles.breaksHeader}>
                      <Text style={[styles.breaksTitle, {color: colors.foreground}]}>
                        Horarios de Descanso
                      </Text>
                      <TouchableOpacity
                        style={[styles.addBreakButton, {backgroundColor: colors.primary + "20"}]}
                        onPress={() => addBreak(day.id)}
                        activeOpacity={0.7}>
                        <Ionicons name="add" size={18} color={colors.primary} />
                        <Text style={[styles.addBreakText, {color: colors.primary}]}>Agregar</Text>
                      </TouchableOpacity>
                    </View>

                    {daySchedule.breaks && daySchedule.breaks.length > 0 && (
                      <View style={styles.breaksList}>
                        {daySchedule.breaks.map((breakTime, breakIndex) => (
                          <View
                            key={breakIndex}
                            style={[styles.breakCard, {backgroundColor: colors.background, borderColor: colors.border}]}>
                            <View style={styles.breakHeader}>
                              <View style={styles.breakTimeRow}>
                                {Platform.OS === "web" ? (
                                  <View style={styles.breakTimeInputContainer}>
                                    <TextInput
                                      style={[
                                        styles.webBreakTimeInput,
                                        {color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card},
                                      ]}
                                      value={getWebTimeValue(day.id, "start", breakTime.start_time, breakIndex)}
                                      placeholder="HH:MM"
                                      placeholderTextColor={colors.mutedForeground}
                                      onChangeText={(text) => handleWebTimeChange(day.id, "start", text, breakIndex)}
                                      onBlur={() => handleWebTimeBlur(day.id, "start", breakTime.start_time, breakIndex)}
                                      maxLength={5}
                                      editable={true}
                                      keyboardType="numeric"
                                    />
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={[styles.breakTimeButton, {backgroundColor: colors.muted}]}
                                    onPress={() => setShowBreakPicker({day: day.id, breakIndex, type: "start"})}
                                    activeOpacity={0.7}>
                                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.breakTimeText, {color: colors.foreground}]}>
                                      {breakTime.start_time}
                                    </Text>
                                  </TouchableOpacity>
                                )}

                                <Text style={[styles.timeSeparator, {color: colors.mutedForeground}]}>—</Text>

                                {Platform.OS === "web" ? (
                                  <View style={styles.breakTimeInputContainer}>
                                    <TextInput
                                      style={[
                                        styles.webBreakTimeInput,
                                        {color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card},
                                      ]}
                                      value={getWebTimeValue(day.id, "end", breakTime.end_time, breakIndex)}
                                      placeholder="HH:MM"
                                      placeholderTextColor={colors.mutedForeground}
                                      onChangeText={(text) => handleWebTimeChange(day.id, "end", text, breakIndex)}
                                      onBlur={() => handleWebTimeBlur(day.id, "end", breakTime.end_time, breakIndex)}
                                      maxLength={5}
                                      editable={true}
                                      keyboardType="numeric"
                                    />
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={[styles.breakTimeButton, {backgroundColor: colors.muted}]}
                                    onPress={() => setShowBreakPicker({day: day.id, breakIndex, type: "end"})}
                                    activeOpacity={0.7}>
                                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.breakTimeText, {color: colors.foreground}]}>
                                      {breakTime.end_time}
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>

                              <TouchableOpacity
                                style={styles.removeBreakButton}
                                onPress={() => removeBreak(day.id, breakIndex)}
                                activeOpacity={0.7}>
                                <Ionicons name="close-circle" size={22} color={colors.mutedForeground} />
                              </TouchableOpacity>
                            </View>

                            <View style={styles.breakLabelRow}>
                              <Ionicons name="restaurant-outline" size={16} color={colors.mutedForeground} />
                              <TextInput
                                style={[
                                  styles.breakLabelInput,
                                  {color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card},
                                ]}
                                value={breakTime.label || ""}
                                placeholder="Descanso (ej: Almuerzo)"
                                placeholderTextColor={colors.mutedForeground}
                                onChangeText={(text) => updateBreakLabel(day.id, breakIndex, text)}
                                maxLength={30}
                              />
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Time Picker */}
      {Platform.OS === "android" && (showTimePicker || showBreakPicker) && (
        <DateTimePicker
          value={iosInitialDate}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {iosPickerVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={closeIosPicker}>
          <View style={styles.iosModalBackdrop}>
            <View style={[styles.iosModalContent, {backgroundColor: colors.background}]}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={closeIosPicker} style={styles.iosModalBtn}>
                  <Text style={[styles.iosModalBtnText, {color: colors.primary}]}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={[styles.iosModalTitle, {color: colors.foreground}]}>Seleccionar hora</Text>
                <TouchableOpacity onPress={commitIosPicker} style={styles.iosModalBtn}>
                  <Text style={[styles.iosModalBtnText, {color: colors.primary}]}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosTempDate || iosInitialDate}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
                textColor={colors.foreground}
                style={styles.iosTimePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  daysContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  dayCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dayShort: {
    fontSize: 16,
    fontWeight: "700",
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timeSectionContainer: {
    marginTop: 16,
    gap: 16,
  },
  timeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  webTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  webTimeInput: {
    minWidth: 74,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 0,
    marginHorizontal: 2,
  },
  breaksSection: {
    marginTop: 4,
    gap: 12,
  },
  breaksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  breaksTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  addBreakButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  addBreakText: {
    fontSize: 13,
    fontWeight: "600",
  },
  breaksList: {
    gap: 10,
  },
  breakCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    width: "100%",
  },
  breakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    width: "100%",
  },
  breakTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  breakTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
    minHeight: 32,
    flexShrink: 1,
  },
  breakTimeInputContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },
  webBreakTimeInput: {
    width: 70,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  breakTimeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  removeBreakButton: {
    padding: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  breakLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    width: "100%",
  },
  breakLabelInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 32,
    flexShrink: 1,
  },
  iosModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  iosModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  iosModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  iosModalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  iosModalBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 80,
  },
  iosModalBtnText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  iosTimePicker: {
    width: "100%",
    height: 200,
  },
});






































