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
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [dateAvailabilityError, setDateAvailabilityError] = useState<string | null>(null);
  const [timeAvailabilityError, setTimeAvailabilityError] = useState<string | null>(null);
  const [disabledDaysIndexes, setDisabledDaysIndexes] = useState<number[] | undefined>(undefined);
  const [resolvedProviderId, setResolvedProviderId] = useState<number | null>(null);

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

  const providerTypeForAvailability =
    serviceInfo?.serviceType === "professional_service" ? "professional" : "place";
  const providerIdForAvailability = resolvedProviderId ?? serviceInfo?.providerId ?? 0;

  // Initialize the service in the hook when component mounts
  useEffect(() => {
    if (serviceInfo && !state.service) {
      selectService(serviceInfo);
    }
  }, [serviceInfo?.serviceInstanceId]);

  // Resolve the provider profile ID from the service instance (source of truth).
  // This avoids mismatches where the URL param providerId is a User/PublicProfile id.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!serviceInfo?.serviceInstanceId) {
        setResolvedProviderId(null);
        return;
      }
      try {
        const {serviceApi} = await import("@/lib/api");
        if (serviceInfo.serviceType === "professional_service") {
          const resp = await serviceApi.getProfessionalService(serviceInfo.serviceInstanceId);
          const professionalId = resp.data?.professional;
          if (!cancelled) setResolvedProviderId(Number.isFinite(professionalId) ? professionalId : null);
        } else if (serviceInfo.serviceType === "place_service") {
          const resp = await serviceApi.getPlaceService(serviceInfo.serviceInstanceId);
          const placeId = resp.data?.place;
          if (!cancelled) setResolvedProviderId(Number.isFinite(placeId) ? placeId : null);
        } else {
          if (!cancelled) setResolvedProviderId(null);
        }
      } catch {
        if (!cancelled) setResolvedProviderId(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [serviceInfo?.serviceInstanceId, serviceInfo?.serviceType]);

  // Preload weekly availability to disable non-working weekdays in Step 1
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!serviceInfo || providerIdForAvailability <= 0) {
        setDisabledDaysIndexes(undefined);
        return;
      }

      try {
        const {profileCustomizationApi} = await import("@/lib/api");
        const providerType = providerTypeForAvailability;

        const publicResp = await profileCustomizationApi.getPublicAvailability(
          providerType as "professional" | "place",
          providerIdForAvailability
        );

        if (cancelled) return;

        const schedules = publicResp.data || [];
        if (!Array.isArray(schedules) || schedules.length === 0) {
          // No availability configured -> disable all weekdays to prevent clicks
          setDisabledDaysIndexes([0, 1, 2, 3, 4, 5, 6]);
          setDateAvailabilityError(
            "Este proveedor aún no ha configurado sus horarios de disponibilidad. Por favor contacta al proveedor directamente o intenta con otro proveedor."
          );
          return;
        }

        setDateAvailabilityError(null);

        const availableDays = new Set<number>();
        schedules.forEach((s: any) => {
          if (s.is_available && Array.isArray(s.time_slots) && s.time_slots.length > 0) {
            // backend 0=Mon, RN Calendar 0=Sun -> shift +1 mod 7
            const rnIndex = (s.day_of_week + 1) % 7;
            availableDays.add(rnIndex);
          }
        });

        const disabled = [0, 1, 2, 3, 4, 5, 6].filter((d) => !availableDays.has(d));
        // If nothing is available, also disable all weekdays
        setDisabledDaysIndexes(
          availableDays.size === 0 ? [0, 1, 2, 3, 4, 5, 6] : disabled.length === 7 ? undefined : disabled
        );
      } catch (e) {
        if (cancelled) return;
        // If we can't preload availability, don't block the user
        setDisabledDaysIndexes(undefined);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [serviceInfo?.serviceType, providerIdForAvailability]);

  // Derive current step for the visual indicator
  const currentStep = !selectedTime ? 1 : 2;

  // Color helpers for step indicator
  const getStepColors = (step: number) => {
    if (step === currentStep) {
      return {
        bg: colors.primary,
        text: "#ffffff",
        label: colors.primary,
      };
    }
    if (step < currentStep) {
      return {
        bg: colors.primary + "33", // low opacity for completed
        text: colors.primary,
        label: colors.primary,
      };
    }
    return {
      bg: colors.muted,
      text: colors.mutedForeground,
      label: colors.mutedForeground,
    };
  };

  // Compute available time slots (15m increments) that fit duration and avoid conflicts
  const computeAvailableTimes = (
    schedule: NonNullable<typeof scheduleData>,
    durationMinutes: number
  ): string[] => {
    if (!schedule.working_hours) return [];

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };

    const workStart = toMinutes(schedule.working_hours.start);
    const workEnd = toMinutes(schedule.working_hours.end);

    const overlaps = (start: number, end: number, a: number, b: number) => start < b && end > a;

    const isFree = (start: number) => {
      const end = start + durationMinutes;
      if (start < workStart || end > workEnd) return false;

      for (const slot of schedule.booked_slots) {
        const [sh, sm] = slot.start.split(":").map(Number);
        const [eh, em] = slot.end.split(":").map(Number);
        if (overlaps(start, end, sh * 60 + sm, eh * 60 + em)) return false;
      }

      for (const br of schedule.break_times) {
        const [bh, bm] = br.start.split(":").map(Number);
        const [eh, em] = br.end.split(":").map(Number);
        if (overlaps(start, end, bh * 60 + bm, eh * 60 + em)) return false;
      }

      return true;
    };

    const result: string[] = [];
    for (let t = workStart; t + durationMinutes <= workEnd; t += 15) {
      if (isFree(t)) {
        const hh = Math.floor(t / 60)
          .toString()
          .padStart(2, "0");
        const mm = (t % 60).toString().padStart(2, "0");
        result.push(`${hh}:${mm}`);
      }
    }
    return result;
  };

  // Parse YYYY-MM-DD as a *local* date (avoids timezone shifting to previous day)
  const parseLocalDate = (ymd: string): Date => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleDateSelect = async (date: string) => {
    const dateObj = parseLocalDate(date);
    setSelectedTime(null); // Reset time when date changes
    setTimeAvailabilityError(null);
    setDateAvailabilityError(null);
    setAvailableTimes([]);
    setShowDatePicker(false);
    
    // Fetch provider schedule for selected date
    if (serviceInfo && providerIdForAvailability > 0) {
      setLoadingSchedule(true);
      try {
        const {reservationApi, profileCustomizationApi} = await import("@/lib/api");
        const providerType = providerTypeForAvailability;

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
        let hasPublicWorkingHours = false;

        try {
          const publicResp = await profileCustomizationApi.getPublicAvailability(
            providerType as "professional" | "place",
            providerIdForAvailability
          );

          const schedules = publicResp.data || [];
          // Compute disabled weekdays from availability (backend 0=Mon -> RN 0=Sun)
          if (schedules.length > 0) {
            const availableDays = new Set<number>();
            schedules.forEach((s: any) => {
              if (s.is_available && Array.isArray(s.time_slots) && s.time_slots.length > 0) {
                const rnIndex = (s.day_of_week + 1) % 7;
                availableDays.add(rnIndex);
              }
            });
            const disabled = [0, 1, 2, 3, 4, 5, 6].filter((d) => !availableDays.has(d));
            setDisabledDaysIndexes(availableDays.size === 0 ? [0, 1, 2, 3, 4, 5, 6] : disabled);
          } else {
            setDisabledDaysIndexes(undefined);
          }
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
            hasPublicWorkingHours = true;
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
            // Disable all weekdays in calendar to avoid clicks
            setDisabledDaysIndexes([0, 1, 2, 3, 4, 5, 6]);
            return;
          }
        } catch (publicErr) {
          // Ignore and fallback to reservations endpoint
          console.warn("Fallo getPublicAvailability, probando schedule endpoint", publicErr);
        }

        // 2) Always fetch per-date schedule to get breaks and booked slots (source of truth)
        try {
          const response = await reservationApi.getProviderSchedule({
            provider_type: providerType as "professional" | "place",
            provider_id: providerIdForAvailability,
            date: date,
          });
          const scheduleFromApi = response.data;

          // Merge with public working hours if needed (public availability can exist even if schedule endpoint has null hours)
          if (computedSchedule?.working_hours && hasPublicWorkingHours) {
            computedSchedule = {
              working_hours: computedSchedule.working_hours,
              booked_slots: scheduleFromApi?.booked_slots || [],
              break_times: scheduleFromApi?.break_times || [],
            };
          } else {
            computedSchedule = scheduleFromApi;
          }
        } catch (e) {
          // If schedule endpoint fails, keep what we have from public availability
          if (!computedSchedule) {
            computedSchedule = {working_hours: null, booked_slots: [], break_times: []};
          }
        }

        setScheduleData(computedSchedule);
        setAvailableTimes(
          computeAvailableTimes(computedSchedule, serviceInfo.duration)
        );

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
        setAvailableTimes([]);
        setDisabledDaysIndexes(undefined);
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

    // Require membership in precomputed availability when present
    if (availableTimes.length > 0 && !availableTimes.includes(timeStr)) {
      return false;
    }

    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeMinutes = hours * 60 + minutes;
    
    // Check if time is within working hours and fits duration
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
      const dateStr = formatLocalDate(selectedDate);
      
      // Create reservation with simplified data structure
      const reservationData = {
        service_instance_type: serviceInfo.serviceType as "place_service" | "professional_service" | "custom_service",
        service_instance_id: serviceInfo.serviceInstanceId,
        // Provide provider context so backend can resolve IDs consistently with availability endpoints
        provider_type: providerTypeForAvailability,
        provider_id: providerIdForAvailability,
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
                backgroundColor: getStepColors(1).bg,
              },
            ]}>
            <Text
              style={[
                styles.stepNumberText,
                {color: getStepColors(1).text},
              ]}>
              1
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              {color: getStepColors(1).label},
            ]}>
            Fecha y hora
          </Text>
        </View>

        <View style={[styles.stepDivider, {backgroundColor: colors.border}]} />

        <View style={styles.step}>
          <View
            style={[
              styles.stepNumber,
              {
                backgroundColor: getStepColors(2).bg,
              },
            ]}>
            <Text
              style={[
                styles.stepNumberText,
                {color: getStepColors(2).text},
              ]}>
              2
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              {color: getStepColors(2).label},
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
        {/* Step 1: Date + Time */}
        {!selectedTime ? (
          <View style={styles.stepContent}>
            {dateAvailabilityError && (
              <View style={[styles.errorCard, {backgroundColor: "#ef4444" + "20", borderColor: "#ef4444"}]}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={[styles.errorCardText, {color: "#ef4444"}]}>{dateAvailabilityError}</Text>
              </View>
            )}

            <CalendarView
              reservations={[]}
              onDayPress={(date) => handleDateSelect(date)}
              selectedDate={selectedDate ? formatLocalDate(selectedDate) : undefined}
              minDate={formatLocalDate(new Date())}
              disabledDaysIndexes={disabledDaysIndexes}
              showLegend={false}
            />

            {selectedDate && (
              <View style={styles.timePickerContainer}>
                {timeAvailabilityError && (
                  <View style={[styles.errorCard, {backgroundColor: "#ef4444" + "20", borderColor: "#ef4444"}]}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={[styles.errorCardText, {color: "#ef4444"}]}>{timeAvailabilityError}</Text>
                  </View>
                )}

                {loadingSchedule ? (
                  <View style={styles.loadingSchedule}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingScheduleText, {color: colors.mutedForeground}]}>
                      Cargando horarios disponibles...
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
                    {scheduleData.break_times.length > 0 && (
                      <View style={styles.breaksContainer}>
                        <View style={styles.scheduleRow}>
                          <Ionicons name="cafe-outline" size={16} color={colors.mutedForeground} />
                          <Text style={[styles.scheduleText, {color: colors.mutedForeground}]}>
                            Descansos
                          </Text>
                        </View>
                        <View style={styles.breakChips}>
                          {scheduleData.break_times.map((br, idx) => (
                            <View
                              key={`${br.start}-${br.end}-${idx}`}
                              style={[
                                styles.breakChip,
                                {
                                  backgroundColor: colors.card,
                                  borderColor: colors.border,
                                },
                              ]}>
                              <Text style={[styles.breakChipText, {color: colors.mutedForeground}]}>
                                {br.start} - {br.end}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ) : null}

                {scheduleData?.working_hours && (
                  <View style={styles.availableTimesContainer}>
                    <Text style={[styles.availableTimesTitle, {color: colors.foreground}]}>
                      Horarios disponibles
                    </Text>
                    {availableTimes.length === 0 ? (
                      <Text style={[styles.availableTimesEmpty, {color: colors.mutedForeground}]}>
                        No hay horarios que cumplan con la duración y disponibilidad.
                      </Text>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.availableTimesRow}>
                        {availableTimes.map((t) => {
                          const isSelected = selectedTime && formatTime(selectedTime) === t;
                          return (
                            <TouchableOpacity
                              key={t}
                              style={[
                                styles.availableTimeChip,
                                {
                                  backgroundColor: isSelected ? colors.primary : colors.card,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                              onPress={() => {
                                const [h, m] = t.split(":").map(Number);
                                const d = new Date(selectedDate || new Date());
                                d.setHours(h, m, 0, 0);
                                if (isTimeSlotAvailable(d)) {
                                  setSelectedTime(d);
                                  setTimeAvailabilityError(null);
                                } else {
                                  setTimeAvailabilityError(
                                    "Esta hora no está disponible. Por favor selecciona otra hora."
                                  );
                                }
                              }}
                              activeOpacity={0.8}>
                              <Text
                                style={[
                                  styles.availableTimeText,
                                  {color: isSelected ? "#ffffff" : colors.foreground},
                                ]}>
                                {t}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          // Step 2: Confirmation
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
  availableTimesContainer: {
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  availableTimesTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  availableTimesEmpty: {
    fontSize: 13,
    fontWeight: "500",
  },
  availableTimesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  availableTimesRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  availableTimeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  availableTimeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breaksContainer: {
    marginTop: 4,
    gap: 6,
  },
  breakChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  breakChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  breakChipText: {
    fontSize: 13,
    fontWeight: "600",
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
