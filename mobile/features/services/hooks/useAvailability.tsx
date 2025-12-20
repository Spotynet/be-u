import {useState, useCallback} from "react";
import {availabilityApi, serviceApi, errorUtils, profileCustomizationApi} from "@/lib/api";
import {
  ProviderAvailability,
  TimeSlotBlock,
  AvailableSlotsResponse,
  WeeklySchedule,
  ProviderType,
} from "@/types/global";
import {Alert} from "react-native";

export const useAvailability = (providerId?: number, providerType?: ProviderType) => {
  const [availability, setAvailability] = useState<ProviderAvailability[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeSlotBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!providerId || !providerType) return;

    try {
      setIsLoading(true);
      setError(null);
      // Use the correct endpoint: /profile/availability/
      const response = await profileCustomizationApi.getAvailabilitySchedule();
      // Backend returns array of schedules with time_slots
      const schedules = response.data || [];
      setAvailability(schedules);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [providerId, providerType]);

  const fetchTimeBlocks = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await availabilityApi.getTimeBlocks({
        start_date: startDate,
        end_date: endDate,
      });
      setTimeBlocks(response.data.results || []);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAvailability = async (schedule: WeeklySchedule) => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert schedule to API format expected by backend
      // Backend expects: day_of_week, is_available, time_slots (array with start_time and end_time), breaks (array with start_time, end_time, label)
      const schedules = Object.entries(schedule).map(([day, daySchedule]) => ({
        day_of_week: parseInt(day),
        is_available: daySchedule.enabled,
        time_slots: daySchedule.enabled
          ? [
              {
                start_time: daySchedule.start_time,
                end_time: daySchedule.end_time,
                is_active: true,
              },
            ]
          : [],
        breaks: daySchedule.enabled && daySchedule.breaks && daySchedule.breaks.length > 0
          ? daySchedule.breaks.map(breakTime => ({
              start_time: breakTime.start_time,
              end_time: breakTime.end_time,
              label: breakTime.label || '',
              is_active: breakTime.is_active !== false,
            }))
          : [],
      }));

      console.log("Saving availability schedule:", JSON.stringify(schedules, null, 2));

      // Use the correct endpoint: /profile/availability/
      // This endpoint uses the authenticated user's profile, so no providerId/providerType needed
      const response = await profileCustomizationApi.updateAvailabilitySchedule(schedules);
      
      console.log("Availability saved successfully:", response.data);

      Alert.alert("Éxito", "Disponibilidad actualizada correctamente");
      await fetchAvailability();
    } catch (err: any) {
      console.error("Error saving availability:", err);
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message || "No se pudo guardar la disponibilidad");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createTimeBlock = async (data: {
    date: string;
    start_time: string;
    end_time: string;
    reason: string;
    notes?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      await availabilityApi.createTimeBlock(data);
      Alert.alert("Éxito", "Bloqueo de horario creado");
      await fetchTimeBlocks();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTimeBlock = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await availabilityApi.deleteTimeBlock(id);
      Alert.alert("Éxito", "Bloqueo eliminado");
      await fetchTimeBlocks();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableSlots = async (
    serviceId: number,
    date: string,
    serviceType: "place" | "professional"
  ): Promise<AvailableSlotsResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await serviceApi.getAvailableSlots({
        service_id: serviceId,
        date,
        service_type: serviceType,
      });
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Convert availability array to weekly schedule format
  const availabilityToSchedule = (availabilities: any[]): WeeklySchedule => {
    const schedule: WeeklySchedule = {};

    availabilities.forEach((avail) => {
      // Ensure time format is HH:MM (strip seconds if present)
      const formatTime = (timeStr: string) => {
        if (!timeStr) return "09:00";
        // If time is in HH:MM:SS format, extract HH:MM
        const parts = timeStr.split(":");
        if (parts.length >= 2) {
          return `${parts[0].padStart(2, "0")}:${parts[1]}`;
        }
        return timeStr;
      };

      // Backend returns schedules with time_slots array
      // Get the first time slot (or use defaults)
      const timeSlot = avail.time_slots && avail.time_slots.length > 0 
        ? avail.time_slots[0] 
        : { start_time: "09:00", end_time: "18:00" };

      // Get breaks from backend
      const breaks = avail.breaks && avail.breaks.length > 0
        ? avail.breaks.map((br: any) => ({
            id: br.id,
            start_time: formatTime(br.start_time),
            end_time: formatTime(br.end_time),
            label: br.label || '',
            is_active: br.is_active !== false,
          }))
        : [];

      schedule[avail.day_of_week] = {
        enabled: avail.is_available || false,
        start_time: formatTime(timeSlot.start_time),
        end_time: formatTime(timeSlot.end_time),
        breaks: breaks || [],
      };
    });

    return schedule;
  };

  return {
    availability,
    timeBlocks,
    isLoading,
    error,
    fetchAvailability,
    fetchTimeBlocks,
    updateAvailability,
    createTimeBlock,
    deleteTimeBlock,
    getAvailableSlots,
    availabilityToSchedule,
  };
};






































