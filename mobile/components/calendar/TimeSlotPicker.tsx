import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {TimeSlot} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";
import {parseISODateAsLocal} from "@/lib/dateUtils";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime?: string;
  onSelectTime: (slot: TimeSlot) => void;
  date: string;
}

export const TimeSlotPicker = ({slots, selectedTime, onSelectTime, date}: TimeSlotPickerProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>Horarios Disponibles</Text>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          {parseISODateAsLocal(date).toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.slotsContainer}
        showsVerticalScrollIndicator={false}>
        {slots.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              No hay horarios disponibles para este día
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {slots.map((slot, index) => {
              const isSelected = selectedTime === slot.time;
              const isAvailable = slot.available;

              return (
                <TouchableOpacity
                  key={`${slot.time}-${index}`}
                  style={[
                    styles.slot,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isAvailable
                        ? colors.card
                        : colors.muted,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                    !isAvailable && styles.slotDisabled,
                  ]}
                  onPress={() => isAvailable && onSelectTime(slot)}
                  disabled={!isAvailable}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.slotTime,
                      {
                        color: isSelected
                          ? "#ffffff"
                          : isAvailable
                          ? colors.foreground
                          : colors.mutedForeground,
                      },
                    ]}>
                    {slot.time}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={16} color="#ffffff" />}
                  {!isAvailable && !isSelected && (
                    <Ionicons name="lock-closed" size={14} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Info */}
      <View style={[styles.info, {backgroundColor: colors.muted}]}>
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, {backgroundColor: colors.primary}]} />
          <Text style={[styles.infoText, {color: colors.foreground}]}>Seleccionado</Text>
        </View>
        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoDot,
              {backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border},
            ]}
          />
          <Text style={[styles.infoText, {color: colors.foreground}]}>Disponible</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, {backgroundColor: colors.muted}]} />
          <Text style={[styles.infoText, {color: colors.foreground}]}>No disponible</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  scrollView: {
    flex: 1,
  },
  slotsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slot: {
    width: "30%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  slotDisabled: {
    opacity: 0.5,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  info: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
