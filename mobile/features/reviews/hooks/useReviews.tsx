import {useState, useEffect, useCallback} from "react";
import {reviewApi, errorUtils} from "@/lib/api";
import {Alert} from "react-native";

export interface Review {
  id: number;
  rating: number;
  comment: string;
  client_name?: string;
  professional_name?: string;
  place_name?: string;
  service_name?: string;
  created_at: string;
  updated_at: string;
  photos?: string[];
}

export const useReviews = (userId?: number, type?: "client" | "professional" | "place") => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      if (type === "professional") {
        response = await reviewApi.listProfessionals({professional: userId});
      } else if (type === "place") {
        response = await reviewApi.listPlaces({place: userId});
      } else {
        // For clients, get reviews they've written
        response = await reviewApi.listAll({client: userId});
      }

      setReviews(response.data.results || []);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
  }, [fetchReviews, userId]);

  const createReview = async (data: {
    professional?: number;
    place?: number;
    service: number;
    rating: number;
    comment: string;
    photos?: string[];
  }) => {
    try {
      const response = await reviewApi.createProfessional(data);
      Alert.alert("Éxito", "Reseña creada correctamente");
      fetchReviews(); // Refresh list
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const updateReview = async (id: number, data: {rating?: number; comment?: string}) => {
    try {
      const response = await reviewApi.updateProfessional(id, data);
      Alert.alert("Éxito", "Reseña actualizada correctamente");
      fetchReviews();
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const deleteReview = async (id: number) => {
    try {
      await reviewApi.deleteProfessional(id);
      Alert.alert("Éxito", "Reseña eliminada correctamente");
      fetchReviews();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  return {
    reviews,
    isLoading,
    error,
    createReview,
    updateReview,
    deleteReview,
    refreshReviews: fetchReviews,
  };
};

