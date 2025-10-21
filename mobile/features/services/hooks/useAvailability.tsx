import {useState, useCallback} from "react";
import {availabilityApi, serviceApi, errorUtils} from "@/lib/api";
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
      const response = await availabilityApi.getAvailability({
        provider_type: providerType,
        provider_id: providerId,
      });
      setAvailability(response.data.results || []);
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
    if (!providerId || !providerType) {
      Alert.alert("Error", "Provider information is missing");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convert schedule to API format
      const schedules = Object.entries(schedule)
        .filter(([_, daySchedule]) => daySchedule.enabled)
        .map(([day, daySchedule]) => ({
          day_of_week: parseInt(day),
          start_time: daySchedule.start_time,
          end_time: daySchedule.end_time,
          is_active: true,
        }));

      await availabilityApi.bulkUpdateAvailability({
        provider_type: providerType,
        provider_id: providerId,
        schedules,
      });

      Alert.alert("Éxito", "Disponibilidad actualizada correctamente");
      await fetchAvailability();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
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
  const availabilityToSchedule = (availabilities: ProviderAvailability[]): WeeklySchedule => {
    const schedule: WeeklySchedule = {};

    availabilities.forEach((avail) => {
      schedule[avail.day_of_week] = {
        enabled: avail.is_active,
        start_time: avail.start_time,
        end_time: avail.end_time,
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














