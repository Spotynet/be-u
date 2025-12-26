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
    serviceInstanceId?: string;
    serviceTypeId?: string;
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
  const [timeInputText, setTimeInputText] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Service info from params - all data comes directly from navigation
  // Parse and validate required params
  const parsedServiceInstanceId = params.serviceInstanceId ? parseInt(params.serviceInstanceId) : 0;
  const parsedServiceTypeId = params.serviceTypeId ? parseInt(params.serviceTypeId) : 0;
  
  const hasRequiredParams = parsedServiceInstanceId > 0 && parsedServiceTypeId > 0;

  const serviceInfo = hasRequiredParams
    ? {
        serviceInstanceId: parsedServiceInstanceId,
        serviceTypeId: parsedServiceTypeId,
        serviceName: params.serviceName || "Servicio",
        serviceType: params.serviceType || "place_service",
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
  }, [serviceInfo?.serviceInstanceId]);

  const handleDateSelect = (date: string) => {
    const dateObj = new Date(date);
    setSelectedDate(dateObj);
    setShowDatePicker(false);
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      // Android shows a modal, so close it after selection
      setShowTimePicker(false);
      if (event.type === "set" && date) {
        setSelectedTime(date);
      }
    } else {
      // iOS shows inline spinner
      if (event.type === "set" && date) {
        setSelectedTime(date);
        // Keep picker open on iOS spinner mode
      } else if (event.type === "dismissed") {
        setShowTimePicker(false);
      }
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
    if (isSubmitting) return; // Prevent multiple submissions
    
    if (!serviceInfo) {
      Alert.alert("Error", "Información del servicio no disponible");
      return;
    }
    
    if (!selectedDate) {
      Alert.alert("Error", "Por favor selecciona una fecha");
      return;
    }
    
    if (!selectedTime) {
      Alert.alert("Error", "Por favor selecciona una hora");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create a time slot object for the reservation flow
      const timeSlot = {
        time: formatTime(selectedTime),
        end_time: formatTime(getEndTime(selectedTime, serviceInfo.duration)),
      };

      // Set the date and time in the flow
      const dateStr = selectedDate.toISOString().split("T")[0];
      
      // Create reservation with simplified data structure
      const reservationData = {
        service_instance_id: serviceInfo.serviceInstanceId,
        service_instance_type: serviceInfo.serviceType,
        date: dateStr,
        time: timeSlot.time,
        notes: localNotes,
      };

      const {reservationApi} = await import("@/lib/api");
      const response = await reservationApi.createReservation(reservationData as any);
      
      console.log("Reservation created successfully:", response.data);
      
      // Set success state for visual feedback
      setReservationSuccess(true);
      
      // Show success feedback briefly, then redirect automatically
      Alert.alert(
        "¡Solicitud Enviada!",
        "Tu solicitud de reserva ha sido enviada y está pendiente de confirmación por parte del proveedor. Te notificaremos cuando sea aceptada o rechazada.\n\nRedirigiendo a tus reservas...",
        [
          {
            text: "Ver Mis Reservas",
            onPress: () => {
              router.push("/(tabs)/perfil");
            },
          },
        ],
        { cancelable: false }
      );
      
      // Auto-redirect to profile/reservations page after showing success message
      // Give user time to see the success message (2 seconds)
      setTimeout(() => {
        router.push("/(tabs)/perfil");
      }, 2000);
    } catch (err: any) {
      console.error("Error creating reservation:", err);
      console.error("Error response data:", err?.response?.data);
      
      // Handle Django REST Framework validation errors
      let errorMessage = "No se pudo crear la reserva";
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        
        // Check for specific error about service instance not found (CustomService case)
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          const serviceNotFoundError = errorData.non_field_errors.find((msg: string) => 
            msg.includes("Service instance with ID") && msg.includes("not found")
          );
          if (serviceNotFoundError) {
            errorMessage = "Este servicio no puede ser reservado a través de la aplicación. Por favor, contacta directamente al proveedor para coordinar tu cita.";
            Alert.alert("Servicio no disponible para reservas", errorMessage);
            return;
          }
        }
        
        // Check for validation errors (field-specific errors like {service: ["Invalid pk..."]})
        const fieldErrors: string[] = [];
        for (const [field, errors] of Object.entries(errorData)) {
          if (Array.isArray(errors)) {
            fieldErrors.push(`${field}: ${errors.join(", ")}`);
          } else if (typeof errors === "string") {
            fieldErrors.push(`${field}: ${errors}`);
          }
        }
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join("\n");
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else {
        // Use errorUtils for other error types
        const {errorUtils} = await import("@/lib/api");
        errorMessage = errorUtils.getErrorMessage(err);
      }
      
      Alert.alert("Error al crear la reserva", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Debes iniciar sesión para hacer una reserva
          </Text>
        </View>
      </View>
    );
  }

  if (!serviceInfo) {
    // Debug: log what params we received
    console.log('Booking page params:', params);
    console.log('Parsed values:', { 
      parsedServiceInstanceId, 
      parsedServiceTypeId, 
      hasRequiredParams 
    });
    
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Información de servicio no disponible
          </Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground, marginTop: 8, fontSize: 12}]}>
            serviceInstanceId: {params.serviceInstanceId || 'missing'}
          </Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground, fontSize: 12}]}>
            serviceTypeId: {params.serviceTypeId || 'missing'}
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
              
              {Platform.OS === "web" ? (
                <View style={styles.timeInputContainer}>
                  <Ionicons name="time-outline" size={24} color={colors.primary} />
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: colors.card,
                        color: colors.foreground,
                        borderColor: colors.border,
                      },
                    ]}
                    value={timeInputText || (selectedTime ? formatTime(selectedTime) : "")}
                    placeholder="HH:MM (ej: 14:30)"
                    placeholderTextColor={colors.mutedForeground}
                    onChangeText={(text) => {
                      // Allow typing and format as user types
                      // Remove non-numeric characters except colon
                      let formatted = text.replace(/[^0-9:]/g, '');
                      
                      // Auto-format with colon after 2 digits
                      if (formatted.length === 2 && !formatted.includes(':')) {
                        formatted = formatted + ':';
                      }
                      
                      // Limit length
                      if (formatted.length > 5) {
                        formatted = formatted.substring(0, 5);
                      }
                      
                      // Update input text immediately
                      setTimeInputText(formatted);
                      
                      // Try to parse and set time if valid format
                      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                      if (timeRegex.test(formatted) && formatted.length === 5) {
                        const [hours, minutes] = formatted.split(":").map(Number);
                        const date = new Date();
                        date.setHours(hours, minutes, 0, 0);
                        setSelectedTime(date);
                      } else if (formatted === "") {
                        setSelectedTime(null);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                    editable={true}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.timePickerButton, {backgroundColor: colors.card, borderColor: colors.border}]}
                    onPress={() => {
                      setShowTimePicker(true);
                    }}
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
                      minimumDate={selectedDate || new Date()}
                    />
                  )}
                </>
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

            {/* Success Message */}
            {reservationSuccess && (
              <View style={[styles.successCard, {backgroundColor: "#10b981" + "20", borderColor: "#10b981"}]}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <View style={styles.successTextContainer}>
                  <Text style={[styles.successTitle, {color: "#10b981"}]}>
                    ¡Solicitud Enviada Exitosamente!
                  </Text>
                  <Text style={[styles.successText, {color: colors.foreground}]}>
                    Tu solicitud de reserva ha sido enviada y está pendiente de confirmación por parte del proveedor.
                  </Text>
                </View>
              </View>
            )}

            {/* Info */}
            {!reservationSuccess && (
              <View style={[styles.infoCard, {backgroundColor: "#3b82f6" + "10"}]}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={[styles.infoText, {color: "#3b82f6"}]}>
                  Tu solicitud será enviada al proveedor. Te notificaremos cuando la acepte o rechace.
                </Text>
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor: (isSubmitting || reservationSuccess) ? colors.muted : colors.primary,
                  opacity: (isSubmitting || reservationSuccess) ? 0.6 : 1,
                },
              ]}
              onPress={handleConfirmBooking}
              disabled={isSubmitting || reservationSuccess}
              activeOpacity={0.9}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : reservationSuccess ? (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>Solicitud Enviada</Text>
                </>
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
  successCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
    marginBottom: 20,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
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
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeInput: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
