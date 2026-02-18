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
} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
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

export default function GroupSessionsScreen() {
  const router = useRouter();
  const {colors} = useThemeVariant();
  const {user} = useAuth();
  const isPlace = user?.role === "PLACE";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [selectedServiceInstanceId, setSelectedServiceInstanceId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("1");

  const selectedService = useMemo(
    () => services.find((svc) => svc.id === selectedServiceInstanceId),
    [services, selectedServiceInstanceId]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [serviceResponse, sessionResponse] = await Promise.all([
        isPlace ? serviceApi.getPlaceServices() : serviceApi.getProfessionalServices(),
        groupSessionApi.list(),
      ]);
      setServices(serviceResponse.data?.results || []);
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
      return;
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Fecha inválida", "Usa formato YYYY-MM-DD.");
      return;
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert("Hora inválida", "Usa formato HH:MM.");
      return;
    }
    const parsedCapacity = Number(capacity);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
      Alert.alert("Cupos inválidos", "El número de cupos debe ser mayor a 0.");
      return;
    }

    try {
      setSaving(true);
      const durationMinutes = Number(selectedService.duration_minutes || 60);
      await groupSessionApi.create({
        service: selectedService.service,
        service_instance_id: selectedService.id,
        date,
        time: `${time}:00`,
        duration: toDurationString(durationMinutes),
        capacity: parsedCapacity,
      });
      setDate("");
      setTime("");
      setCapacity("1");
      setSelectedServiceInstanceId(null);
      await loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo crear la sesión grupal.");
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={[styles.label, {color: colors.foreground}]}>Servicio</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {services.map((service) => {
                const active = selectedServiceInstanceId === service.id;
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.background,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedServiceInstanceId(service.id)}>
                    <Text style={{color: active ? colors.primaryForeground : colors.foreground}}>
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, {color: colors.foreground}]}>Fecha (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
              placeholder="2026-02-28"
              placeholderTextColor={colors.mutedForeground}
              value={date}
              onChangeText={setDate}
            />

            <Text style={[styles.label, {color: colors.foreground}]}>Hora (HH:MM)</Text>
            <TextInput
              style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
              placeholder="15:30"
              placeholderTextColor={colors.mutedForeground}
              value={time}
              onChangeText={setTime}
            />

            <Text style={[styles.label, {color: colors.foreground}]}>Cupos</Text>
            <TextInput
              style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
              placeholder="1"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={capacity}
              onChangeText={setCapacity}
            />

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
  content: {padding: 16, gap: 12},
  sectionTitle: {fontSize: 16, fontWeight: "700"},
  card: {borderRadius: 12, borderWidth: 1, padding: 12, gap: 8},
  label: {fontSize: 13, fontWeight: "600"},
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipsRow: {gap: 8},
  chip: {paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1},
  primaryButton: {marginTop: 6, borderRadius: 10, paddingVertical: 12, alignItems: "center"},
  primaryButtonText: {fontWeight: "700"},
  sessionTitle: {fontSize: 15, fontWeight: "700"},
});
