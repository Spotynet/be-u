import {useState, useEffect} from "react";
import {profileCustomizationApi, errorUtils} from "@/lib/api";
import {Alert} from "react-native";

interface ProfileImage {
  id: number;
  image: string;
  caption?: string;
  is_primary: boolean;
  order: number;
  is_active: boolean;
}

interface CustomService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilitySchedule {
  id: number;
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface ProfileCustomizationData {
  images: ProfileImage[];
  services: CustomService[];
  availability: AvailabilitySchedule[];
}

export const useProfileCustomization = () => {
  const [data, setData] = useState<ProfileCustomizationData>({
    images: [],
    services: [],
    availability: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await profileCustomizationApi.getProfileCustomization();
      setData(response.data);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      console.error("Error fetching profile customization data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Image management
  const uploadImage = async (imageUri: string, caption?: string) => {
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile_image.jpg",
      } as any);
      if (caption) {
        formData.append("caption", caption);
      }

      const response = await profileCustomizationApi.uploadProfileImage(formData);
      setData((prev) => ({
        ...prev,
        images: [...prev.images, response.data],
      }));
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const updateImage = async (imageId: number, updates: Partial<ProfileImage>) => {
    try {
      const response = await profileCustomizationApi.updateProfileImage(imageId, updates);
      setData((prev) => ({
        ...prev,
        images: prev.images.map((img) => (img.id === imageId ? response.data : img)),
      }));
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const deleteImage = async (imageId: number) => {
    try {
      await profileCustomizationApi.deleteProfileImage(imageId);
      setData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  // Service management
  const createService = async (
    serviceData: Omit<CustomService, "id" | "created_at" | "updated_at">
  ) => {
    try {
      const response = await profileCustomizationApi.createCustomService(serviceData);
      setData((prev) => ({
        ...prev,
        services: [...prev.services, response.data],
      }));
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const updateService = async (serviceId: number, updates: Partial<CustomService>) => {
    try {
      const response = await profileCustomizationApi.updateCustomService(serviceId, updates);
      setData((prev) => ({
        ...prev,
        services: prev.services.map((service) =>
          service.id === serviceId ? response.data : service
        ),
      }));
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const deleteService = async (serviceId: number) => {
    try {
      await profileCustomizationApi.deleteCustomService(serviceId);
      setData((prev) => ({
        ...prev,
        services: prev.services.filter((service) => service.id !== serviceId),
      }));
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  // Availability management
  const updateAvailability = async (scheduleData: AvailabilitySchedule[]) => {
    try {
      const response = await profileCustomizationApi.updateAvailabilitySchedule(scheduleData);
      setData((prev) => ({
        ...prev,
        availability: response.data,
      }));
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,

    // Image operations
    uploadImage,
    updateImage,
    deleteImage,

    // Service operations
    createService,
    updateService,
    deleteService,

    // Availability operations
    updateAvailability,
  };
};








