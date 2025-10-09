import {useState, useEffect, useCallback} from "react";
import {reservationApi, errorUtils} from "@/lib/api";
import {Reservation, ReservationStatus} from "@/types/global";
import {Alert} from "react-native";

export const useIncomingReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");

  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {};
      if (filter !== "all") params.status = filter;

      const response = await reservationApi.getIncomingReservations(params);
      setReservations(response.data.results || []);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const confirmReservation = async (id: number) => {
    try {
      await reservationApi.confirmReservation(id);
      Alert.alert("Éxito", "Reservación confirmada");
      fetchReservations();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const rejectReservation = async (id: number, reason?: string) => {
    try {
      await reservationApi.rejectReservation(id, reason);
      Alert.alert("Éxito", "Reservación rechazada");
      fetchReservations();
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
      throw err;
    }
  };

  const completeReservation = async (id: number) => {
    try {
      await reservationApi.completeReservation(id);
      Alert.alert("Éxito", "Reservación completada");
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
    confirmReservation,
    rejectReservation,
    completeReservation,
    refreshReservations: fetchReservations,
  };
};
