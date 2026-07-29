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
  Animated,
  useWindowDimensions,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useState, useEffect, useRef, useCallback} from "react";
import {useAuth} from "@/features/auth";
import {useReservationFlow} from "@/features/reservations";
import {CalendarView} from "@/components/calendar";
import DateTimePicker from "@react-native-community/datetimepicker";
import {useRouter, useLocalSearchParams} from "expo-router";
import {formatPrice} from "@/lib/priceUtils";
import {useCategory} from "@/contexts/CategoryContext";
import {useAppTheme} from "@/constants/theme";
import {AppHeader} from "@/components/ui/AppHeader";
import {useSafeAreaInsets} from "react-native-safe-area-context";

function TimeChip({
  label,
  selected,
  onPress,
  chipWidth,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  chipWidth: number;
  colors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, {toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 0}),
      Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12}),
    ]).start();
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={{transform: [{scale}], width: chipWidth}}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          chipStyles.chip,
          selected
            ? {backgroundColor: colors.primary, borderColor: colors.primary}
            : {backgroundColor: colors.card, borderColor: colors.border},
        ]}>
        <Text style={[chipStyles.chipText, {color: selected ? "#fff" : colors.foreground}]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default function BookingScreen() {
  const theme = useAppTheme();
  const {colors} = useThemeVariant();
  const styles = makeStyles(colors, theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {width: screenW} = useWindowDimensions();
  // 3-col grid: screen - horizontal padding (16*2) - gaps between 3 cols (8*2), divided by 3
  const chipWidth = Math.floor((screenW - 32 - 16) / 3);
  const {user, isAuthenticated, isLoading: authLoading} = useAuth();
  const {setSelectedServiceCategory} = useCategory();
  const params = useLocalSearchParams<{
    serviceInstanceId?: string;
    serviceTypeId?: string;
    serviceName?: string;
    serviceType?: string;
    providerId?: string;
    providerName?: string;
    price?: string;
    duration?: string;
    category?: string;
    groupSessionId?: string;
  }>();

  const {state, isLoading, selectService, setNotes, createReservation} =
    useReservationFlow();

  const [localNotes, setLocalNotes] = useState("");
  const [notesFocused, setNotesFocused] = useState(false);
  const UNAVAILABLE_MSG =
    "El/La profesional no esta disponible en la fecha seleccionada. Seleccione otro día.";

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
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
  const [groupSessionsForDate, setGroupSessionsForDate] = useState<any[]>([]);
  const [selectedGroupSessionId, setSelectedGroupSessionId] = useState<number | null>(null);
  const [groupSessionInfo, setGroupSessionInfo] = useState<{
    serviceInfo: {
      serviceInstanceId: number;
      serviceTypeId: number;
      serviceName: string;
      serviceType: string;
      providerId: number;
      providerName: string;
      price: number;
      duration: number;
    };
  } | null>(null);

  // Service info from params - all data comes directly from navigation (or from fetched group session)
  const parsedServiceInstanceId = params.serviceInstanceId ? parseInt(params.serviceInstanceId) : 0;
  const parsedServiceTypeId = params.serviceTypeId ? parseInt(params.serviceTypeId) : 0;
  
  const hasRequiredParams = parsedServiceInstanceId > 0 && parsedServiceTypeId > 0;

  const serviceInfo = groupSessionInfo?.serviceInfo ?? (hasRequiredParams
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
    : null);

  // When groupSessionId is in params, fetch the session and initialize state
  useEffect(() => {
    const gsId = params.groupSessionId ? parseInt(params.groupSessionId) : 0;
    if (gsId <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const {groupSessionApi} = await import("@/lib/api");
        const res = await groupSessionApi.get(gsId);
        const s = res.data;
        if (cancelled || !s) return;
        const providerType = s.provider_type === "place" ? "place" : "professional";
        const providerId = s.provider_object_id ?? 0;
        const svcInstanceId = s.service_instance_id ?? s.service ?? 0;
        const svcTypeId = s.service ?? 0;
        const durationMinutes = s.duration
          ? (typeof s.duration === "string"
              ? (() => {
                  const parts = String(s.duration).split(":");
                  const h = parseInt(parts[0] || "0", 10);
                  const m = parseInt(parts[1] || "0", 10);
                  return h * 60 + m;
                })()
              : Number(s.duration))
          : 60;
        if (cancelled) return;
        setGroupSessionInfo({
          serviceInfo: {
            serviceInstanceId: svcInstanceId,
            serviceTypeId: svcTypeId,
            serviceName: s.service_name ?? "Sesión grupal",
            serviceType: providerType === "place" ? "place_service" : "professional_service",
            providerId,
            providerName: s.provider_name ?? "Proveedor",
            price: 0,
            duration: durationMinutes,
          },
        });
        setResolvedProviderId(providerId);
        setSelectedGroupSessionId(gsId);
        const dateStr = s.date;
        if (dateStr) {
          const d = new Date(dateStr + "T12:00:00");
          setSelectedDate(d);
        }
        const timeStr = String(s.time ?? "").slice(0, 5);
        if (timeStr) {
          const [h, m] = timeStr.split(":").map(Number);
          const timeDate = new Date();
          timeDate.setHours(h || 0, m || 0, 0, 0);
          setSelectedTime(timeDate);
        }
        selectService({
          serviceInstanceId: svcInstanceId,
          serviceTypeId: svcTypeId,
          serviceName: s.service_name ?? "Sesión grupal",
          serviceType: providerType === "place" ? "place_service" : "professional_service",
          providerId,
          providerName: s.provider_name ?? "Proveedor",
          price: 0,
          duration: durationMinutes,
        });
      } catch (err) {
        if (!cancelled) console.error("Failed to load group session:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [params.groupSessionId]);

  const providerTypeForAvailability: "professional" | "place" =
    serviceInfo?.serviceType === "professional_service" ? "professional" : "place";
  useEffect(() => {
    const incomingCategory = String(params.category || "").toLowerCase().trim();
    if (incomingCategory === "belleza" || incomingCategory === "bienestar" || incomingCategory === "mascotas") {
      setSelectedServiceCategory(incomingCategory);
    }
  }, [params.category, setSelectedServiceCategory]);

  const providerIdForAvailability = resolvedProviderId ?? serviceInfo?.providerId ?? 0;

  // Redirect guests to login — wait for auth to finish loading first
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user]);

  // Initialize the service in the hook when component mounts
  useEffect(() => {
    if (serviceInfo && !state.service) {
      selectService(serviceInfo);
    }
  }, [serviceInfo?.serviceInstanceId]);

  // Auto-select today on first load and prefetch times for today (once provider is resolved).
  useEffect(() => {
    if (!serviceInfo || providerIdForAvailability <= 0) return;
    if (!selectedDate) return;
    // If schedule already loaded for the current selected date, do nothing.
    if (scheduleData) return;

    handleDateSelect(formatLocalDate(selectedDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceInfo?.serviceInstanceId, providerIdForAvailability]);

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
          setDateAvailabilityError(UNAVAILABLE_MSG);
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

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: currentStep === 1 ? 0.5 : 1,
      useNativeDriver: false,
      friction: 10,
      tension: 60,
    }).start();
  }, [currentStep]);

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

  const isSelectedDateToday = (dateStr: string): boolean => {
    return dateStr === formatLocalDate(new Date());
  };

  const getCurrentTimeMinutes = (): number => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const filterPastTimesForToday = (times: string[], dateStr: string): string[] => {
    if (!isSelectedDateToday(dateStr)) return times;
    // Use UTC minutes to match the server's timezone (Django USE_TZ=True, TIME_ZONE='UTC').
    // Add a 5-minute buffer so a slot that is borderline doesn't pass client validation
    // but then fail the server's check due to network latency.
    const now = new Date();
    const nowUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + 5;
    return times.filter((t) => {
      const [h, m] = t.split(":").map(Number);
      const slotMinutes = h * 60 + m;
      return slotMinutes > nowUtcMinutes;
    });
  };

  const handleDateSelect = async (date: string) => {
    const dateObj = parseLocalDate(date);
    setSelectedDate(dateObj); // Keep the date selected even if unavailable
    setSelectedTime(null); // Reset time when date changes
    setTimeAvailabilityError(null);
    setDateAvailabilityError(null);
    setAvailableTimes([]);
    setSelectedGroupSessionId(null);
    setGroupSessionsForDate([]);
    setShowDatePicker(false);
    
    // Fetch provider schedule for selected date
    if (serviceInfo && providerIdForAvailability > 0) {
      setLoadingSchedule(true);
      try {
        const {reservationApi, profileCustomizationApi, serviceApi} = await import("@/lib/api");
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
            setDateAvailabilityError(UNAVAILABLE_MSG);
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

        // 3) Use server-provided available slots (includes Google Calendar busy times)
        try {
          const slotsResponse = await serviceApi.getAvailableSlots({
            service_id: serviceInfo.serviceInstanceId,
            date,
            service_type: providerType as "professional" | "place",
          });
          const slots = slotsResponse.data?.slots || [];
          const available = slots
            .filter((s: any) => s.available)
            .map((s: any) => s.time)
            .filter((t: string) => typeof t === "string");
          const filtered = filterPastTimesForToday(available, date);

          setAvailableTimes(filtered);

          if (filtered.length === 0) {
            setDateAvailabilityError(UNAVAILABLE_MSG);
          }
        } catch (slotsErr) {
          // Fallback to local computation if slots endpoint fails
          if (computedSchedule && serviceInfo?.duration) {
            const localTimes = computeAvailableTimes(computedSchedule, serviceInfo.duration);
            setAvailableTimes(filterPastTimesForToday(localTimes, date));
          } else {
            setAvailableTimes([]);
          }
        }

        try {
          const {groupSessionApi} = await import("@/lib/api");
          const groupSessionsResponse = await groupSessionApi.list({
            provider_type: providerType as "professional" | "place",
            provider_id: providerIdForAvailability,
            service: serviceInfo.serviceTypeId,
            date_from: date,
          });
          const sessions = (groupSessionsResponse.data?.results || []).filter(
            (session: any) => session.date === date && session.remaining_slots > 0
          );
          setGroupSessionsForDate(sessions);
        } catch {
          setGroupSessionsForDate([]);
        }

        // Check if provider is available on this day
        if (!computedSchedule?.working_hours) {
          setDateAvailabilityError(UNAVAILABLE_MSG);
          return;
        }

        // Date is available, keep it
        setSelectedDate(dateObj);
      } catch (err: any) {
        console.error("Error fetching schedule:", err);
        setDateAvailabilityError(UNAVAILABLE_MSG);
        setScheduleData(null);
        setAvailableTimes([]);
        setDisabledDaysIndexes(undefined);
        // Keep date selected for UI consistency
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
          setTimeAvailabilityError(UNAVAILABLE_MSG);
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
          setTimeAvailabilityError(UNAVAILABLE_MSG);
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
    const timeStr = formatTime(time);

    // If server-provided slots exist, use them as source of truth
    if (availableTimes.length > 0) {
      return availableTimes.includes(timeStr);
    }

    // Fallback to schedule-based checks
    if (!scheduleData || !scheduleData.working_hours || !serviceInfo) {
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
    if (!selectedGroupSessionId && !isTimeSlotAvailable(selectedTime)) {
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
      const {reservationApi} = await import("@/lib/api");
      const {groupSessionApi} = await import("@/lib/api");
      let response: any;

      if (selectedGroupSessionId) {
        response = await groupSessionApi.reserve(selectedGroupSessionId, localNotes);
      } else {
        const reservationData = {
          service_instance_type: serviceInfo.serviceType as
            | "place_service"
            | "professional_service"
            | "custom_service",
          service_instance_id: serviceInfo.serviceInstanceId,
          // Provide provider context so backend can resolve IDs consistently with availability endpoints
          provider_type: providerTypeForAvailability,
          provider_id: providerIdForAvailability,
          date: dateStr,
          time: timeSlot.time,
          notes: localNotes,
        };
        console.log("Sending reservation data:", reservationData);
        response = await reservationApi.createReservation(reservationData);
      }
      
      console.log("Reservation created successfully:", response.data);
      
      // Set success state for visual feedback
      setReservationSuccess(true);
      
      // Auto-redirect to reservation details page after showing success message
      const reservationId = response?.data?.id || response?.data?.reservation?.id;
      setTimeout(() => {
        if (reservationId) {
          router.push(`/reservation/${reservationId}` as any);
        } else {
          router.push("/(tabs)/perfil");
        }
      }, 2000);
    } catch (err: any) {
      console.error("Error creating reservation:", err);
      console.error("Error response:", err?.response);
      console.error("Error response data:", err?.response?.data);
      console.error("Error message:", err?.message);
      console.error("Full error:", JSON.stringify(err, null, 2));
      
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

  if (authLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}>
      <AppHeader
        title="Nueva Reserva"
        showBackButton
        backFallbackRoute="/(tabs)/explore"
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />

      {/* Context strip — always visible, never scrolls away */}
      <View style={[styles.contextStrip, {borderBottomColor: colors.border}]}>
        <View style={styles.contextLeft}>
          <Text style={[styles.contextServiceName, {color: colors.foreground}]} numberOfLines={1}>
            {serviceInfo.serviceName}
          </Text>
          <Text style={[styles.contextProvider, {color: colors.mutedForeground}]} numberOfLines={1}>
            {serviceInfo.providerName}
          </Text>
        </View>
        <View style={styles.contextRight}>
          <View style={[styles.durationPill, {backgroundColor: colors.muted}]}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.durationText, {color: colors.mutedForeground}]}>{serviceInfo.duration} min</Text>
          </View>
          <Text style={[styles.priceText, {color: colors.primary}]}>{formatPrice(serviceInfo.price)}</Text>
        </View>
      </View>

      {/* Step progress */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, {backgroundColor: colors.border}]}>
          <Animated.View style={[styles.progressFill, {backgroundColor: colors.primary, width: progressWidth}]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, {color: currentStep === 1 ? colors.primary : colors.mutedForeground}]}>
            {currentStep > 1 ? "✓ " : ""}Fecha y hora
          </Text>
          <Text style={[styles.progressLabel, {color: currentStep === 2 ? colors.primary : colors.mutedForeground}]}>
            Confirmar
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Step 1: Date + Time ── */}
        {!selectedTime ? (
          <View style={styles.stepContent}>

            {/* Date availability error */}
            {dateAvailabilityError && (
              <View style={[styles.inlineBanner, {backgroundColor: "#ef444414"}]}>
                <Ionicons name="alert-circle" size={15} color="#ef4444" />
                <Text style={[styles.inlineBannerText, {color: "#ef4444"}]}>{dateAvailabilityError}</Text>
              </View>
            )}

            {/* Calendar — no wrapper, full bleed */}
            <CalendarView
              reservations={[]}
              onDayPress={(date) => handleDateSelect(date)}
              selectedDate={selectedDate ? formatLocalDate(selectedDate) : undefined}
              minDate={formatLocalDate(new Date())}
              disabledDaysIndexes={disabledDaysIndexes}
              showLegend={false}
            />

            {/* Date anchor + time grid — appears after a date is tapped */}
            {selectedDate && (
              <View style={styles.timeSection}>

                {/* Large date headline */}
                <View style={styles.dateHeadlineRow}>
                  <View>
                    <Text style={[styles.dateHeadline, {color: colors.foreground}]}>
                      {selectedDate.toLocaleDateString("es-MX", {weekday: "long", day: "numeric", month: "long"})}
                    </Text>
                    {scheduleData?.working_hours && (
                      <Text style={[styles.dateSubline, {color: colors.mutedForeground}]}>
                        Horario {scheduleData.working_hours.start} – {scheduleData.working_hours.end}
                      </Text>
                    )}
                  </View>
                  {availableTimes.length > 0 && (
                    <View style={[styles.slotCountBadge, {backgroundColor: colors.primary + "18"}]}>
                      <Text style={[styles.slotCountText, {color: colors.primary}]}>{availableTimes.length}</Text>
                    </View>
                  )}
                </View>

                {/* Time availability error */}
                {timeAvailabilityError && (
                  <View style={[styles.inlineBanner, {backgroundColor: "#ef444414"}]}>
                    <Ionicons name="alert-circle" size={15} color="#ef4444" />
                    <Text style={[styles.inlineBannerText, {color: "#ef4444"}]}>{timeAvailabilityError}</Text>
                  </View>
                )}

                {loadingSchedule ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingScheduleText, {color: colors.mutedForeground}]}>Buscando disponibilidad...</Text>
                  </View>
                ) : scheduleData?.working_hours ? (
                  <>
                    {availableTimes.length === 0 ? (
                      <View style={[styles.emptyTimesBox, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                        <Ionicons name="calendar-outline" size={22} color={colors.mutedForeground} />
                        <Text style={[styles.emptyTimesText, {color: colors.mutedForeground}]}>
                          Sin disponibilidad para este día
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.timeGrid}>
                        {availableTimes.map((t) => {
                          const isSelected = !!(selectedTime && formatTime(selectedTime) === t);
                          return (
                            <TimeChip
                              key={t}
                              label={t}
                              selected={isSelected}
                              chipWidth={chipWidth}
                              colors={colors}
                              onPress={() => {
                                const [h, m] = t.split(":").map(Number);
                                const d = new Date(selectedDate);
                                d.setHours(h, m, 0, 0);
                                if (isTimeSlotAvailable(d)) {
                                  setSelectedTime(d);
                                  setTimeAvailabilityError(null);
                                } else {
                                  setTimeAvailabilityError(UNAVAILABLE_MSG);
                                }
                              }}
                            />
                          );
                        })}
                      </View>
                    )}

                    {scheduleData.break_times.length > 0 && (
                      <View style={styles.breakRow}>
                        <Ionicons name="cafe-outline" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.breakLabel, {color: colors.mutedForeground}]}>
                          Pausas: {scheduleData.break_times.map(b => `${b.start}–${b.end}`).join(" · ")}
                        </Text>
                      </View>
                    )}
                  </>
                ) : null}

                {/* Group sessions */}
                {groupSessionsForDate.length > 0 && (
                  <View style={styles.groupSection}>
                    <View style={[styles.divider, {backgroundColor: colors.border}]} />
                    <Text style={[styles.groupLabel, {color: colors.mutedForeground}]}>Sesiones grupales disponibles</Text>
                    <View style={styles.timeGrid}>
                      {groupSessionsForDate.map((session: any) => {
                        const sel = selectedGroupSessionId === session.id;
                        return (
                          <TimeChip
                            key={session.id}
                            label={`${String(session.time).slice(0, 5)}  ·  ${session.booked_slots ?? 0}/${session.capacity}`}
                            selected={sel}
                            chipWidth={chipWidth}
                            colors={colors}
                            onPress={() => {
                              setSelectedGroupSessionId(session.id);
                              const [h, m] = String(session.time).slice(0, 5).split(":").map(Number);
                              const d = new Date(selectedDate);
                              d.setHours(h, m, 0, 0);
                              setSelectedTime(d);
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

        ) : (
          /* ── Step 2: Confirmation ── */
          <View style={styles.stepContent}>

            {/* Back link */}
            <TouchableOpacity style={styles.backLink} onPress={() => setSelectedTime(null)} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
              <Text style={[styles.backLinkText, {color: colors.primary}]}>Cambiar fecha u hora</Text>
            </TouchableOpacity>

            {/* Booking summary rows */}
            <Text style={[styles.confirmTitle, {color: colors.foreground}]}>Tu reserva</Text>

            <View style={[styles.summaryRows, {borderColor: colors.border}]}>
              {[
                {icon: "cut-outline" as const,      label: "Servicio", value: serviceInfo.serviceName,  accent: false},
                {icon: "person-outline" as const,   label: "Con",      value: serviceInfo.providerName, accent: false},
                {icon: "calendar-outline" as const, label: "Fecha",    value: selectedDate?.toLocaleDateString("es-MX", {weekday: "long", day: "numeric", month: "long", year: "numeric"}) ?? "", accent: false},
                {icon: "time-outline" as const,     label: "Hora",     value: selectedTime ? `${formatTime(selectedTime)} – ${formatTime(getEndTime(selectedTime, serviceInfo.duration))}` : "", accent: false},
                {icon: "cash-outline" as const,     label: "Total",    value: formatPrice(serviceInfo.price), accent: true},
              ].map((row, i, arr) => (
                <View
                  key={row.label}
                  style={[
                    styles.summaryRow,
                    i < arr.length - 1 && {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
                  ]}>
                  <View style={[styles.summaryIcon, {backgroundColor: row.accent ? colors.primary + "22" : colors.primary + "16"}]}>
                    <Ionicons name={row.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={styles.summaryRowText}>
                    <Text style={[styles.summaryRowLabel, {color: colors.mutedForeground}]}>{row.label}</Text>
                    <Text style={[styles.summaryRowValue, {color: row.accent ? colors.primary : colors.foreground, fontSize: row.accent ? 17 : 15}]}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={[styles.notesLabel, {color: colors.mutedForeground}]}>Nota para el proveedor</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: notesFocused ? colors.primary : colors.border,
                  },
                ]}
                value={localNotes}
                onChangeText={setLocalNotes}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                placeholder="Opcional: alergias, preferencias, indicaciones..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Success banner */}
            {reservationSuccess && (
              <View style={[styles.successBanner, {backgroundColor: "#10b98118", borderColor: "#10b981"}]}>
                <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                <View style={{flex: 1}}>
                  <Text style={[styles.successTitle, {color: "#10b981"}]}>¡Reserva confirmada!</Text>
                  <Text style={[styles.successText, {color: colors.mutedForeground}]}>
                    Recibirás un recordatorio antes de tu cita.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky confirm CTA — only shown on Step 2, always visible above keyboard / home indicator */}
      {!!selectedTime && (
        <View
          style={[
            styles.stickyFooter,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              {backgroundColor: (isSubmitting || reservationSuccess) ? colors.primary + "70" : colors.primary},
            ]}
            onPress={handleConfirmBooking}
            disabled={isSubmitting || reservationSuccess}
            activeOpacity={0.88}>
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : reservationSuccess ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.confirmButtonText}>Reserva confirmada</Text>
              </>
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar reserva</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: any, theme: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Context strip */
  contextStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  contextLeft: {
    flex: 1,
    gap: 2,
  },
  contextServiceName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  contextProvider: {
    fontSize: 13,
    fontWeight: "500",
  },
  contextRight: {
    alignItems: "flex-end",
    gap: 5,
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  /* Progress */
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 6,
  },
  progressTrack: {
    height: 3,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  stepContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 0,
  },
  /* Step 1 — calendar + time */
  inlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 8,
  },
  inlineBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  timeSection: {
    marginTop: 20,
    gap: 14,
  },
  dateHeadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dateHeadline: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    textTransform: "capitalize",
  },
  dateSubline: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  slotCountBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  slotCountText: {
    fontSize: 15,
    fontWeight: "800",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingScheduleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyTimesBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTimesText: {
    fontSize: 14,
    fontWeight: "500",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  breakLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  groupSection: {
    gap: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  /* Step 2 — confirmation */
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
    alignSelf: "flex-start",
    minHeight: 44,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  summaryRows: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  summaryRowText: {
    flex: 1,
    gap: 2,
  },
  summaryRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryRowValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  notesSection: {
    gap: 8,
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  notesInput: {
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
    minHeight: 90,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  successText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  /* Shared / misc */
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

  /* Kept for legacy refs that might exist elsewhere */
  section: {gap: 12, paddingVertical: 20},
  sectionLabelRow: {flexDirection: "row", alignItems: "baseline", justifyContent: "space-between"},
  sectionLabel: {fontSize: 11, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase"},
  sectionValue: {fontSize: 13, fontWeight: "600"},
  sectionMeta: {fontSize: 12, fontWeight: "500"},
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
  calendarContainer: {
    marginHorizontal: -2,
    paddingRight: 2,
  },
  });
}
