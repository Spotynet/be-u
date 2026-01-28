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
  const [weekWidth, setWeekWidth] = useState<number>(0);
  const weekListRef = useRef<FlatList<Date> | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
      // Update visible week when selected date changes
      const selectedDateObj = parseISO(selectedDate);
      setVisibleWeekStart(startOfWeekMon(selectedDateObj));
    }
  }, [selectedDate]);
  
  // Initialize visible week on mount
  useEffect(() => {
    if (!visibleWeekStart) {
      const initialDate = parseISO(currentDate);
      setVisibleWeekStart(startOfWeekMon(initialDate));
    }
  }, []);

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
  
  // Track the visible week to update month/year display
  const [visibleWeekStart, setVisibleWeekStart] = useState<Date | null>(null);
  
  // Calculate month/year from visible week or current date
  const displayDate = useMemo(() => {
    if (visibleWeekStart) {
      return visibleWeekStart;
    }
    return currentDateObj;
  }, [visibleWeekStart, currentDateObj]);
  
  const currentMonthIndex = displayDate.getMonth();
  const currentYear = displayDate.getFullYear();


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
        <Text style={[styles.monthYearText, {color: colors.foreground}]}>
          {monthNames[currentMonthIndex]} {currentYear}
        </Text>
      </View>

      <View
        style={[styles.weekStripContainer, {backgroundColor: colors.background}]}
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
              if (wkStart) {
                const iso = toISODate(wkStart);
                // Update visible week for month/year display
                setVisibleWeekStart(new Date(wkStart));
                if (iso && iso !== selectedWeekStartISO) {
                  setCurrentDate(iso);
                }
              }
            }}
            onScrollBeginDrag={() => {
              // Keep track when user starts scrolling
            }}
            onScrollEndDrag={(e) => {
              // Update on scroll end as well for immediate feedback
              const idx = Math.round(e.nativeEvent.contentOffset.x / weekWidth);
              const wkStart = weeks[idx];
              if (wkStart) {
                setVisibleWeekStart(new Date(wkStart));
              }
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
    justifyContent: "center",
    marginBottom: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: "600",
  },
  weekStripContainer: {
    borderWidth: 0,
    borderRadius: 14,
    overflow: "hidden",
    paddingVertical: 0,
    paddingHorizontal: 8,
    marginBottom: 0,
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
});
