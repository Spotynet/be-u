import React, {useEffect, useMemo, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import {groupSessionApi, serviceApi, profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {AppHeader} from "@/components/ui/AppHeader";

const toDurationString = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = Math.max(minutes % 60, 0)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:00`;
};

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTime = (d: Date) => {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

type ServiceItem = {
  id: number;
  name: string;
  service: number;
  service_type_id?: number;
  duration_minutes?: number;
  price?: number;
  type?: "place_service" | "professional_service" | "custom_service";
};

const normalizePlaceOrPro = (s: any): ServiceItem => ({
  id: s.id,
  name: s.name || s.service_name || s.service?.name || "Servicio",
  service: s.service ?? s.service_type_id ?? s.service_details?.id ?? s.id,
  service_type_id: s.service_type_id ?? s.service,
  duration_minutes: s.duration_minutes ?? s.duration ?? 60,
  price: s.price,
  type: s.type === "place_service" ? "place_service" : "professional_service",
});

const normalizeCustomService = (s: any): ServiceItem => ({
  id: s.id,
  name: s.name || "Servicio",
  service: 0,
  service_type_id: 0,
  duration_minutes: s.duration_minutes ?? s.duration ?? 60,
  price: s.price,
  type: "custom_service",
});

export default function GroupSessionsScreen() {
  const router = useRouter();
  const {colors} = useThemeVariant();
  const {user} = useAuth();
  const isPlace = user?.role === "PLACE";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [selectedServiceInstanceId, setSelectedServiceInstanceId] = useState<number | null>(null);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [timeValue, setTimeValue] = useState<Date>(() => {
    const d = new Date();
    d.setHours(14, 0, 0, 0);
    return d;
  });
  const [capacity, setCapacity] = useState(1);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  type RecurrenceMode = "single" | "multiple" | "weekly";
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>("single");
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [weeklyEndDate, setWeeklyEndDate] = useState<Date | null>(null);
  const [showExtraDatePicker, setShowExtraDatePicker] = useState(false);
  const [showWeeklyEndPicker, setShowWeeklyEndPicker] = useState(false);

  const selectedService = useMemo(
    () => services.find((svc) => svc.id === selectedServiceInstanceId),
    [services, selectedServiceInstanceId]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionResponse, placeRes, profRes, customRes, profileRes] = await Promise.all([
        groupSessionApi.list(),
        isPlace ? serviceApi.getPlaceServices({is_active: true}) : Promise.resolve({data: {results: []}}),
        !isPlace ? serviceApi.getProfessionalServices({is_active: true}) : Promise.resolve({data: {results: []}}),
        profileCustomizationApi.getCustomServices().catch(() => ({data: []})),
        profileCustomizationApi.getProfileImages().catch(() => ({data: {sub_categories: []}})),
      ]);

      const placeOrProList =
        isPlace ? placeRes.data?.results || placeRes.data || [] : profRes.data?.results || profRes.data || [];
      const customList = Array.isArray(customRes.data) ? customRes.data : customRes.data?.results ?? [];
      const placeOrProItems = placeOrProList.map((s: any) =>
        normalizePlaceOrPro({...s, type: isPlace ? "place_service" : "professional_service"})
      );
      const customItems = customList
        .filter((s: any) => s.is_active !== false)
        .map(normalizeCustomService);
      setServices([...placeOrProItems, ...customItems]);
      setSessions(sessionResponse.data?.results || []);
      const rawSubCats: string[] = Array.isArray(profileRes.data?.sub_categories)
        ? profileRes.data.sub_categories
        : [];
      setSubCategories(rawSubCats);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo cargar sesiones grupales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getDatesToCreate = (): string[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (recurrenceMode === "single") {
      return [formatDate(dateValue)];
    }
    if (recurrenceMode === "multiple") {
      const main = formatDate(dateValue);
      const all = [main, ...extraDates].filter((d) => d);
      return [...new Set(all)].sort();
    }
    if (recurrenceMode === "weekly" && weeklyDays.length > 0 && weeklyEndDate) {
      const start = new Date(dateValue);
      start.setHours(0, 0, 0, 0);
      const end = new Date(weeklyEndDate);
      end.setHours(23, 59, 59, 999);
      const out: string[] = [];
      const cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay();
        const iso = day === 0 ? 6 : day - 1;
        if (weeklyDays.includes(iso)) {
          out.push(formatDate(cur));
        }
        cur.setDate(cur.getDate() + 1);
      }
      return out.sort();
    }
    return [formatDate(dateValue)];
  };

  const handleCreate = async () => {
    if (!selectedService) {
      Alert.alert("Servicio requerido", "Selecciona un servicio para la sesión grupal.");
      setShowServiceModal(true);
      return;
    }
    const timeStr = formatTime(timeValue);
    const parsedCapacity = Math.max(1, capacity);
    const duration = Math.max(1, selectedService.duration_minutes ?? 60);

    const now = new Date();
    const dates = getDatesToCreate();
    if (dates.length === 0) {
      Alert.alert(
        "Fechas requeridas",
        recurrenceMode === "weekly"
          ? "Selecciona días de la semana y fecha de fin para repetir."
          : recurrenceMode === "multiple"
            ? "Agrega al menos una fecha."
            : "Selecciona una fecha."
      );
      return;
    }
    const firstDate = new Date(dates[0]);
    firstDate.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
    if (firstDate <= now) {
      Alert.alert("Fecha inválida", "La primera sesión debe programarse en el futuro.");
      return;
    }
    if (recurrenceMode === "weekly" && (!weeklyEndDate || weeklyDays.length === 0)) {
      Alert.alert("Configura la repetición", "Selecciona al menos un día de la semana y una fecha de fin.");
      return;
    }

    try {
      setSaving(true);
      const isCustom = selectedService.type === "custom_service";
      let created = 0;
      for (const dateStr of dates) {
        const sessionDate = new Date(dateStr);
        sessionDate.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
        if (sessionDate <= now) continue;
        const payload: any = {
          service_instance_id: selectedService.id,
          date: dateStr,
          time: `${timeStr}:00`,
          duration: toDurationString(duration),
          capacity: parsedCapacity,
          ...(selectedSubCategory ? {sub_category: selectedSubCategory} : {}),
        };
        if (isCustom) {
          payload.service_instance_type = "custom_service";
        } else {
          payload.service = selectedService.service;
          payload.service_instance_type = isPlace ? "place_service" : "professional_service";
        }
        await groupSessionApi.create(payload);
        created++;
      }
      setDateValue(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
      });
      setTimeValue(() => {
        const d = new Date();
        d.setHours(14, 0, 0, 0);
        return d;
      });
      setCapacity(1);
      setSelectedServiceInstanceId(null);
      setSelectedSubCategory(null);
      setExtraDates([]);
      setWeeklyDays([]);
      setWeeklyEndDate(null);
      await loadData();
      if (created > 0) {
        Alert.alert("Listo", created === 1 ? "Sesión creada." : `Se crearon ${created} sesiones.`);
      }
    } catch (error: any) {
      const msg =
        error?.message ||
        (error?.data && typeof error.data === "object" && Object.keys(error.data).length > 0
          ? Object.values(error.data)
              .flat()
              .filter(Boolean)[0]
          : null) ||
        "No se pudo crear la sesión grupal.";
      Alert.alert("Error", String(msg));
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (_: any, d?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (d) setDateValue(d);
  };

  const onTimeChange = (_: any, d?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (d) setTimeValue(d);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Sesiones grupales"
        showBackButton
        backFallbackRoute="/(tabs)/calendario"
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.scrollViewWrapper}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            overScrollMode="always">
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Crear sesión</Text>
          <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {/* Servicio */}
            <Text style={[styles.label, {color: colors.foreground}]}>Servicio *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {backgroundColor: colors.background, borderColor: colors.border},
                !selectedService && {borderColor: "#ef4444"},
              ]}
              onPress={() => setShowServiceModal(true)}
              activeOpacity={0.7}>
              <Text style={[styles.pickerButtonText, {color: selectedService ? colors.foreground : colors.mutedForeground}]}>
                {selectedService ? `${selectedService.name} (${selectedService.duration_minutes || 60} min)` : "Seleccionar servicio"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Fecha */}
            <Text style={[styles.label, {color: colors.foreground}]}>Fecha</Text>
            <TouchableOpacity
              style={[styles.pickerButton, {backgroundColor: colors.background, borderColor: colors.border}]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerButtonText, {color: colors.foreground}]}>
                {dateValue.toLocaleDateString("es-MX", {weekday: "long", day: "numeric", month: "long", year: "numeric"})}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={minDate}
                onChange={onDateChange}
                locale="es-MX"
                onTouchCancel={() => Platform.OS === "ios" && setShowDatePicker(false)}
              />
            )}
            {Platform.OS === "ios" && showDatePicker && (
              <TouchableOpacity style={styles.iosPickerDone} onPress={() => setShowDatePicker(false)}>
                <Text style={{color: colors.primary, fontWeight: "700"}}>Listo</Text>
              </TouchableOpacity>
            )}

            {/* Hora */}
            <Text style={[styles.label, {color: colors.foreground}]}>Hora</Text>
            <TouchableOpacity
              style={[styles.pickerButton, {backgroundColor: colors.background, borderColor: colors.border}]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerButtonText, {color: colors.foreground}]}>
                {timeValue.toLocaleTimeString("es-MX", {hour: "2-digit", minute: "2-digit"})}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={timeValue}
                mode="time"
                is24Hour={true}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
                locale="es-MX"
              />
            )}
            {Platform.OS === "ios" && showTimePicker && (
              <TouchableOpacity style={styles.iosPickerDone} onPress={() => setShowTimePicker(false)}>
                <Text style={{color: colors.primary, fontWeight: "700"}}>Listo</Text>
              </TouchableOpacity>
            )}

            {/* Recurrencia */}
            <Text style={[styles.label, {color: colors.foreground}]}>Recurrencia</Text>
            <View style={styles.recurrenceRow}>
              {(["single", "multiple", "weekly"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.recurrenceChip,
                    {borderColor: colors.border, backgroundColor: recurrenceMode === mode ? colors.primary : colors.background},
                  ]}
                  onPress={() => setRecurrenceMode(mode)}>
                  <Text
                    style={[
                      styles.recurrenceChipText,
                      {color: recurrenceMode === mode ? colors.primaryForeground : colors.foreground},
                    ]}>
                    {mode === "single" ? "Una fecha" : mode === "multiple" ? "Varias fechas" : "Semanal"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {recurrenceMode === "multiple" && (
              <>
                <Text style={[styles.label, {color: colors.foreground}]}>Fechas adicionales</Text>
                <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8}}>
                  {extraDates.map((d) => (
                    <View key={d} style={[styles.dateChip, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                      <Text style={{color: colors.foreground, fontSize: 13}}>{d}</Text>
                      <TouchableOpacity
                        hitSlop={8}
                        onPress={() => setExtraDates((prev) => prev.filter((x) => x !== d))}>
                        <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.addDateBtn, {borderColor: colors.primary, borderWidth: 1}]}
                    onPress={() => setShowExtraDatePicker(true)}>
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={{color: colors.primary, fontWeight: "600", fontSize: 13}}>Agregar fecha</Text>
                  </TouchableOpacity>
                </View>
                {showExtraDatePicker && (
                  <DateTimePicker
                    value={new Date(extraDates[extraDates.length - 1] || formatDate(dateValue))}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={minDate}
                    onChange={(_, d) => {
                      if (d) {
                        const str = formatDate(d);
                        if (!extraDates.includes(str) && str !== formatDate(dateValue)) {
                          setExtraDates((prev) => [...prev, str].sort());
                        }
                        setShowExtraDatePicker(false);
                      }
                    }}
                    locale="es-MX"
                  />
                )}
              </>
            )}

            {recurrenceMode === "weekly" && (
              <>
                <Text style={[styles.label, {color: colors.foreground}]}>Días de la semana</Text>
                <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8}}>
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label, i) => {
                    const on = weeklyDays.includes(i);
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.recurrenceChip,
                          {borderColor: colors.border, backgroundColor: on ? colors.primary : colors.background},
                        ]}
                        onPress={() =>
                          setWeeklyDays((prev) =>
                            on ? prev.filter((d) => d !== i) : [...prev, i].sort()
                          )
                        }>
                        <Text style={[styles.recurrenceChipText, {color: on ? colors.primaryForeground : colors.foreground}]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.label, {color: colors.foreground}]}>Repetir hasta (fecha fin)</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, {backgroundColor: colors.background, borderColor: colors.border}]}
                  onPress={() => setShowWeeklyEndPicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={[styles.pickerButtonText, {color: colors.foreground}]}>
                    {weeklyEndDate
                      ? weeklyEndDate.toLocaleDateString("es-MX", {weekday: "short", day: "numeric", month: "short", year: "numeric"})
                      : "Seleccionar fecha fin"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
                {showWeeklyEndPicker && (
                  <DateTimePicker
                    value={weeklyEndDate || new Date(dateValue.getTime() + 30 * 24 * 60 * 60 * 1000)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={dateValue}
                    onChange={(_, d) => {
                      if (d) {
                        setWeeklyEndDate(d);
                        setShowWeeklyEndPicker(false);
                      }
                    }}
                    locale="es-MX"
                  />
                )}
              </>
            )}

            {/* Subcategoría */}
            {subCategories.length > 0 && (
              <>
                <Text style={[styles.label, {color: colors.foreground}]}>Subcategoría (opcional)</Text>
                <View style={styles.recurrenceRow}>
                  {subCategories.map((sc) => {
                    const active = selectedSubCategory === sc;
                    return (
                      <TouchableOpacity
                        key={sc}
                        style={[
                          styles.recurrenceChip,
                          {borderColor: colors.border, backgroundColor: active ? colors.primary : colors.background},
                        ]}
                        onPress={() => setSelectedSubCategory(active ? null : sc)}>
                        <Text style={[styles.recurrenceChipText, {color: active ? colors.primaryForeground : colors.foreground}]}>
                          {sc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Cupos */}
            <Text style={[styles.label, {color: colors.foreground}]}>Cupos</Text>
            <View style={[styles.capacityRow, {backgroundColor: colors.background, borderColor: colors.border}]}>
              <TouchableOpacity
                style={[styles.capacityBtn, {backgroundColor: colors.muted}]}
                onPress={() => setCapacity((c) => Math.max(1, c - 1))}
                disabled={capacity <= 1}>
                <Ionicons name="remove" size={24} color={capacity <= 1 ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.capacityValue, {color: colors.foreground}]}>{capacity}</Text>
              <TouchableOpacity
                style={[styles.capacityBtn, {backgroundColor: colors.muted}]}
                onPress={() => setCapacity((c) => Math.min(99, c + 1))}>
                <Ionicons name="add" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, {backgroundColor: colors.primary}]}
              onPress={handleCreate}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.primaryButtonText, {color: colors.primaryForeground}]}>
                  {recurrenceMode === "single"
                    ? "Crear sesión grupal"
                    : `Crear ${Math.max(1, getDatesToCreate().length)} sesiones`}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Próximas sesiones</Text>
          {sessions.length === 0 ? (
            <Text style={{color: colors.mutedForeground}}>Aún no has creado sesiones grupales.</Text>
          ) : (
            sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/group-sessions/${session.id}` as any)}
                style={[styles.card, styles.sessionCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <View style={styles.sessionCardContent}>
                  <Text style={[styles.sessionTitle, {color: colors.foreground}]}>
                    {session.date} · {String(session.time).slice(0, 5)}
                  </Text>
                  {session.service_name && (
                    <Text style={[styles.sessionService, {color: colors.mutedForeground}]}>{session.service_name}</Text>
                  )}
                  {session.sub_category && (
                    <Text style={[styles.sessionService, {color: colors.primary, fontWeight: "600"}]}>{session.sub_category}</Text>
                  )}
                <Text style={{color: colors.mutedForeground}}>
                  Cupos: {session.booked_slots ?? 0}/{session.capacity}
                </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))
          )}
          </ScrollView>
        </View>
      )}

      {/* Modal selector de servicio */}
      <Modal
        visible={showServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowServiceModal(false)}>
          <Pressable style={[styles.modalContent, {backgroundColor: colors.card}]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHeader, {borderBottomColor: colors.border}]}>
              <Text style={[styles.modalTitle, {color: colors.foreground}]}>Seleccionar servicio</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            {services.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="briefcase-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.modalEmptyText, {color: colors.mutedForeground}]}>
                  No tienes servicios activos. Crea o activa servicios en "Mis servicios" primero.
                </Text>
                <TouchableOpacity
                  style={[styles.modalGoProfile, {backgroundColor: colors.primary}]}
                  onPress={() => {
                    setShowServiceModal(false);
                    router.push("/services");
                  }}>
                  <Text style={[styles.modalGoProfileText, {color: colors.primaryForeground}]}>
                    Ir a Mis servicios
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                {services.map((svc) => {
                  const isActive = selectedServiceInstanceId === svc.id;
                  return (
                    <TouchableOpacity
                      key={svc.id}
                      style={[
                        styles.modalItem,
                        {borderBottomColor: colors.border},
                        isActive && {backgroundColor: colors.primary + "15"},
                      ]}
                      onPress={() => {
                        setSelectedServiceInstanceId(svc.id);
                        setShowServiceModal(false);
                      }}
                      activeOpacity={0.7}>
                      <Text style={[styles.modalItemName, {color: colors.foreground}]}>{svc.name}</Text>
                      <Text style={[styles.modalItemMeta, {color: colors.mutedForeground}]}>
                        {svc.duration_minutes || 60} min
                        {svc.price != null ? ` · ${svc.price} MXN` : ""}
                      </Text>
                      {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollViewWrapper: {flex: 1, minHeight: 0},
  scrollView: {flex: 1},
  centered: {flex: 1, justifyContent: "center", alignItems: "center"},
  content: {padding: 16, gap: 12, paddingBottom: 80},
  sectionTitle: {fontSize: 16, fontWeight: "700"},
  card: {borderRadius: 12, borderWidth: 1, padding: 12, gap: 8},
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionCardContent: {flex: 1, gap: 2},
  sessionService: {fontSize: 13},
  label: {fontSize: 13, fontWeight: "600"},
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerButtonText: {fontSize: 15, flex: 1},
  iosPickerDone: {marginTop: 8, alignSelf: "flex-end"},
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  capacityBtn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  capacityValue: {fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center"},
  recurrenceRow: {flexDirection: "row", flexWrap: "wrap", gap: 8},
  recurrenceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  recurrenceChipText: {fontSize: 13, fontWeight: "600"},
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  addDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButton: {marginTop: 6, borderRadius: 10, paddingVertical: 12, alignItems: "center"},
  primaryButtonText: {fontWeight: "700"},
  sessionTitle: {fontSize: 15, fontWeight: "700"},
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {fontSize: 18, fontWeight: "700"},
  modalEmpty: {padding: 32, alignItems: "center", gap: 16},
  modalEmptyText: {fontSize: 15, textAlign: "center"},
  modalGoProfile: {paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12},
  modalGoProfileText: {fontWeight: "700"},
  modalList: {maxHeight: 360},
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalItemName: {fontSize: 16, fontWeight: "600", flex: 1},
  modalItemMeta: {fontSize: 13},
});
