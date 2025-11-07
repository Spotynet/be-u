import {useState, useEffect, useCallback} from "react";
import {reviewApi, errorUtils} from "@/lib/api";
import {Alert, Platform} from "react-native";

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
        response = await reviewApi.listAll({client: userId});
      }

      const data = response.data;
      setReviews(Array.isArray(data) ? data : data.results || []);
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
    service?: number;
    rating: number;
    comment?: string;
    photos?: string[];
  }) => {
    try {
      const publicProfileId = data.professional ?? data.place;
      if (!publicProfileId) {
        throw new Error("Se requiere el identificador del perfil para crear una reseña");
      }

      const formData = new FormData();
      formData.append("to_public_profile", String(publicProfileId));
      formData.append("rating", String(data.rating));
      if (data.comment) {
        formData.append("message", data.comment);
      }
      if (data.service) {
        formData.append("service", String(data.service));
      }

      if (data.photos && data.photos.length > 0) {
        if (Platform.OS === "web") {
          await Promise.all(
            data.photos.map(async (uri, index) => {
              const res = await fetch(uri);
              const blob = await res.blob();
              const mimeType = blob.type || "image/jpeg";
              const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
              const file = new File([blob], `review_${Date.now()}_${index}.${ext}`, {
                type: mimeType,
              });
              formData.append("images", file);
            })
          );
        } else {
          for (let index = 0; index < data.photos.length; index++) {
            const uri = data.photos[index];
            const extension = uri.split(".").pop() || "jpg";
            const file = {
              uri,
              type: `image/${extension === "jpg" ? "jpeg" : extension}`,
              name: `review_${Date.now()}_${index}.${extension}`,
            } as any;
            formData.append("images", file);
          }
        }
      }

      const response = await reviewApi.createReview(formData);
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
      const response = await reviewApi.updateReview(id, {
        ...(data.rating !== undefined && {rating: data.rating}),
        ...(data.comment !== undefined && {message: data.comment}),
      });
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
      await reviewApi.deleteReview(id);
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

