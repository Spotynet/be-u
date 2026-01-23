import React, {useEffect, useMemo, useRef, useState} from "react";
import {View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, FlatList} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Reservation, ReservationStatus} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";

interface CalendarViewProps {
  reservations: Reservation[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  disabledDaysIndexes?: number[];
  showLegend?: boolean;
}

export const CalendarView = ({
  reservations,
  onDayPress,
  selectedDate,
  minDate,
  maxDate,
  disabledDaysIndexes,
  showLegend = true,
}: CalendarViewProps) => {
  const {colors} = useThemeVariant();

  const toISODate = (d: Date) => d.toISOString().split("T")[0];
  const parseISO = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const startOfWeekMon = (d: Date) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay(); // 0 Sun .. 6 Sat
    const diff = (day + 6) % 7; // Mon=0
    copy.setDate(copy.getDate() - diff);
    return copy;
  };
  const addDays = (d: Date, days: number) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    copy.setDate(copy.getDate() + days);
    return copy;
  };
  const addWeeks = (d: Date, weeks: number) => addDays(d, weeks * 7);

  const todayString = useMemo(() => toISODate(new Date()), []);
  const [currentDate, setCurrentDate] = useState<string>(selectedDate || todayString);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [weekWidth, setWeekWidth] = useState<number>(0);
  const weekListRef = useRef<FlatList<Date> | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const currentDateObj = useMemo(() => new Date(currentDate), [currentDate]);
  const currentMonthIndex = currentDateObj.getMonth();
  const currentYear = currentDateObj.getFullYear();

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 2; y <= currentYear + 3; y += 1) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const updateMonthYear = (monthIndex: number, year: number) => {
    const newDate = new Date(year, monthIndex, 1);
    setCurrentDate(newDate.toISOString().split("T")[0]);
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "CONFIRMED":
        return "#10b981"; // Green
      case "PENDING":
        return "#f59e0b"; // Orange
      case "COMPLETED":
        return "#6b7280"; // Gray
      case "CANCELLED":
        return "#ef4444"; // Red
      case "REJECTED":
        return "#dc2626"; // Dark red
      default:
        return colors.primary;
    }
  };

  // Group reservations by date
  const markedDates: any = {};

  reservations.forEach((reservation) => {
    const dateKey = reservation.date;

    if (!markedDates[dateKey]) {
      markedDates[dateKey] = {
        marked: true,
        dots: [],
      };
    }

    // Add dot based on status
    const dotColor = getStatusColor(reservation.status);
    markedDates[dateKey].dots.push({
      color: dotColor,
      selectedDotColor: dotColor,
    });
  });

  // Add selection to marked dates
  if (selectedDate && markedDates[selectedDate]) {
    markedDates[selectedDate].selected = true;
    markedDates[selectedDate].selectedColor = colors.primary;
  } else if (selectedDate) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: colors.primary,
    };
  }

  const isBefore = (aISO?: string, bISO?: string) => {
    if (!aISO || !bISO) return false;
    return parseISO(aISO).getTime() < parseISO(bISO).getTime();
  };
  const isAfter = (aISO?: string, bISO?: string) => {
    if (!aISO || !bISO) return false;
    return parseISO(aISO).getTime() > parseISO(bISO).getTime();
  };

  // Stable list of weeks (±260 weeks ~= 5 years)
  const baseWeekStart = useMemo(() => startOfWeekMon(new Date()), []);
  const weeks = useMemo(() => {
    const out: Date[] = [];
    for (let i = -260; i <= 260; i += 1) out.push(addWeeks(baseWeekStart, i));
    return out;
  }, [baseWeekStart]);
  const baseIndex = 260;

  const selectedWeekStartISO = useMemo(() => {
    const d = parseISO(currentDate);
    return toISODate(startOfWeekMon(d));
  }, [currentDate]);

  const selectedWeekIndex = useMemo(() => {
    const selectedStart = startOfWeekMon(parseISO(currentDate));
    const diffMs = selectedStart.getTime() - baseWeekStart.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(baseIndex + diffWeeks, 0), weeks.length - 1);
  }, [baseIndex, baseWeekStart, currentDate, weeks.length]);

  useEffect(() => {
    if (!weekWidth) return;
    try {
      weekListRef.current?.scrollToIndex({index: selectedWeekIndex, animated: false});
    } catch {
      // ignore
    }
  }, [selectedWeekIndex, weekWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.dropdownRow}>
        <TouchableOpacity
          style={[styles.dropdownButton, {borderColor: colors.border, backgroundColor: colors.background}]}
          onPress={() => setShowMonthPicker(true)}
          activeOpacity={0.7}>
          <Text style={[styles.dropdownText, {color: colors.foreground}]}>
            {monthNames[currentMonthIndex]}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dropdownButton, {borderColor: colors.border, backgroundColor: colors.background}]}
          onPress={() => setShowYearPicker(true)}
          activeOpacity={0.7}>
          <Text style={[styles.dropdownText, {color: colors.foreground}]}>{currentYear}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.weekStripContainer, {borderColor: colors.border, backgroundColor: colors.background}]}
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w && w !== weekWidth) setWeekWidth(w);
        }}>
        {weekWidth > 0 && (
          <FlatList
            ref={(r) => {
              weekListRef.current = r;
            }}
            data={weeks}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(d) => toISODate(d)}
            initialScrollIndex={selectedWeekIndex}
            getItemLayout={(_, index) => ({length: weekWidth, offset: weekWidth * index, index})}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / weekWidth);
              const wkStart = weeks[idx] || weeks[selectedWeekIndex];
              const iso = toISODate(wkStart);
              if (iso && iso !== selectedWeekStartISO) setCurrentDate(iso);
            }}
            renderItem={({item: weekStart}) => {
              const days = Array.from({length: 7}).map((_, i) => addDays(weekStart, i));
              const selectedISO = selectedDate || currentDate;

              return (
                <View style={[styles.weekPage, {width: weekWidth}]}>
                  {days.map((d) => {
                    const iso = toISODate(d);
                    const weekdayLabel = new Intl.DateTimeFormat("es-MX", {weekday: "short"}).format(d);
                    const dayNum = String(d.getDate());
                    const weekdayIndex = d.getDay();
                    const isWeekdayDisabled =
                      !!disabledDaysIndexes?.length && disabledDaysIndexes.includes(weekdayIndex);
                    const outOfRange = isBefore(iso, minDate) || isAfter(iso, maxDate);
                    const isDisabled = isWeekdayDisabled || outOfRange;
                    const isSelected = iso === selectedISO;
                    const dots = markedDates?.[iso]?.dots || [];

                    return (
                      <TouchableOpacity
                        key={iso}
                        style={styles.dayTouch}
                        activeOpacity={0.85}
                        disabled={isDisabled}
                        onPress={() => {
                          setCurrentDate(iso);
                          onDayPress(iso);
                        }}>
                        <Text style={[styles.dayNameText, {color: colors.mutedForeground}]}>
                          {weekdayLabel}
                        </Text>
                        <View
                          style={[
                            styles.dayCircle,
                            {backgroundColor: colors.background, borderColor: colors.border},
                            isSelected && {backgroundColor: colors.primary, borderColor: colors.primary},
                            isDisabled && styles.dayCircleDisabled,
                          ]}>
                          <Text
                            style={[
                              styles.dayText,
                              {color: isSelected ? "#ffffff" : colors.foreground},
                              isDisabled && {color: colors.mutedForeground},
                            ]}>
                            {dayNum}
                          </Text>
                        </View>
                        <View style={styles.dotsRow}>
                          {dots.slice(0, 3).map((dot: any, idx: number) => (
                            <View
                              key={`${iso}-dot-${idx}`}
                              style={[styles.dot, {backgroundColor: dot.color || colors.primary}]}
                            />
                          ))}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            }}
          />
        )}
      </View>

      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowMonthPicker(false)} />
        <View style={[styles.modalCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {monthNames.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={styles.modalItem}
                onPress={() => {
                  updateMonthYear(index, currentYear);
                  setShowMonthPicker(false);
                }}>
                <Text style={[styles.modalItemText, {color: colors.foreground}]}>{month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowYearPicker(false)} />
        <View style={[styles.modalCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {yearOptions.map((year) => (
              <TouchableOpacity
                key={year}
                style={styles.modalItem}
                onPress={() => {
                  updateMonthYear(currentMonthIndex, year);
                  setShowYearPicker(false);
                }}>
                <Text style={[styles.modalItemText, {color: colors.foreground}]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Legend */}
      {showLegend && (
        <View style={[styles.legend, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
          <Text style={[styles.legendTitle, {color: colors.foreground}]}>Estado:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: "#10b981"}]} />
              <Text style={[styles.legendText, {color: colors.foreground}]}>Confirmada</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: "#f59e0b"}]} />
              <Text style={[styles.legendText, {color: colors.foreground}]}>Pendiente</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: "#6b7280"}]} />
              <Text style={[styles.legendText, {color: colors.foreground}]}>Completada</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "600",
  },
  weekStripContainer: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  weekPage: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayTouch: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
    paddingBottom: 6,
    flex: 1,
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "capitalize",
    textAlign: "center",
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    borderWidth: 1,
  },
  dayCircleDisabled: {
    backgroundColor: "transparent",
    opacity: 0.4,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    padding: 16,
    borderTopWidth: 1,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalCard: {
    position: "absolute",
    top: "30%",
    left: 24,
    right: 24,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 320,
    paddingVertical: 8,
  },
  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
