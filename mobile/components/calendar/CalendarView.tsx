import React, {useEffect, useMemo, useRef, useState} from "react";
import {View, Text, StyleSheet, TouchableOpacity, FlatList, Platform} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Reservation, ReservationStatus} from "@/types/global";

interface CalendarViewProps {
  reservations: Reservation[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  disabledDaysIndexes?: number[];
  showLegend?: boolean;
}

// Always use local calendar date — toISOString() returns UTC and breaks timezones
const toLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (d: Date, days: number) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  c.setDate(c.getDate() + days);
  return c;
};
const addWeeks = (d: Date, w: number) => addDays(d, w * 7);

const startOfWeekMon = (d: Date) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return c;
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAY_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

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

  const todayISO = useMemo(() => toLocalISO(new Date()), []);
  const [weekWidth, setWeekWidth] = useState(0);
  const listRef = useRef<FlatList<Date> | null>(null);
  const isFirstRender = useRef(true);

  // Which date drives the visible month label & scrolling
  const pivotISO = selectedDate ?? todayISO;

  // Build ±260 weeks once
  const baseWeekStart = useMemo(() => startOfWeekMon(new Date()), []);
  const BASE_IDX = 260;
  const weeks = useMemo(() => {
    const out: Date[] = [];
    for (let i = -BASE_IDX; i <= BASE_IDX; i++) out.push(addWeeks(baseWeekStart, i));
    return out;
  }, [baseWeekStart]);

  const pivotWeekIdx = useMemo(() => {
    const pivotWeekStart = startOfWeekMon(parseISO(pivotISO));
    const diffMs = pivotWeekStart.getTime() - baseWeekStart.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 86400 * 1000));
    return Math.min(Math.max(BASE_IDX + diffWeeks, 0), weeks.length - 1);
  }, [pivotISO, baseWeekStart, weeks.length]);

  // On mount: position is set via contentOffset (no animation).
  // After mount: scroll when selectedDate changes externally (e.g. month picker tap).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!weekWidth) return;
    listRef.current?.scrollToOffset({offset: weekWidth * pivotWeekIdx, animated: true});
  }, [pivotWeekIdx, weekWidth]);

  // Month/year label from the visible week (updated on scroll)
  const [visibleWeekStart, setVisibleWeekStart] = useState<Date>(() => startOfWeekMon(parseISO(pivotISO)));
  const displayMonth = visibleWeekStart.getMonth();
  const displayYear  = visibleWeekStart.getFullYear();

  // Reservation dots per date
  const dotsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    reservations.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(statusColor(r.status));
    });
    return map;
  }, [reservations]);

  const isBefore = (a: string, b?: string) => !!b && parseISO(a).getTime() < parseISO(b).getTime();
  const isAfter  = (a: string, b?: string) => !!b && parseISO(a).getTime() > parseISO(b).getTime();

  const renderWeek = ({item: weekStart}: {item: Date}) => {
    const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
    return (
      <View style={[styles.weekRow, {width: weekWidth}]}>
        {days.map((d) => {
          const iso = toLocalISO(d);
          const dayLabel = DAY_SHORT[(d.getDay() + 6) % 7];
          const isSelected = iso === (selectedDate ?? todayISO);
          const isToday    = iso === todayISO;
          const isDisabled =
            (!!disabledDaysIndexes?.length && disabledDaysIndexes.includes(d.getDay())) ||
            isBefore(iso, minDate) || isAfter(iso, maxDate);
          const dots = (dotsByDate[iso] ?? []).slice(0, 3);

          return (
            <TouchableOpacity
              key={iso}
              style={styles.dayCol}
              activeOpacity={0.7}
              disabled={isDisabled}
              onPress={() => onDayPress(iso)}>

              {/* Day name */}
              <Text style={[
                styles.dayName,
                {color: isSelected ? colors.primary : isToday ? colors.accent : colors.mutedForeground},
                isDisabled && styles.disabledText,
              ]}>
                {dayLabel}
              </Text>

              {/* Day number circle */}
              <View style={[
                styles.circle,
                isSelected && {backgroundColor: colors.primary, ...shadow},
                isToday && !isSelected && {
                  borderWidth: 1.5,
                  borderColor: colors.accent,
                },
              ]}>
                <Text style={[
                  styles.dayNum,
                  {color: isSelected
                    ? "#fff"
                    : isToday
                    ? colors.accent
                    : isDisabled
                    ? colors.mutedForeground
                    : colors.foreground},
                  isSelected && {fontWeight: "800"},
                ]}>
                  {d.getDate()}
                </Text>
              </View>

              {/* Reservation dots */}
              <View style={styles.dotsRow}>
                {dots.map((color, i) => (
                  <View
                    key={i}
                    style={[styles.dot, {
                      backgroundColor: isSelected ? "rgba(255,255,255,0.75)" : color,
                    }]}
                  />
                ))}
                {dots.length === 0 && <View style={styles.dotPlaceholder} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View>
      {/* Month / Year header */}
      <View style={styles.header}>
        <Text style={[styles.monthLabel, {color: colors.foreground}]}>
          {MONTH_NAMES[displayMonth]}
        </Text>
        <Text style={[styles.yearLabel, {color: colors.mutedForeground}]}>
          {displayYear}
        </Text>
      </View>

      {/* Week strip */}
      <View
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w && w !== weekWidth) setWeekWidth(w);
        }}>
        {weekWidth > 0 && (
          <FlatList
            ref={(r) => { listRef.current = r; }}
            data={weeks}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(d) => toLocalISO(d)}
            getItemLayout={(_, index) => ({length: weekWidth, offset: weekWidth * index, index})}
            contentOffset={{x: weekWidth * pivotWeekIdx, y: 0}}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / weekWidth);
              const wk = weeks[idx];
              if (wk) setVisibleWeekStart(wk);
            }}
            renderItem={renderWeek}
          />
        )}
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={[styles.legend, {borderTopColor: colors.border}]}>
          {[
            {color: "#10b981", label: "Confirmada"},
            {color: "#f59e0b", label: "Pendiente"},
            {color: "#6b7280", label: "Completada"},
          ].map(({color, label}) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: color}]} />
              <Text style={[styles.legendText, {color: colors.mutedForeground}]}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

function statusColor(status: ReservationStatus): string {
  switch (status) {
    case "CONFIRMED":  return "#10b981";
    case "PENDING":    return "#f59e0b";
    case "COMPLETED":  return "#6b7280";
    case "CANCELLED":
    case "REJECTED":   return "#ef4444";
    default:           return "#6b7280";
  }
}

const shadow = Platform.select({
  ios:     {shadowColor: "#000", shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.18, shadowRadius: 8},
  android: {elevation: 5},
}) ?? {};

const CIRCLE_SIZE = 40;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  yearLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  dayName: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  disabledText: {
    opacity: 0.35,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: CIRCLE_SIZE,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
    minHeight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
