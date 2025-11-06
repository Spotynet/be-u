import {useState, useEffect} from "react";
import {Platform} from "react-native";
import {profileCustomizationApi, serviceApi, errorUtils} from "@/lib/api";
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
      
      // Try to get images from getProfileImages which has the updated structure
      try {
        const imagesResponse = await profileCustomizationApi.getProfileImages();
        if (imagesResponse.data?.images) {
          // Map images to ProfileImage format
          const images = imagesResponse.data.images.map((img: any, index: number) => {
            if (typeof img === 'string') {
              return {
                id: Date.now() + index,
                image: img,
                is_primary: index === 0,
                order: index,
                is_active: true,
              };
            } else {
              return {
                id: img.id || Date.now() + index,
                image: img.image || img.image_url || img.url || img,
                caption: img.caption,
                is_primary: img.is_primary || index === 0,
                order: img.order || index,
                is_active: img.is_active !== false,
              };
            }
          });
          
          setData((prev) => ({
            ...prev,
            images: images,
          }));
        }
      } catch (imgError) {
        console.log("Could not fetch images from getProfileImages, trying getProfileCustomization");
      }
      
      // Get other customization data
      const response = await profileCustomizationApi.getProfileCustomization();
      if (response.data) {
        setData((prev) => ({
          ...prev,
          services: response.data.services || prev.services,
          availability: response.data.availability || prev.availability,
          // Only update images if not already set from getProfileImages
          images: prev.images.length > 0 ? prev.images : (response.data.images || []),
        }));
      }
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

      if (Platform.OS === "web") {
        // On web, convert URI to Blob/File object
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const mimeType = blob.type || "image/jpeg";
        const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const file = new File([blob], `profile_image_${Date.now()}.${ext}`, {type: mimeType});
        formData.append("image", file);
      } else {
        // On native, use the React Native file descriptor
        const uriParts = imageUri.split(".");
        const fileType = uriParts[uriParts.length - 1] || "jpg";
        const rnFile = {
          uri: imageUri,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
          name: `profile_image_${Date.now()}.${fileType}`,
        } as any;
        formData.append("image", rnFile);
      }

      if (caption) {
        formData.append("caption", caption);
      }

      const response = await profileCustomizationApi.uploadProfileImage(formData);
      
      // Update images directly from response if available
      if (response.data?.images) {
        // Map the response images to ProfileImage format
        const updatedImages = response.data.images.map((img: any, index: number) => {
          // Handle both URL strings and image objects
          if (typeof img === 'string') {
            return {
              id: Date.now() + index, // Temporary ID
              image: img,
              is_primary: index === 0,
              order: index,
              is_active: true,
            };
          } else {
            return {
              id: img.id || Date.now() + index,
              image: img.image || img.image_url || img.url || img,
              caption: img.caption,
              is_primary: img.is_primary || index === 0,
              order: img.order || index,
              is_active: img.is_active !== false,
            };
          }
        });
        
        setData((prev) => ({
          ...prev,
          images: updatedImages,
        }));
      } else {
        // Fallback: refresh all data
        await fetchData();
      }
      
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

  const deleteImage = async (imageIndex: number) => {
    try {
      const response = await profileCustomizationApi.deleteProfileImage(imageIndex);
      
      // Update images from response if available
      if (response.data?.images) {
        const updatedImages = response.data.images.map((img: any, index: number) => {
          if (typeof img === 'string') {
            return {
              id: Date.now() + index,
              image: img,
              is_primary: index === 0,
              order: index,
              is_active: true,
            };
          } else {
            return {
              id: img.id || Date.now() + index,
              image: img.image || img.image_url || img.url || img,
              caption: img.caption,
              is_primary: img.is_primary || index === 0,
              order: img.order || index,
              is_active: img.is_active !== false,
            };
          }
        });
        
        setData((prev) => ({
          ...prev,
          images: updatedImages,
        }));
      } else {
        // Refresh images from server to get updated list
        try {
          const imagesResponse = await profileCustomizationApi.getProfileImages();
          if (imagesResponse.data?.images) {
            const images = imagesResponse.data.images.map((img: any, index: number) => {
              if (typeof img === 'string') {
                return {
                  id: Date.now() + index,
                  image: img,
                  is_primary: index === 0,
                  order: index,
                  is_active: true,
                };
              } else {
                return {
                  id: img.id || Date.now() + index,
                  image: img.image || img.image_url || img.url || img,
                  caption: img.caption,
                  is_primary: img.is_primary || index === 0,
                  order: img.order || index,
                  is_active: img.is_active !== false,
                };
              }
            });
            
            setData((prev) => ({
              ...prev,
              images: images,
            }));
          }
        } catch (refreshError) {
          // If refresh fails, fallback to local state update
          setData((prev) => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== imageIndex),
          }));
        }
      }
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  // Service management - Use new unified services system
  const createService = async (
    serviceData: Omit<CustomService, "id" | "created_at" | "updated_at">
  ) => {
    try {
      // Convert CustomService data to Service data format
      const servicePayload = {
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        duration: `${serviceData.duration_minutes || 60}:00:00`, // Convert minutes to HH:MM:SS
        category: serviceData.category,
        sub_category: serviceData.sub_category,
        images: serviceData.images || [],
      };

      const response = await serviceApi.createService(servicePayload);
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
