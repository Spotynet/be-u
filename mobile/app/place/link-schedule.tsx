import React, {useEffect, useMemo, useState} from "react";
import {View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, TextInput, Alert} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useLocalSearchParams, useRouter} from "expo-router";
import {linkApi, LinkedAvailabilitySchedule, LinkedTimeSlot} from "@/lib/api";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function LinkScheduleScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {linkId} = useLocalSearchParams<{linkId?: string}>();
  const numericLinkId = useMemo(() => (linkId ? Number(linkId) : NaN), [linkId]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<LinkedAvailabilitySchedule[]>([]);

  const buildDefaultSchedule = (): LinkedAvailabilitySchedule[] =>
    Array.from({length: 7}).map((_, idx) => ({
      day_of_week: idx as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      is_available: false,
      time_slots: [],
    }));

  const load = async () => {
    if (!numericLinkId || isNaN(numericLinkId)) return;
    try {
      setLoading(true);
      const resp = await linkApi.getLinkSchedule(numericLinkId);
      const apiData = Array.isArray(resp.data) ? resp.data : [];
      // Normalize to 7 days
      const byDay: Record<number, LinkedAvailabilitySchedule> = {};
      apiData.forEach((d) => (byDay[d.day_of_week] = d));
      const normalized = buildDefaultSchedule().map((d) =>
        byDay[d.day_of_week] ? {...d, ...byDay[d.day_of_week]} : d
      );
      setSchedule(normalized);
    } catch (e) {
      // If not set yet, start with defaults
      setSchedule(buildDefaultSchedule());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericLinkId]);

  const toggleDay = (day: number) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day_of_week === day ? {...d, is_available: !d.is_available} : d
      )
    );
  };

  const addSlot = (day: number) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day_of_week === day
          ? {
              ...d,
              time_slots: [
                ...(d.time_slots || []),
                {start_time: "09:00", end_time: "10:00", is_active: true} as LinkedTimeSlot,
              ],
            }
          : d
      )
    );
  };

  const updateSlot = (day: number, idx: number, key: "start_time" | "end_time", value: string) => {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.day_of_week !== day) return d;
        const slots = [...(d.time_slots || [])];
        const slot = {...slots[idx], [key]: value};
        slots[idx] = slot as LinkedTimeSlot;
        return {...d, time_slots: slots};
      })
    );
  };

  const removeSlot = (day: number, idx: number) => {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.day_of_week !== day) return d;
        const slots = [...(d.time_slots || [])];
        slots.splice(idx, 1);
        return {...d, time_slots: slots};
      })
    );
  };

  const validate = (): boolean => {
    for (const d of schedule) {
      if (!d.is_available) continue;
      for (const s of d.time_slots || []) {
        if (!/^\d{2}:\d{2}$/.test(s.start_time) || !/^\d{2}:\d{2}$/.test(s.end_time)) {
          Alert.alert("Formato inválido", "Usa HH:MM para horarios (por ejemplo 09:00).");
          return false;
        }
        if (s.end_time <= s.start_time) {
          Alert.alert("Rango inválido", "La hora de fin debe ser mayor que la de inicio.");
          return false;
        }
      }
    }
    return true;
  };

  const save = async () => {
    if (!numericLinkId || isNaN(numericLinkId)) return;
    if (!validate()) return;
    try {
      setSaving(true);
      // Only send days; API replaces existing
      const payload: LinkedAvailabilitySchedule[] = schedule.map((d) => ({
        day_of_week: d.day_of_week,
        is_available: d.is_available,
        time_slots: d.is_available ? d.time_slots : [],
      })) as LinkedAvailabilitySchedule[];
      await linkApi.setLinkSchedule(numericLinkId, payload);
      Alert.alert("Guardado", "Horario actualizado correctamente.");
      router.back();
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  };

  if (!numericLinkId || isNaN(numericLinkId)) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Text style={{color: colors.foreground}}>Falta el parámetro linkId.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>Horario por profesional</Text>
        <TouchableOpacity style={[styles.saveBtn, {backgroundColor: colors.primary}]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{paddingBottom: 24}}>
          {schedule.map((d) => (
            <View key={d.day_of_week} style={[styles.dayCard, {borderColor: colors.border, backgroundColor: colors.card}]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, {color: colors.foreground}]}>{DAY_LABELS[d.day_of_week]}</Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    {backgroundColor: d.is_available ? colors.primary : colors.muted, borderColor: colors.border},
                  ]}
                  onPress={() => toggleDay(d.day_of_week)}>
                  <Text style={styles.toggleText}>{d.is_available ? "Disponible" : "Cerrado"}</Text>
                </TouchableOpacity>
              </View>

              {d.is_available ? (
                <>
                  {(d.time_slots || []).map((s, idx) => (
                    <View key={idx} style={styles.slotRow}>
                      <View style={[styles.slotBox, {borderColor: colors.border}]}>
                        <Text style={[styles.slotLabel, {color: colors.mutedForeground}]}>Inicio</Text>
                        <TextInput
                          value={s.start_time}
                          onChangeText={(t) => updateSlot(d.day_of_week, idx, "start_time", t)}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.mutedForeground}
                          style={[styles.slotInput, {color: colors.foreground}]}
                        />
                      </View>
                      <View style={[styles.slotBox, {borderColor: colors.border}]}>
                        <Text style={[styles.slotLabel, {color: colors.mutedForeground}]}>Fin</Text>
                        <TextInput
                          value={s.end_time}
                          onChangeText={(t) => updateSlot(d.day_of_week, idx, "end_time", t)}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.mutedForeground}
                          style={[styles.slotInput, {color: colors.foreground}]}
                        />
                      </View>
                      <TouchableOpacity style={[styles.removeBtn, {borderColor: colors.border}]} onPress={() => removeSlot(d.day_of_week, idx)}>
                        <Text style={{color: "#ef4444", fontWeight: "700"}}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={[styles.addBtn, {backgroundColor: colors.primary}]} onPress={() => addSlot(d.day_of_week)}>
                    <Text style={styles.addText}>Agregar franja</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  header: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12},
  title: {fontSize: 18, fontWeight: "700"},
  saveBtn: {paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10},
  saveText: {color: "#fff", fontWeight: "700"},
  dayCard: {borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12},
  dayHeader: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10},
  dayLabel: {fontSize: 16, fontWeight: "700"},
  toggle: {paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 999},
  toggleText: {color: "#fff", fontWeight: "700"},
  slotRow: {flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10},
  slotBox: {flex: 1, borderWidth: 1, borderRadius: 10, padding: 8},
  slotLabel: {fontSize: 12, marginBottom: 4},
  slotInput: {fontSize: 14, paddingVertical: 4},
  removeBtn: {borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12},
  addBtn: {marginTop: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignSelf: "flex-start"},
  addText: {color: "#fff", fontWeight: "700"},
});


