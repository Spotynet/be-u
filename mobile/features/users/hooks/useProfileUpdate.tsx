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
  phone?: string;
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

      console.log("updateProfile called with:", {profileData, userData, userRole});

      // Combine user data and profile data into a single request
      const combinedData = {
        ...userData,
        ...profileData,
      };

      console.log("Sending combined data to /auth/profile/:", combinedData);

      // Use the single /auth/profile/ endpoint for all updates
      const result = await authApi.updateProfile(combinedData);
      
      console.log("Profile update response:", result.data);
      Alert.alert("Éxito", "Perfil actualizado correctamente");

      return result;
    } catch (err) {
      console.error("Profile update error:", err);
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
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
