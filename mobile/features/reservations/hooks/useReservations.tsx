import {useState, useEffect, useCallback} from "react";
import {reservationApi, errorUtils} from "@/lib/api";
import {Reservation, ReservationStatus} from "@/types/global";
import {Alert} from "react-native";

export const useReservations = (userId?: number) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");

  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {};
      if (userId) params.user = userId;
      if (filter !== "all") params.status = filter;

      const response = await reservationApi.getReservations(params);
      setReservations(response.data.results || []);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const createReservation = async (data: {
    service: number;
    date: string;
    time: string;
    notes?: string;
  }) => {
    try {
      const response = await reservationApi.createReservation(data);
      Alert.alert("Éxito", "Reservación creada correctamente");
      fetchReservations(); // Refresh list
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const cancelReservation = async (id: number, reason?: string) => {
    try {
      await reservationApi.cancelReservation(id, reason);
      Alert.alert("Éxito", "Reservación cancelada");
      fetchReservations();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const deleteReservation = async (id: number) => {
    try {
      await reservationApi.deleteReservation(id);
      Alert.alert("Éxito", "Reservación eliminada");
      fetchReservations();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  return {
    reservations,
    isLoading,
    error,
    filter,
    setFilter,
    createReservation,
    cancelReservation,
    deleteReservation,
    refreshReservations: fetchReservations,
  };
};
