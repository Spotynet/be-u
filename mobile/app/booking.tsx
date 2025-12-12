import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useAuth} from "@/features/auth";
import {useReservationFlow} from "@/features/reservations";
import {CalendarView} from "@/components/calendar";
import DateTimePicker from "@react-native-community/datetimepicker";
import {useRouter, useLocalSearchParams} from "expo-router";
import {useNavigation} from "@/hooks/useNavigation";

export default function BookingScreen() {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {goBack} = useNavigation();
  const {user, isAuthenticated} = useAuth();
  const params = useLocalSearchParams<{
    serviceId?: string;
    serviceName?: string;
    serviceType?: string;
    providerId?: string;
    providerName?: string;
    price?: string;
    duration?: string;
  }>();

  const {state, isLoading, selectService, setNotes, createReservation} =
    useReservationFlow();

  const [localNotes, setLocalNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Initialize service from params
  const normalizedServiceType =
    params.serviceType === "place_service"
      ? "place"
      : params.serviceType === "professional_service"
        ? "professional"
        : ((params.serviceType as "place" | "professional") || "place");

  const serviceInfo = params.serviceId
    ? {
        serviceId: parseInt(params.serviceId),
        serviceName: params.serviceName || "Servicio",
        serviceType: normalizedServiceType,
        providerId: parseInt(params.providerId || "0"),
        providerName: params.providerName || "Proveedor",
        price: parseFloat(params.price || "0"),
        duration: parseInt(params.duration || "60"),
      }
    : null;

  // Initialize the service in the hook when component mounts
  useEffect(() => {
    if (serviceInfo && !state.service) {
      selectService(serviceInfo);
    }
  }, [serviceInfo?.serviceId]);

  const handleDateSelect = (date: string) => {
    const dateObj = new Date(date);
    setSelectedDate(dateObj);
    setShowDatePicker(false);
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    
    if (event.type === "set" && date) {
      setSelectedTime(date);
      if (Platform.OS === "ios") {
        setShowTimePicker(false);
      }
    } else if (event.type === "dismissed") {
      setShowTimePicker(false);
    }
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const getEndTime = (startTime: Date, durationMinutes: number): Date => {
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    return endTime;
  };

  const handleConfirmBooking = async () => {
    if (!serviceInfo || !selectedDate || !selectedTime) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    // Create a time slot object for the reservation flow
    const timeSlot = {
      time: formatTime(selectedTime),
      end_time: formatTime(getEndTime(selectedTime, serviceInfo.duration)),
    };

    // Set the date and time in the flow
    const dateStr = selectedDate.toISOString().split("T")[0];
    
    // Manually set the state for the reservation
    setNotes(localNotes);
    
    // Create reservation directly
    try {
      const reservationData = {
        service: serviceInfo.serviceId,
        provider_type: serviceInfo.serviceType,
        provider_id: serviceInfo.providerId,
        service_instance_type:
          serviceInfo.serviceType === "place" ? "place_service" : "professional_service",
        service_instance_id: serviceInfo.serviceId,
        date: dateStr,
        time: timeSlot.time,
        notes: localNotes,
      };

      const {reservationApi} = await import("@/lib/api");
      const response = await reservationApi.createReservation(reservationData as any);
      
      Alert.alert(
        "¡Solicitud Enviada!",
        "Tu solicitud de reserva ha sido enviada y está pendiente de confirmación por parte del proveedor. Te notificaremos cuando sea aceptada o rechazada.",
        [
          {
            text: "Ver Mis Reservas",
            onPress: () => router.push("/(tabs)/perfil"),
          },
          {
            text: "OK",
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "No se pudo crear la reserva");
    }
  };

  if (!isAuthenticated || !user || user.role !== "CLIENT") {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Solo los clientes pueden hacer reservas
          </Text>
        </View>
      </View>
    );
  }

  if (!serviceInfo) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Información de servicio no disponible
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: Math.max(insets.top + 16, 20),
          },
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBack("/(tabs)/explore")}
          activeOpacity={0.7}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="arrow-back" color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Reserva</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Service Info Card */}
      <View style={[styles.serviceCard, {backgroundColor: colors.card}]}>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, {color: colors.foreground}]}>
            {serviceInfo.serviceName}
          </Text>
          <Text style={[styles.providerName, {color: colors.mutedForeground}]}>
            {serviceInfo.providerName}
          </Text>
        </View>
        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.detailText, {color: colors.foreground}]}>
              {serviceInfo.duration} min
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={[styles.priceText, {color: colors.primary}]}>${serviceInfo.price}</Text>
          </View>
        </View>
      </View>

      {/* Steps */}
      <View style={[styles.stepsContainer, {backgroundColor: colors.background}]}>
        <View style={styles.step}>
          <View
            style={[
              styles.stepNumber,
              {
                backgroundColor: selectedDate ? colors.primary : colors.muted,
              },
            ]}>
            <Text
              style={[
                styles.stepNumberText,
                {color: selectedDate ? "#ffffff" : colors.mutedForeground},
              ]}>
              1
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              {color: selectedDate ? colors.primary : colors.mutedForeground},
            ]}>
            Fecha
          </Text>
        </View>

        <View style={[styles.stepDivider, {backgroundColor: colors.border}]} />

        <View style={styles.step}>
          <View
            style={[
              styles.stepNumber,
              {
                backgroundColor: selectedTime ? colors.primary : colors.muted,
              },
            ]}>
            <Text
              style={[
                styles.stepNumberText,
                {color: selectedTime ? "#ffffff" : colors.mutedForeground},
              ]}>
              2
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              {color: selectedTime ? colors.primary : colors.mutedForeground},
            ]}>
            Hora
          </Text>
        </View>

        <View style={[styles.stepDivider, {backgroundColor: colors.border}]} />

        <View style={styles.step}>
          <View
            style={[
              styles.stepNumber,
              {
                backgroundColor: selectedDate && selectedTime ? colors.primary : colors.muted,
              },
            ]}>
            <Text
              style={[
                styles.stepNumberText,
                {color: selectedDate && selectedTime ? "#ffffff" : colors.mutedForeground},
              ]}>
              3
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              {color: selectedDate && selectedTime ? colors.primary : colors.mutedForeground},
            ]}>
            Confirmar
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Step 1: Date Selection */}
        {!selectedDate ? (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, {color: colors.foreground}]}>Selecciona una fecha</Text>
            <CalendarView
              reservations={[]}
              onDayPress={(date) => handleDateSelect(date)}
              selectedDate={selectedDate?.toISOString().split("T")[0]}
              minDate={new Date().toISOString().split("T")[0]}
            />
          </View>
        ) : !selectedTime ? (
          // Step 2: Time Selection
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => setSelectedDate(null)} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>
                Selecciona una hora
              </Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.timePickerContainer}>
              <Text style={[styles.timePickerLabel, {color: colors.mutedForeground}]}>
                {selectedDate.toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
              
              <TouchableOpacity
                style={[styles.timePickerButton, {backgroundColor: colors.card, borderColor: colors.border}]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <Text style={[styles.timePickerText, {color: colors.foreground}]}>
                  {selectedTime ? formatTime(selectedTime) : "Seleccionar hora"}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime || new Date()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}

              <View style={[styles.infoCard, {backgroundColor: colors.primary + "10"}]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.infoText, {color: colors.primary}]}>
                  Elige la hora que prefieras. El proveedor revisará tu solicitud y te confirmará si está disponible.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          // Step 3: Confirmation
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TouchableOpacity
                onPress={() => setSelectedTime(null)}
                activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>
                Confirma tu solicitud
              </Text>
              <View style={styles.placeholder} />
            </View>

            {/* Summary Card */}
            <View style={[styles.summaryCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.summaryTitle, {color: colors.foreground}]}>
                Resumen de Reserva
              </Text>

              <View style={styles.summaryItem}>
                <Ionicons name="cut" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>
                    Servicio
                  </Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    {serviceInfo.serviceName}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>Fecha</Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    {selectedDate && selectedDate.toLocaleDateString("es-MX", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>Hora</Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    {selectedTime && formatTime(selectedTime)} - {selectedTime && formatTime(getEndTime(selectedTime, serviceInfo.duration))}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Ionicons name="cash" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>Precio</Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    ${serviceInfo.price}
                  </Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={[styles.label, {color: colors.foreground}]}>
                Notas para el proveedor (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={localNotes}
                onChangeText={setLocalNotes}
                placeholder="Ej: Alergia a ciertos productos, preferencias específicas..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Info */}
            <View style={[styles.infoCard, {backgroundColor: "#3b82f6" + "10"}]}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={[styles.infoText, {color: "#3b82f6"}]}>
                Tu solicitud será enviada al proveedor. Te notificaremos cuando la acepte o rechace.
              </Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmButton, {backgroundColor: colors.primary}]}
              onPress={handleConfirmBooking}
              disabled={isLoading}
              activeOpacity={0.9}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>Enviar Solicitud</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  serviceCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  serviceInfo: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    fontWeight: "500",
  },
  serviceDetails: {
    flexDirection: "row",
    gap: 20,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  step: {
    alignItems: "center",
    gap: 8,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  stepDivider: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContent: {
    padding: 16,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  notesSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  notesInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  timePickerContainer: {
    gap: 20,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
    marginBottom: 8,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  timePickerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
});
