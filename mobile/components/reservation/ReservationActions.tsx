import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {reservationApi} from "@/lib/api";
import {Reservation} from "@/types/global";
import {useState} from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

type ReservationActionsProps = {
  reservation: Reservation;
  isClient: boolean;
  onUpdated: (updated: Reservation) => void;
  onCancelled: () => void;
  /** When "header", renders compact icon buttons for header placement */
  variant?: "default" | "header";
};

function formatDateForInput(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDateToAPI(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTimeToDate(timeStr: string, baseDate: Date): Date {
  const [h, m] = (timeStr || "09:00").slice(0, 5).split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h || 9, m || 0, 0, 0);
  return d;
}

function formatTimeFromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ReservationActions({
  reservation,
  isClient,
  onUpdated,
  onCancelled,
  variant = "default",
}: ReservationActionsProps) {
  const {colors} = useThemeVariant();
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modifyDate, setModifyDate] = useState(() => formatDateForInput(reservation.date));
  const [modifyTime, setModifyTime] = useState(() =>
    parseTimeToDate(reservation.time, formatDateForInput(reservation.date))
  );
  const [modifyNotes, setModifyNotes] = useState(reservation.notes || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const canModifyOrCancel =
    isClient &&
    (reservation.status === "PENDING" || reservation.status === "CONFIRMED");

  if (!canModifyOrCancel) return null;

  const handleCancel = () => {
    Alert.alert(
      "Cancelar reserva",
      "¿Estás seguro de que deseas cancelar esta reserva?",
      [
        {text: "No", style: "cancel"},
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              await reservationApi.cancelReservation(reservation.id);
              onCancelled();
            } catch (e: any) {
              const msg =
                e?.response?.data?.detail ||
                e?.response?.data?.reason?.[0] ||
                e?.message ||
                "No se pudo cancelar la reserva";
              Alert.alert("Error", msg);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveModify = async () => {
    setIsSaving(true);
    try {
      const dateStr = formatDateToAPI(modifyDate);
      const timeStr = formatTimeFromDate(modifyTime);
      const res = await reservationApi.patchReservation(reservation.id, {
        date: dateStr,
        time: timeStr,
        notes: modifyNotes.trim() || undefined,
      });
      setShowModifyModal(false);
      if (res?.data) onUpdated(res.data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        (Array.isArray(e?.response?.data?.date)
          ? e.response.data.date[0]
          : null) ||
        (Array.isArray(e?.response?.data?.time)
          ? e.response.data.time[0]
          : null) ||
        e?.message ||
        "No se pudo modificar la reserva";
      Alert.alert("Error", String(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const openModifyModal = () => {
    setModifyDate(formatDateForInput(reservation.date));
    setModifyTime(
      parseTimeToDate(reservation.time, formatDateForInput(reservation.date))
    );
    setModifyNotes(reservation.notes || "");
    setShowModifyModal(true);
  };

  const headerButtons = variant === "header" && (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={[styles.headerButton, {borderColor: colors.border}]}
        onPress={openModifyModal}
        activeOpacity={0.7}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Ionicons name="create-outline" size={22} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.headerButton, {borderColor: colors.border}]}
        onPress={handleCancel}
        disabled={isCancelling}
        activeOpacity={0.7}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        {isCancelling ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        )}
      </TouchableOpacity>
    </View>
  );

  const defaultButtons = (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.modifyButton, {backgroundColor: colors.primary}]}
        onPress={openModifyModal}
        activeOpacity={0.8}>
        <Ionicons name="create-outline" size={18} color="#ffffff" />
        <Text style={styles.buttonText}>Modificar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton, {backgroundColor: "#ef4444"}]}
        onPress={handleCancel}
        disabled={isCancelling}
        activeOpacity={0.8}>
        {isCancelling ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons name="close-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Cancelar reserva</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {variant === "header" ? headerButtons : defaultButtons}
      <Modal
        visible={showModifyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModifyModal(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModifyModal(false)}>
          <Pressable
            style={[styles.modalContent, {backgroundColor: colors.card}]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              Modificar reserva
            </Text>

            <Text style={[styles.label, {color: colors.foreground}]}>Fecha</Text>
            <TouchableOpacity
              style={[styles.input, {borderColor: colors.border, backgroundColor: colors.background}]}
              onPress={() => setShowDatePicker(true)}>
              <Text style={{color: colors.foreground}}>
                {modifyDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Ionicons name="calendar-outline" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={modifyDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={(_, d) => {
                  if (d) setModifyDate(d);
                  if (Platform.OS !== "ios") setShowDatePicker(false);
                }}
              />
            )}

            <Text style={[styles.label, {color: colors.foreground, marginTop: 12}]}>Hora</Text>
            <TouchableOpacity
              style={[styles.input, {borderColor: colors.border, backgroundColor: colors.background}]}
              onPress={() => setShowTimePicker(true)}>
              <Text style={{color: colors.foreground}}>
                {formatTimeFromDate(modifyTime)}
              </Text>
              <Ionicons name="time-outline" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={modifyTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => {
                  if (d) setModifyTime(d);
                  if (Platform.OS !== "ios") setShowTimePicker(false);
                }}
              />
            )}

            <Text style={[styles.label, {color: colors.foreground, marginTop: 12}]}>
              Notas (opcional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {borderColor: colors.border, color: colors.foreground},
              ]}
              placeholder="Agregar o cambiar notas..."
              placeholderTextColor={colors.mutedForeground}
              value={modifyNotes}
              onChangeText={setModifyNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, {borderColor: colors.border}]}
                onPress={() => setShowModifyModal(false)}
                disabled={isSaving}>
                <Text style={{color: colors.foreground}}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, {backgroundColor: colors.primary}]}
                onPress={handleSaveModify}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Guardar cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modifyButton: {},
  cancelButton: {},
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonPrimaryText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
});
