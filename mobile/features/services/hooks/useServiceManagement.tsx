import {useState, useCallback} from "react";
import {serviceApi, profileCustomizationApi, errorUtils} from "@/lib/api";
import {UserService} from "@/types/global";
import {Alert} from "react-native";
import {useAuth} from "@/features/auth";

function mapCustomToUserService(raw: any): UserService {
  return {
    id: raw.id,
    type: "custom_service",
    name: raw.name || "",
    description: raw.description,
    category: raw.category || "otros",
    price: Number(raw.price) || 0,
    duration: Number(raw.duration_minutes) || 0,
    is_active: raw.is_active !== false,
    created_at: raw.created_at,
  };
}

export const useServiceManagement = () => {
  const {user} = useAuth();
  const [services, setServices] = useState<UserService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [myRes, customRes] = await Promise.all([
        serviceApi.getMyServices(),
        profileCustomizationApi.getCustomServices().catch(() => ({data: []})),
      ]);
      const placeOrProf = (myRes.data.results || []) as UserService[];
      const rawCustom = customRes.data;
      const customList = Array.isArray(rawCustom)
        ? rawCustom
        : rawCustom?.results ?? [];
      const customMapped = customList.map(mapCustomToUserService);
      setServices([...placeOrProf, ...customMapped]);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createService = async (data: {
    service: number;
    description?: string;
    duration: number; // in minutes
    price: number;
    is_active?: boolean;
    professional?: number; // For place services only
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert duration to HH:MM:SS format
      const hours = Math.floor(data.duration / 60);
      const minutes = data.duration % 60;
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00`;

      const serviceData = {
        ...data,
        time: timeString,
      };

      if (user?.role === "PLACE") {
        // For place services, professional is optional
        await serviceApi.createPlaceService(serviceData);
      } else if (user?.role === "PROFESSIONAL") {
        // For professional services, we don't need to pass professional ID
        // The backend will automatically associate it with the authenticated user
        const {professional, ...professionalServiceData} = serviceData;
        await serviceApi.createProfessionalService(professionalServiceData);
      } else {
        throw new Error("Invalid user role for creating services");
      }

      Alert.alert("Éxito", "Servicio creado correctamente");
      await fetchMyServices(); // Refresh list
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateService = async (
    serviceId: number,
    serviceType: "place_service" | "professional_service" | "custom_service",
    data: any
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (serviceType === "custom_service") {
        const payload: any = { ...data };
        if (payload.duration != null) {
          payload.duration_minutes = payload.duration;
          delete payload.duration;
        }
        await profileCustomizationApi.updateCustomService(serviceId, payload);
      } else {
        if (data.duration) {
          const hours = Math.floor(data.duration / 60);
          const minutes = data.duration % 60;
          data.time = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:00`;
          delete data.duration;
        }
        if (serviceType === "place_service") {
          await serviceApi.updatePlaceService(serviceId, data);
        } else {
          await serviceApi.updateProfessionalService(serviceId, data);
        }
      }

      Alert.alert("Éxito", "Servicio actualizado correctamente");
      await fetchMyServices();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (
    serviceId: number,
    serviceType: "place_service" | "professional_service" | "custom_service"
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (serviceType === "custom_service") {
        await profileCustomizationApi.deleteCustomService(serviceId);
      } else if (serviceType === "place_service") {
        await serviceApi.deletePlaceService(serviceId);
      } else {
        await serviceApi.deleteProfessionalService(serviceId);
      }

      Alert.alert("Éxito", "Servicio eliminado");
      await fetchMyServices();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServiceStatus = async (
    serviceId: number,
    serviceType: "place_service" | "professional_service" | "custom_service",
    currentStatus: boolean
  ) => {
    try {
      await updateService(serviceId, serviceType, { is_active: !currentStatus });
    } catch (err) {
      // Error already handled in updateService
    }
  };

  return {
    services,
    isLoading,
    error,
    fetchMyServices,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
  };
};



