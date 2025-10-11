import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {DateTimePicker} from "./DateTimePicker";
import {reservationApi} from "@/lib/api";

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  serviceName: string;
  serviceId: number;
  providerId: number;
  providerType: "professional" | "place";
  providerName: string;
}

export function BookingModal({
  visible,
  onClose,
  serviceName,
  serviceId,
  providerId,
  providerType,
  providerName,
}: BookingModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Error", "Por favor selecciona fecha y hora");
      return;
    }

    try {
      setIsSubmitting(true);
      const dateString = selectedDate.toISOString().split("T")[0];
      await reservationApi.createReservation({
        service: serviceId,
        date: dateString,
        time: selectedTime + ":00",
        notes: notes.trim() || undefined,
        provider_type: providerType,
        provider_id: providerId,
      });

      Alert.alert("¡Éxito!", "Tu reserva ha sido creada", [
        {
          text: "OK",
          onPress: () => {
            onClose();
            setSelectedDate(null);
            setSelectedTime(null);
            setNotes("");
          },
        },
      ]);
    } catch (err: any) {
      console.error("Error creating reservation:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "No se pudo crear la reserva. Intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        {/* Header */}
        <View style={[styles.header, {borderBottomColor: colors.border}]}>
          <View>
            <Text style={[styles.title, {color: colors.foreground}]}>Agendar Cita</Text>
            <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
              {serviceName} - {providerName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date & Time Picker */}
          <DateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
          />

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Notas (Opcional)</Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="¿Algo que debamos saber?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>

          {/* Summary */}
          {selectedDate && selectedTime && (
            <View style={[styles.summary, {backgroundColor: colors.card}]}>
              <Text style={[styles.summaryTitle, {color: colors.foreground}]}>Resumen</Text>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar" color={colors.primary} size={20} />
                <Text style={[styles.summaryText, {color: colors.foreground}]}>
                  {selectedDate.toLocaleDateString("es-MX", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time" color={colors.primary} size={20} />
                <Text style={[styles.summaryText, {color: colors.foreground}]}>{selectedTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="cut" color={colors.primary} size={20} />
                <Text style={[styles.summaryText, {color: colors.foreground}]}>{serviceName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="person" color={colors.primary} size={20} />
                <Text style={[styles.summaryText, {color: colors.foreground}]}>{providerName}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.footer, {borderTopColor: colors.border}]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {backgroundColor: colors.primary},
              (!selectedDate || !selectedTime) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedDate || !selectedTime || isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Confirmar Reserva</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
  summary: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryText: {
    fontSize: 15,
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
