import {useState} from "react";
import {reservationApi, serviceApi, errorUtils} from "@/lib/api";
import {TimeSlot, AvailableSlotsResponse} from "@/types/global";
import {Alert} from "react-native";

interface ServiceSelection {
  serviceId: number;
  serviceName: string;
  serviceType: "place" | "professional";
  providerId: number;
  providerName: string;
  price: number;
  duration: number;
}

interface BookingState {
  step: number;
  service?: ServiceSelection;
  date?: string;
  timeSlot?: TimeSlot;
  notes?: string;
  availableSlots?: AvailableSlotsResponse;
}

export const useReservationFlow = () => {
  const [state, setState] = useState<BookingState>({
    step: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectService = (service: ServiceSelection) => {
    setState({
      ...state,
      step: 2,
      service,
      date: undefined,
      timeSlot: undefined,
    });
  };

  const selectDate = async (date: string) => {
    if (!state.service) {
      Alert.alert("Error", "Por favor selecciona un servicio primero");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch available slots for this date
      const response = await serviceApi.getAvailableSlots({
        service_id: state.service.serviceId,
        date,
        service_type: state.service.serviceType,
      });

      setState({
        ...state,
        step: 3,
        date,
        timeSlot: undefined,
        availableSlots: response.data,
      });
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTimeSlot = (slot: TimeSlot) => {
    setState({
      ...state,
      step: 4,
      timeSlot: slot,
    });
  };

  const setNotes = (notes: string) => {
    setState({
      ...state,
      notes,
    });
  };

  const createReservation = async () => {
    if (!state.service || !state.date || !state.timeSlot) {
      Alert.alert("Error", "Información incompleta para crear la reserva");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const reservationData = {
        service: state.service.serviceId,
        provider_type: state.service.serviceType,
        provider_id: state.service.providerId,
        service_instance_type:
          state.service.serviceType === "place" ? "place_service" : "professional_service",
        service_instance_id: state.service.serviceId,
        date: state.date,
        time: state.timeSlot.time,
        notes: state.notes,
      };

      const response = await reservationApi.createReservation(reservationData as any);

      setState({
        step: 5, // Success step
        service: state.service,
        date: state.date,
        timeSlot: state.timeSlot,
        notes: state.notes,
      });

      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert("Error al crear reserva", message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setState({step: 1});
    setError(null);
  };

  const goToStep = (step: number) => {
    setState({...state, step});
  };

  return {
    state,
    isLoading,
    error,
    selectService,
    selectDate,
    selectTimeSlot,
    setNotes,
    createReservation,
    reset,
    goToStep,
  };
};
