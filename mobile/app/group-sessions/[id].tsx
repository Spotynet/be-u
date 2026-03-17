import React, {useEffect, useMemo, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import {useRouter, useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import {groupSessionApi, profileCustomizationApi, type GroupSessionParticipant} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {AppHeader} from "@/components/ui/AppHeader";

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

/** Parse duration string (HH:MM:SS or 1 00:00:00) to minutes */
const parseDurationToMinutes = (dur: string | null | undefined): number => {
  if (!dur || typeof dur !== "string") return 60;
  const parts = dur.trim().split(/[\s:]+/);
  if (parts.length >= 3) {
    const [h, m, s] = parts.slice(-3).map(Number);
    return (h || 0) * 60 + (m || 0) + (s || 0) / 60;
  }
  if (parts.length === 2) {
    return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
  }
  return 60;
};

const toDurationString = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = Math.max(minutes % 60, 0)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:00`;
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

export default function GroupSessionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{id?: string}>();
  const sessionId = useMemo(() => Number(params.id), [params.id]);
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();

  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [dateValue, setDateValue] = useState<Date>(() => new Date());
  const [timeValue, setTimeValue] = useState<Date>(() => new Date());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [capacity, setCapacity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [participants, setParticipants] = useState<GroupSessionParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showSubCatModal, setShowSubCatModal] = useState(false);

  const loadSession = async () => {
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await groupSessionApi.get(sessionId);
      const s = res.data;
      setSession(s);
      if (s) {
        const dateStr = s.date;
        const timeStr = String(s.time || "14:00").slice(0, 5);
        const [th, tm] = timeStr.split(":").map(Number);
        setDateValue(new Date(dateStr + "T12:00:00"));
        setTimeValue(new Date(2000, 0, 1, th || 14, tm || 0, 0));
        setDurationMinutes(parseDurationToMinutes(s.duration));
        setCapacity(s.capacity ?? 1);
        setNotes(s.notes ?? "");
        setSelectedSubCategory(s.sub_category ?? null);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo cargar la sesión.", [
        {text: "OK", onPress: () => router.back()},
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const res = await groupSessionApi.participants(sessionId);
      setParticipants(res.data.results);
    } catch {
      // silently ignore — non-owners get a 403 which is expected
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (sessionId > 0) loadParticipants();
  }, [sessionId]);

  useEffect(() => {
    if (!user || (user.role !== "PROFESSIONAL" && user.role !== "PLACE")) return;
    profileCustomizationApi
      .getProfileImages()
      .then((res) => {
        const cats: string[] = Array.isArray(res.data?.sub_categories) ? res.data.sub_categories : [];
        setSubCategories(cats);
      })
      .catch(() => {});
  }, [user]);

  const handleSave = async () => {
    if (!session) return;
    const now = new Date();
    const sessionDate = new Date(dateValue);
    sessionDate.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
    if (sessionDate <= now) {
      Alert.alert("Fecha inválida", "La sesión debe programarse en el futuro.");
      return;
    }
    try {
      setSaving(true);
      await groupSessionApi.update(sessionId, {
        date: formatDate(dateValue),
        time: `${formatTime(timeValue)}:00`,
        duration: toDurationString(durationMinutes),
        capacity: Math.max(1, capacity),
        notes: notes.trim() || undefined,
        sub_category: selectedSubCategory || null,
      });
      setEditing(false);
      await loadSession();
      await loadParticipants();
      Alert.alert("Listo", "Sesión actualizada.");
    } catch (e: any) {
      const msg =
        e?.message ||
        (e?.data && typeof e.data === "object" ? Object.values(e.data).flat().filter(Boolean)[0] : null) ||
        "No se pudo actualizar.";
      Alert.alert("Error", String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert("Inicia sesión", "Necesitas iniciar sesión para reservar.", [
        {text: "OK", onPress: () => router.push("/login")},
      ]);
      return;
    }
    try {
      setSaving(true);
      const res = await groupSessionApi.reserve(sessionId);
      await loadSession();
      const reservation = res?.data?.reservation;
      const msg =
        "Tu cupo ha sido reservado. Recibirás un correo de confirmación y la reserva aparecerá en tu calendario.";
      Alert.alert("Reservado", msg, [
        {text: "OK"},
        ...(reservation?.id
          ? [
              {
                text: "Ver reserva",
                onPress: () => router.push(`/reservation/${reservation.id}` as any),
              },
            ]
          : []),
      ]);
    } catch (e: any) {
      const msg =
        e?.message ||
        (e?.data && typeof e.data === "object" ? Object.values(e.data).flat().filter(Boolean)[0] : null) ||
        "No se pudo reservar.";
      Alert.alert("Error", String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!session) return;
    Alert.alert(
      "Cancelar sesión",
      "¿Marcar esta sesión como cancelada? Los cupos quedarán liberados.",
      [
        {text: "No", style: "cancel"},
        {
          text: "Sí, cancelar",
          onPress: async () => {
            try {
              setSaving(true);
              await groupSessionApi.update(sessionId, {status: "CANCELLED"});
              await loadSession();
              Alert.alert("Listo", "Sesión cancelada.");
            } catch (e: any) {
              Alert.alert("Error", e?.message || "No se pudo cancelar.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>Cargando sesión...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered, {backgroundColor: colors.background}]}>
        <Text style={[styles.errorText, {color: colors.mutedForeground}]}>Sesión no encontrada</Text>
        <TouchableOpacity style={[styles.backBtn, {backgroundColor: colors.primary}]} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, {color: colors.primaryForeground}]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive = session.status === "ACTIVE";
  const providerId = session.provider_object_id;
  const myProfileId =
    user?.role === "PROFESSIONAL"
      ? (user as any)?.professional_profile?.id ?? (user as any)?.professional_profile_id
      : user?.role === "PLACE"
        ? (user as any)?.place_profile?.id ?? (user as any)?.place_profile_id
        : null;
  const isOwner = providerId != null && myProfileId != null && Number(providerId) === Number(myProfileId);
  const canEdit = isActive && isOwner;
  const canReserve = isActive && !isOwner && (session.remaining_slots ?? 0) > 0 && isAuthenticated;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Detalle de sesión"
        showBackButton
        backFallbackRoute="/group-sessions"
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator>
          {/* Detalles */}
          <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={[styles.statusBadge, {backgroundColor: isActive ? "#22c55e" : "#94a3b8"}]}>
              <Text style={styles.statusBadgeText}>{STATUS_LABELS[session.status] || session.status}</Text>
            </View>

            <Text style={[styles.serviceName, {color: colors.foreground}]}>
              {session.service_name || "Servicio"}
            </Text>

            {!editing ? (
              <>
                <DetailRow
                  icon="calendar-outline"
                  label="Fecha"
                  value={session.date}
                  colors={colors}
                />
                <DetailRow
                  icon="time-outline"
                  label="Hora"
                  value={String(session.time).slice(0, 5)}
                  colors={colors}
                />
                <DetailRow
                  icon="hourglass-outline"
                  label="Duración"
                  value={`${parseDurationToMinutes(session.duration)} min`}
                  colors={colors}
                />
                <DetailRow
                  icon="people-outline"
                  label="Cupos"
                  value={`${session.booked_slots ?? 0}/${session.capacity}`}
                  colors={colors}
                />
                {session.sub_category ? (
                  <DetailRow icon="pricetag-outline" label="Subcategoría" value={session.sub_category} colors={colors} />
                ) : null}
                {session.notes ? (
                  <DetailRow icon="document-text-outline" label="Notas" value={session.notes} colors={colors} />
                ) : null}
              </>
            ) : (
              <>
                <Text style={[styles.label, {color: colors.foreground}]}>Fecha</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, {backgroundColor: colors.background, borderColor: colors.border}]}
                  onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={[styles.pickerText, {color: colors.foreground}]}>
                    {dateValue.toLocaleDateString("es-MX", {weekday: "long", day: "numeric", month: "long", year: "numeric"})}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateValue}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={minDate}
                    onChange={(_, d) => {
                      if (Platform.OS === "android") setShowDatePicker(false);
                      if (d) setDateValue(d);
                    }}
                    locale="es-MX"
                  />
                )}

                <Text style={[styles.label, {color: colors.foreground}]}>Hora</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, {backgroundColor: colors.background, borderColor: colors.border}]}
                  onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={[styles.pickerText, {color: colors.foreground}]}>
                    {timeValue.toLocaleTimeString("es-MX", {hour: "2-digit", minute: "2-digit"})}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={timeValue}
                    mode="time"
                    is24Hour
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, d) => {
                      if (Platform.OS === "android") setShowTimePicker(false);
                      if (d) setTimeValue(d);
                    }}
                    locale="es-MX"
                  />
                )}

                <Text style={[styles.label, {color: colors.foreground}]}>Duración (min)</Text>
                <View style={[styles.capacityRow, {backgroundColor: colors.background, borderColor: colors.border}]}>
                  <TouchableOpacity
                    style={[styles.capacityBtn, {backgroundColor: colors.muted}]}
                    onPress={() => setDurationMinutes((m) => Math.max(15, m - 15))}>
                    <Ionicons name="remove" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.capacityValue, {color: colors.foreground}]}>{durationMinutes}</Text>
                  <TouchableOpacity
                    style={[styles.capacityBtn, {backgroundColor: colors.muted}]}
                    onPress={() => setDurationMinutes((m) => Math.min(480, m + 15))}>
                    <Ionicons name="add" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, {color: colors.foreground}]}>Cupos (mín. {session.booked_slots || 0})</Text>
                <View style={[styles.capacityRow, {backgroundColor: colors.background, borderColor: colors.border}]}>
                  <TouchableOpacity
                    style={[styles.capacityBtn, {backgroundColor: colors.muted}]}
                    onPress={() => setCapacity((c) => Math.max(session.booked_slots || 0, c - 1))}
                    disabled={capacity <= (session.booked_slots || 0)}>
                    <Ionicons name="remove" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.capacityValue, {color: colors.foreground}]}>{capacity}</Text>
                  <TouchableOpacity
                    style={[styles.capacityBtn, {backgroundColor: colors.muted}]}
                    onPress={() => setCapacity((c) => Math.min(99, c + 1))}>
                    <Ionicons name="add" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {subCategories.length > 0 && (
                  <>
                    <Text style={[styles.label, {color: colors.foreground}]}>Subcategoría (opcional)</Text>
                    <TouchableOpacity
                      style={[styles.pickerButton, {backgroundColor: colors.background, borderColor: colors.border}]}
                      onPress={() => setShowSubCatModal(true)}
                      activeOpacity={0.7}>
                      <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                      <Text style={[styles.pickerText, {color: selectedSubCategory ? colors.foreground : colors.mutedForeground}]}>
                        {selectedSubCategory ?? "Sin subcategoría"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </>
                )}

                <Text style={[styles.label, {color: colors.foreground}]}>Notas</Text>
                <TextInput
                  style={[styles.notesInput, {backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground}]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notas opcionales..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
          </View>

          {/* Participantes (solo visible al dueño) */}
          {isOwner && (
            <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.participantsHeader}>
                <Ionicons name="people" size={18} color={colors.primary} />
                <Text style={[styles.participantsTitle, {color: colors.foreground}]}>
                  Participantes ({participants.length}/{session.capacity})
                </Text>
                {loadingParticipants && <ActivityIndicator size="small" color={colors.primary} />}
              </View>

              {!loadingParticipants && participants.length === 0 && (
                <Text style={[styles.emptyParticipants, {color: colors.mutedForeground}]}>
                  Aún no hay reservas para esta sesión.
                </Text>
              )}

              {participants.map((p, idx) => (
                <View
                  key={p.id}
                  style={[
                    styles.participantRow,
                    idx < participants.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}>
                  <View style={[styles.participantAvatar, {backgroundColor: colors.primary}]}>
                    <Text style={styles.participantAvatarText}>
                      {(p.client_name?.[0] ?? "?").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantName, {color: colors.foreground}]}>
                      {p.client_name || p.client_email}
                    </Text>
                    {!!p.client_phone && (
                      <Text style={[styles.participantSub, {color: colors.mutedForeground}]}>
                        {p.client_phone}
                      </Text>
                    )}
                    {!!p.client_email && (
                      <Text style={[styles.participantSub, {color: colors.mutedForeground}]}>
                        {p.client_email}
                      </Text>
                    )}
                    {!!p.notes && (
                      <Text style={[styles.participantSub, {color: colors.mutedForeground}]}>
                        Nota: {p.notes}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusPill, {backgroundColor: p.status === "CONFIRMED" ? "#22c55e22" : "#f59e0b22"}]}>
                    <Text style={[styles.statusPillText, {color: p.status === "CONFIRMED" ? "#16a34a" : "#b45309"}]}>
                      {p.status === "CONFIRMED" ? "Confirmado" : p.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Acciones */}
          <View style={styles.actions}>
            {!editing ? (
              <>
                {canEdit && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn, {backgroundColor: colors.primary}]}
                    onPress={() => setEditing(true)}>
                    <Ionicons name="pencil" size={20} color={colors.primaryForeground} />
                    <Text style={[styles.actionBtnText, {color: colors.primaryForeground}]}>Editar</Text>
                  </TouchableOpacity>
                )}
                {isActive && isOwner && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn, {borderColor: "#f59e0b", borderWidth: 1}]}
                    onPress={handleCancel}
                    disabled={saving}>
                    <Ionicons name="close-circle-outline" size={20} color="#f59e0b" />
                    <Text style={[styles.actionBtnText, {color: "#f59e0b"}]}>Cancelar sesión</Text>
                  </TouchableOpacity>
                )}
                {canReserve && (
                  <TouchableOpacity
                    style={[styles.actionBtn, {backgroundColor: colors.primary}]}
                    onPress={handleReserve}
                    disabled={saving}>
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.primaryForeground} />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={20} color={colors.primaryForeground} />
                        <Text style={[styles.actionBtnText, {color: colors.primaryForeground}]}>
                          Reservar cupo
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.saveBtn, {backgroundColor: colors.primary}]}
                  onPress={handleSave}
                  disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={colors.primaryForeground} />
                      <Text style={[styles.actionBtnText, {color: colors.primaryForeground}]}>Guardar</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, {borderColor: colors.border, borderWidth: 1}]}
                  onPress={() => setEditing(false)}
                  disabled={saving}>
                  <Text style={[styles.actionBtnText, {color: colors.foreground}]}>Descartar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showSubCatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubCatModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSubCatModal(false)}>
          <Pressable style={[styles.modalContent, {backgroundColor: colors.card}]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHeader, {borderBottomColor: colors.border}]}>
              <Text style={[styles.modalTitle, {color: colors.foreground}]}>Subcategoría</Text>
              <TouchableOpacity onPress={() => setShowSubCatModal(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                style={[styles.modalItem, {borderBottomColor: colors.border}, !selectedSubCategory && {backgroundColor: colors.primary + "15"}]}
                onPress={() => {setSelectedSubCategory(null); setShowSubCatModal(false);}}>
                <Text style={[styles.modalItemName, {color: colors.foreground}]}>Sin subcategoría</Text>
                {!selectedSubCategory && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
              {subCategories.map((sc) => {
                const active = selectedSubCategory === sc;
                return (
                  <TouchableOpacity
                    key={sc}
                    style={[styles.modalItem, {borderBottomColor: colors.border}, active && {backgroundColor: colors.primary + "15"}]}
                    onPress={() => {setSelectedSubCategory(sc); setShowSubCatModal(false);}}>
                    <Text style={[styles.modalItemName, {color: colors.foreground}]}>{sc}</Text>
                    {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.mutedForeground} />
      <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>{label}:</Text>
      <Text style={[styles.detailValue, {color: colors.foreground}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  scrollView: {flex: 1},
  content: {padding: 16, gap: 16, paddingBottom: 40},
  centered: {justifyContent: "center", alignItems: "center"},
  loadingText: {marginTop: 12, fontSize: 15},
  errorText: {fontSize: 15},
  backBtn: {marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10},
  backBtnText: {fontWeight: "700"},
  card: {borderRadius: 12, borderWidth: 1, padding: 16, gap: 12},
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {color: "#fff", fontSize: 12, fontWeight: "600"},
  serviceName: {fontSize: 18, fontWeight: "700"},
  detailRow: {flexDirection: "row", alignItems: "center", gap: 8},
  detailLabel: {fontSize: 14},
  detailValue: {fontSize: 14, fontWeight: "500", flex: 1},
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
  pickerText: {fontSize: 15, flex: 1},
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
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  participantsHeader: {flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4},
  participantsTitle: {fontSize: 15, fontWeight: "700", flex: 1},
  emptyParticipants: {fontSize: 14, fontStyle: "italic", paddingVertical: 8},
  participantRow: {flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12},
  participantAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  participantAvatarText: {color: "#fff", fontWeight: "700", fontSize: 16},
  participantInfo: {flex: 1, gap: 2},
  participantName: {fontSize: 14, fontWeight: "600"},
  participantSub: {fontSize: 12},
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  statusPillText: {fontSize: 11, fontWeight: "600"},
  actions: {gap: 12},
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  editBtn: {},
  saveBtn: {},
  cancelBtn: {},
  actionBtnText: {fontWeight: "700", fontSize: 15},
  modalOverlay: {flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end"},
  modalContent: {borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%"},
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {fontSize: 18, fontWeight: "700"},
  modalList: {maxHeight: 320},
  modalItem: {flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, gap: 12},
  modalItemName: {fontSize: 16, fontWeight: "600", flex: 1},
});
