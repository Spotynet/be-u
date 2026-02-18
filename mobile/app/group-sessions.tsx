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
import {groupSessionApi, serviceApi} from "@/lib/api";
import {useAuth} from "@/features/auth";

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
};

const normalizeService = (s: any): ServiceItem => ({
  id: s.id,
  name: s.name || s.service_name || s.service?.name || "Servicio",
  service: s.service ?? s.service_type_id ?? s.service_details?.id ?? s.id,
  service_type_id: s.service_type_id ?? s.service,
  duration_minutes: s.duration_minutes ?? 60,
  price: s.price,
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

  const selectedService = useMemo(
    () => services.find((svc) => svc.id === selectedServiceInstanceId),
    [services, selectedServiceInstanceId]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionResponse, placeRes, profRes] = await Promise.all([
        groupSessionApi.list(),
        isPlace ? serviceApi.getPlaceServices({is_active: true}) : Promise.resolve({data: {results: []}}),
        !isPlace ? serviceApi.getProfessionalServices({is_active: true}) : Promise.resolve({data: {results: []}}),
      ]);

      const serviceList =
        isPlace ? placeRes.data?.results || placeRes.data || [] : profRes.data?.results || profRes.data || [];
      setServices(serviceList.map(normalizeService));
      setSessions(sessionResponse.data?.results || []);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo cargar sesiones grupales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!selectedService) {
      Alert.alert("Servicio requerido", "Selecciona un servicio para la sesión grupal.");
      setShowServiceModal(true);
      return;
    }
    const dateStr = formatDate(dateValue);
    const timeStr = formatTime(timeValue);
    const parsedCapacity = Math.max(1, capacity);

    const now = new Date();
    const sessionDateTime = new Date(dateValue);
    sessionDateTime.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
    if (sessionDateTime <= now) {
      Alert.alert("Fecha inválida", "La sesión debe programarse en el futuro.");
      return;
    }

    try {
      setSaving(true);
      const durationMinutes = Number(selectedService.duration_minutes || 60);
      await groupSessionApi.create({
        service: selectedService.service,
        service_instance_id: selectedService.id,
        date: dateStr,
        time: `${timeStr}:00`,
        duration: toDurationString(durationMinutes),
        capacity: parsedCapacity,
      });
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
      await loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo crear la sesión grupal.");
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
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Sesiones Grupales</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
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
                  Crear sesión grupal
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Próximas sesiones</Text>
          {sessions.length === 0 ? (
            <Text style={{color: colors.mutedForeground}}>Aún no has creado sesiones grupales.</Text>
          ) : (
            sessions.map((session) => (
              <View key={session.id} style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <Text style={[styles.sessionTitle, {color: colors.foreground}]}>
                  {session.date} · {String(session.time).slice(0, 5)}
                </Text>
                <Text style={{color: colors.mutedForeground}}>
                  Cupos: {session.booked_slots}/{session.capacity}
                </Text>
                <Text style={{color: colors.mutedForeground}}>Disponibles: {session.remaining_slots}</Text>
              </View>
            ))
          )}
        </ScrollView>
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
                  No tienes servicios. Crea servicios en tu perfil primero.
                </Text>
                <TouchableOpacity
                  style={[styles.modalGoProfile, {backgroundColor: colors.primary}]}
                  onPress={() => {
                    setShowServiceModal(false);
                    router.push("/profile/services");
                  }}>
                  <Text style={[styles.modalGoProfileText, {color: colors.primaryForeground}]}>Ir a servicios</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {width: 36, alignItems: "center"},
  headerTitle: {fontSize: 17, fontWeight: "700"},
  centered: {flex: 1, justifyContent: "center", alignItems: "center"},
  content: {padding: 16, gap: 12, paddingBottom: 40},
  sectionTitle: {fontSize: 16, fontWeight: "700"},
  card: {borderRadius: 12, borderWidth: 1, padding: 12, gap: 8},
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
