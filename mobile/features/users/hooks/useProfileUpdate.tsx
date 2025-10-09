import {useState} from "react";
import {profileApi, authApi, errorUtils} from "@/lib/api";
import {Alert} from "react-native";
import {ClientProfile, ProfessionalProfile, PlaceProfile} from "@/types/global";

interface UpdateClientData {
  phone?: string;
  photo?: string;
}

interface UpdateProfessionalData {
  name?: string;
  last_name?: string;
  bio?: string;
  city?: string;
}

interface UpdatePlaceData {
  name?: string;
  street?: string;
  number_ext?: string;
  number_int?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const useProfileUpdate = (userId: number, userRole: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateClientProfile = async (data: UpdateClientData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await profileApi.updateClientProfile(userId, data);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfessionalProfile = async (data: UpdateProfessionalData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await profileApi.updateProfessionalProfile(userId, data);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlaceProfile = async (data: UpdatePlaceData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await profileApi.updatePlaceProfile(userId, data);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserInfo = async (data: UpdateUserData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.updateProfile(data);
      Alert.alert("Éxito", "Información actualizada correctamente");
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: any, userData?: UpdateUserData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update user info if provided
      if (userData) {
        await updateUserInfo(userData);
      }

      // Update role-specific profile
      let result;
      switch (userRole) {
        case "CLIENT":
          result = await updateClientProfile(profileData);
          break;
        case "PROFESSIONAL":
          result = await updateProfessionalProfile(profileData);
          break;
        case "PLACE":
          result = await updatePlaceProfile(profileData);
          break;
        default:
          throw new Error("Invalid user role");
      }

      return result;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    updateClientProfile,
    updateProfessionalProfile,
    updatePlaceProfile,
    updateUserInfo,
    isLoading,
    error,
  };
};
