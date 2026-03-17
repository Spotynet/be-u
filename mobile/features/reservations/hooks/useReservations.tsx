import {useState, useEffect, useCallback} from "react";
import {reservationApi, errorUtils} from "@/lib/api";
import {Reservation, ReservationStatus} from "@/types/global";
import {Alert} from "react-native";

type UseReservationsOptions = {
  /** When true, use getMyReservations (no pagination, includes group sessions). Client role only. */
  asClient?: boolean;
};

export const useReservations = (userId?: number, options?: UseReservationsOptions) => {
  const asClient = options?.asClient ?? false;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");

  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!asClient) {
        // Non-client: use getReservations (for providers this isn't used; caller uses useIncomingReservations)
        const params: any = {};
        if (userId) params.user = userId;
        if (filter !== "all") params.status = filter;
        const response = await reservationApi.getReservations(params);
        setReservations(response.data.results || []);
        return;
      }

      // Client: use getMyReservations (no pagination) - includes group session reservations
      const filterParam = filter === "all" ? "upcoming" : filter;
      const response = await reservationApi.getMyReservations({filter: filterParam});
      let allResults: any[] = response.data.results || [];
      if (filter === "all") {
        const pastRes = await reservationApi.getMyReservations({filter: "past"});
        const pastResults = pastRes.data.results || [];
        const seen = new Set(allResults.map((r: any) => r.id));
        for (const r of pastResults) {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            allResults = [...allResults, r];
          }
        }
        allResults.sort((a, b) => {
          const da = a.date || "";
          const ta = a.time || "";
          const db = b.date || "";
          const tb = b.time || "";
          if (da !== db) return db.localeCompare(da);
          return tb.localeCompare(ta);
        });
      }
      setReservations(allResults);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter, asClient]);

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
