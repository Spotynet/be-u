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
  Modal,
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
  const [scheduleData, setScheduleData] = useState<{
    working_hours: {start: string; end: string} | null;
    booked_slots: {start: string; end: string}[];
    break_times: {start: string; end: string}[];
  } | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [dateAvailabilityError, setDateAvailabilityError] = useState<string | null>(null);
  const [timeAvailabilityError, setTimeAvailabilityError] = useState<string | null>(null);

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

  const handleDateSelect = async (date: string) => {
    const dateObj = new Date(date);
    setSelectedTime(null); // Reset time when date changes
    setTimeAvailabilityError(null);
    setDateAvailabilityError(null);
    setShowDatePicker(false);
    
    // Fetch provider schedule for selected date
    if (serviceInfo && serviceInfo.providerId > 0) {
      setLoadingSchedule(true);
      try {
        const {reservationApi, profileCustomizationApi} = await import("@/lib/api");
        const providerType = serviceInfo.serviceType === "professional_service" ? "professional" : "place";

        // Helper: convert JS getDay (0=Sun) to backend (0=Mon)
        const getBackendDayOfWeek = (d: Date) => {
          const jsDay = d.getDay(); // 0=Sun ... 6=Sat
          return (jsDay + 6) % 7;   // 0=Mon ... 6=Sun
        };

        // Helper: trim HH:MM:SS -> HH:MM
        const trimTime = (t: string) => t.slice(0, 5);

        // 1) Try public availability (same data shown in profile screen)
        let computedSchedule: {
          working_hours: {start: string; end: string} | null;
          booked_slots: {start: string; end: string}[];
          break_times: {start: string; end: string}[];
        } | null = null;

        try {
          const publicResp = await profileCustomizationApi.getPublicAvailability(
            providerType as "professional" | "place",
            serviceInfo.providerId
          );

          const schedules = publicResp.data || [];
          const targetDay = getBackendDayOfWeek(dateObj);
          const daySchedule = schedules.find(
            (s: any) =>
              s.day_of_week === targetDay &&
              s.is_available &&
              Array.isArray(s.time_slots) &&
              s.time_slots.length > 0
          );

          if (daySchedule) {
            const slots = daySchedule.time_slots;
            const firstSlot = slots[0];
            const lastSlot = slots[slots.length - 1];
            computedSchedule = {
              working_hours: {
                start: trimTime(firstSlot.start_time),
                end: trimTime(lastSlot.end_time),
              },
              booked_slots: [],
              break_times: [],
            };
          } else if (schedules.length === 0) {
            // No availability configured at all
            computedSchedule = {
              working_hours: null,
              booked_slots: [],
              break_times: [],
            };
            setDateAvailabilityError(
              "Este proveedor aún no ha configurado sus horarios de disponibilidad. Por favor contacta al proveedor directamente o intenta con otro proveedor."
            );
            setSelectedDate(null);
            setScheduleData(computedSchedule);
            return;
          }
        } catch (publicErr) {
          // Ignore and fallback to reservations endpoint
          console.warn("Fallo getPublicAvailability, probando schedule endpoint", publicErr);
        }

        // 2) Fallback to dedicated schedule endpoint (includes blocked slots)
        if (!computedSchedule) {
          const response = await reservationApi.getProviderSchedule({
            provider_type: providerType as "professional" | "place",
            provider_id: serviceInfo.providerId,
            date: date,
          });
          computedSchedule = response.data;
        }

        setScheduleData(computedSchedule);

        // Check if provider is available on this day
        if (!computedSchedule?.working_hours) {
          // Check if provider has any availability configured at all
          const hasAnyAvailability =
            (computedSchedule?.booked_slots?.length ?? 0) > 0 ||
            (computedSchedule?.break_times?.length ?? 0) > 0;

          if (!hasAnyAvailability) {
            // Provider hasn't configured their schedule yet
            setDateAvailabilityError(
              "Este proveedor aún no ha configurado sus horarios de disponibilidad. Por favor contacta al proveedor directamente o intenta con otro proveedor."
            );
          } else {
            // Provider has schedule but not available on this specific day
            setDateAvailabilityError(
              "El proveedor no está disponible en este día. Por favor selecciona otra fecha."
            );
          }
          setSelectedDate(null);
          return;
        }

        // Date is available, set it
        setSelectedDate(dateObj);
      } catch (err: any) {
        console.error("Error fetching schedule:", err);
        const errorMessage =
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "No se pudo verificar la disponibilidad. Por favor intenta de nuevo.";
        setDateAvailabilityError(errorMessage);
        setScheduleData(null);
        setSelectedDate(null);
      } finally {
        setLoadingSchedule(false);
      }
    } else {
      // If no service info, just set the date
      setSelectedDate(dateObj);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      // Android shows a native modal, so close it after selection
      setShowTimePicker(false);
      if (event.type === "set" && date) {
        // Validate availability before setting
        if (isTimeSlotAvailable(date)) {
          setSelectedTime(date);
          setTimeAvailabilityError(null);
        } else {
          setTimeAvailabilityError("Esta hora no está disponible. Por favor selecciona otra hora.");
        }
      }
    } else {
      // iOS: Update time as user scrolls (wheels mode)
      // The "Listo" button in the modal will close it
      if (event.type === "set" && date) {
        // Validate availability before setting
        if (isTimeSlotAvailable(date)) {
          setSelectedTime(date);
          setTimeAvailabilityError(null);
        } else {
          setTimeAvailabilityError("Esta hora no está disponible. Por favor selecciona otra hora.");
        }
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

  const isTimeSlotAvailable = (time: Date): boolean => {
    // If no schedule data or no working hours, time is not available
    if (!scheduleData || !scheduleData.working_hours || !serviceInfo) {
      return false;
    }

    const timeStr = formatTime(time);
    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeMinutes = hours * 60 + minutes;
    
    // Check if time is within working hours
    const [workStartHours, workStartMins] = scheduleData.working_hours.start.split(":").map(Number);
    const [workEndHours, workEndMins] = scheduleData.working_hours.end.split(":").map(Number);
    const workStartMinutes = workStartHours * 60 + workStartMins;
    const workEndMinutes = workEndHours * 60 + workEndMins;
    const endTimeMinutes = timeMinutes + serviceInfo.duration;

    if (timeMinutes < workStartMinutes || endTimeMinutes > workEndMinutes) {
      return false;
    }

    // Check if time conflicts with booked slots
    for (const slot of scheduleData.booked_slots) {
      const [slotStartHours, slotStartMins] = slot.start.split(":").map(Number);
      const [slotEndHours, slotEndMins] = slot.end.split(":").map(Number);
      const slotStartMinutes = slotStartHours * 60 + slotStartMins;
      const slotEndMinutes = slotEndHours * 60 + slotEndMins;

      // Check for overlap
      if (timeMinutes < slotEndMinutes && endTimeMinutes > slotStartMinutes) {
        return false;
      }
    }

    // Check if time conflicts with break times
    for (const breakTime of scheduleData.break_times) {
      const [breakStartHours, breakStartMins] = breakTime.start.split(":").map(Number);
      const [breakEndHours, breakEndMins] = breakTime.end.split(":").map(Number);
      const breakStartMinutes = breakStartHours * 60 + breakStartMins;
      const breakEndMinutes = breakEndHours * 60 + breakEndMins;

      // Check for overlap
      if (timeMinutes < breakEndMinutes && endTimeMinutes > breakStartMinutes) {
        return false;
      }
    }

    return true;
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

    // Final availability check before submission
    if (!isTimeSlotAvailable(selectedTime)) {
      Alert.alert(
        "Hora no disponible",
        "La hora seleccionada ya no está disponible. Por favor selecciona otra hora."
      );
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
        service_instance_type: serviceInfo.serviceType as "place_service" | "professional_service" | "custom_service",
        service_instance_id: serviceInfo.serviceInstanceId,
        date: dateStr,
        time: timeSlot.time,
        notes: localNotes,
      };

      const {reservationApi} = await import("@/lib/api");
      const response = await reservationApi.createReservation(reservationData);
      
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
        
        // Check for availability errors
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          const availabilityError = errorData.non_field_errors.find((msg: string) => 
            msg.includes("not available") || 
            msg.includes("no disponible") ||
            msg.includes("outside") ||
            msg.includes("conflicts")
          );
          if (availabilityError) {
            errorMessage = availabilityError;
            Alert.alert("Hora no disponible", errorMessage, [
              {
                text: "Seleccionar otra fecha/hora",
                onPress: () => {
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setScheduleData(null);
                }
              },
              { text: "OK" }
            ]);
            return;
          }
          
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
            {dateAvailabilityError && (
              <View style={[styles.errorCard, {backgroundColor: "#ef4444" + "20", borderColor: "#ef4444"}]}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={[styles.errorCardText, {color: "#ef4444"}]}>
                  {dateAvailabilityError}
                </Text>
              </View>
            )}
            <CalendarView
              reservations={[]}
              onDayPress={(date) => handleDateSelect(date)}
              selectedDate={undefined}
              minDate={new Date().toISOString().split("T")[0]}
            />
          </View>
        ) : !scheduleData || !scheduleData.working_hours ? (
          // Date selected but not available
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => {
                setSelectedDate(null);
                setScheduleData(null);
                setDateAvailabilityError(null);
              }} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>
                Fecha no disponible
              </Text>
              <View style={styles.placeholder} />
            </View>
            <View style={[styles.errorCard, {backgroundColor: "#ef4444" + "20", borderColor: "#ef4444"}]}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={[styles.errorCardText, {color: "#ef4444"}]}>
                El proveedor no está disponible en este día. Por favor selecciona otra fecha.
              </Text>
            </View>
          </View>
        ) : !selectedTime ? (
          // Step 2: Time Selection
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => {
                setSelectedDate(null);
                setSelectedTime(null);
                setScheduleData(null);
                setTimeAvailabilityError(null);
              }} activeOpacity={0.7}>
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
              
              {timeAvailabilityError && (
                <View style={[styles.errorCard, {backgroundColor: "#ef4444" + "20", borderColor: "#ef4444"}]}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={[styles.errorCardText, {color: "#ef4444"}]}>
                    {timeAvailabilityError}
                  </Text>
                </View>
              )}
              
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
                        const timeToCheck = new Date(date);
                        // Validate availability before setting
                        if (isTimeSlotAvailable(timeToCheck)) {
                          setSelectedTime(timeToCheck);
                          setTimeAvailabilityError(null);
                        } else {
                          setTimeAvailabilityError("Esta hora no está disponible. Por favor selecciona otra hora dentro del horario de trabajo del proveedor.");
                        }
                      } else if (formatted === "") {
                        setSelectedTime(null);
                        setTimeAvailabilityError(null);
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

                  {Platform.OS === "ios" ? (
                    <Modal
                      visible={showTimePicker}
                      transparent={true}
                      animationType="slide"
                      onRequestClose={() => setShowTimePicker(false)}>
                      <View style={styles.timePickerModalContainer}>
                        <View style={[styles.timePickerModalContent, {backgroundColor: colors.background}]}>
                          <View style={styles.timePickerModalHeader}>
                            <TouchableOpacity
                              onPress={() => setShowTimePicker(false)}
                              style={styles.timePickerModalCancel}>
                              <Text style={[styles.timePickerModalButtonText, {color: colors.primary}]}>
                                Cancelar
                              </Text>
                            </TouchableOpacity>
                            <Text style={[styles.timePickerModalTitle, {color: colors.foreground}]}>
                              Seleccionar hora
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                setShowTimePicker(false);
                              }}
                              style={styles.timePickerModalDone}>
                              <Text style={[styles.timePickerModalButtonText, {color: colors.primary}]}>
                                Listo
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={selectedTime || new Date()}
                            mode="time"
                            is24Hour={true}
                            display="spinner"
                            onChange={(event, date) => {
                              if (event.type === "set" && date) {
                                // Validate availability before setting
                                if (isTimeSlotAvailable(date)) {
                                  setTimeAvailabilityError(null);
                                  handleTimeChange(event, date);
                                } else {
                                  setTimeAvailabilityError("Esta hora no está disponible. Por favor selecciona otra hora dentro del horario de trabajo del proveedor.");
                                }
                              } else {
                                handleTimeChange(event, date);
                              }
                            }}
                            textColor={colors.foreground}
                            style={styles.iosTimePicker}
                          />
                        </View>
                      </View>
                    </Modal>
                  ) : (
                    showTimePicker && (
                      <DateTimePicker
                        value={selectedTime || new Date()}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={(event, date) => {
                          if (event.type === "set" && date) {
                            // Validate availability before setting
                            if (isTimeSlotAvailable(date)) {
                              setTimeAvailabilityError(null);
                              handleTimeChange(event, date);
                            } else {
                              setTimeAvailabilityError("Esta hora no está disponible. Por favor selecciona otra hora dentro del horario de trabajo del proveedor.");
                            }
                          } else {
                            handleTimeChange(event, date);
                          }
                        }}
                      />
                    )
                  )}
                </>
              )}

              {loadingSchedule ? (
                <View style={styles.loadingSchedule}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingScheduleText, {color: colors.mutedForeground}]}>
                    Cargando horarios disponibles...
                  </Text>
                </View>
              ) : !scheduleData || !scheduleData.working_hours ? (
                <View style={[styles.errorCard, {backgroundColor: "#ef4444" + "20", borderColor: "#ef4444"}]}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={[styles.errorCardText, {color: "#ef4444"}]}>
                    El proveedor no está disponible en este día. Por favor selecciona otra fecha.
                  </Text>
                </View>
              ) : scheduleData && scheduleData.working_hours ? (
                <View style={[styles.scheduleInfo, {backgroundColor: colors.card + "50"}]}>
                  <View style={styles.scheduleRow}>
                    <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
                    <Text style={[styles.scheduleText, {color: colors.mutedForeground}]}>
                      Horario: {scheduleData.working_hours.start} - {scheduleData.working_hours.end}
                    </Text>
                  </View>
                  {scheduleData.booked_slots.length > 0 && (
                    <View style={styles.scheduleRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.scheduleText, {color: colors.mutedForeground}]}>
                        {scheduleData.booked_slots.length} reserva(s) existente(s)
                      </Text>
                    </View>
                  )}
                  {scheduleData.break_times.length > 0 && (
                    <View style={styles.scheduleRow}>
                      <Ionicons name="cafe-outline" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.scheduleText, {color: colors.mutedForeground}]}>
                        {scheduleData.break_times.length} descanso(s) programado(s)
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

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
  timePickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  timePickerModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  timePickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  timePickerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  timePickerModalCancel: {
    padding: 8,
  },
  timePickerModalDone: {
    padding: 8,
  },
  timePickerModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  iosTimePicker: {
    width: "100%",
    height: 200,
  },
  loadingSchedule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  loadingScheduleText: {
    fontSize: 14,
  },
  scheduleInfo: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleText: {
    fontSize: 13,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  errorCardText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
