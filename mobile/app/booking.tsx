import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {useAuth} from "@/features/auth";
import {useReservationFlow} from "@/features/reservations";
import {CalendarView, TimeSlotPicker} from "@/components/calendar";
import {useRouter, useLocalSearchParams} from "expo-router";

export default function BookingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const params = useLocalSearchParams<{
    serviceId?: string;
    serviceName?: string;
    serviceType?: string;
    providerId?: string;
    providerName?: string;
    price?: string;
    duration?: string;
  }>();

  const {state, isLoading, selectDate, selectTimeSlot, setNotes, createReservation} =
    useReservationFlow();

  const [localNotes, setLocalNotes] = useState("");

  // Initialize service from params
  const serviceInfo = params.serviceId
    ? {
        serviceId: parseInt(params.serviceId),
        serviceName: params.serviceName || "Servicio",
        serviceType: (params.serviceType as "place" | "professional") || "place",
        providerId: parseInt(params.providerId || "0"),
        providerName: params.providerName || "Proveedor",
        price: parseFloat(params.price || "0"),
        duration: parseInt(params.duration || "60"),
      }
    : null;

  const handleDateSelect = async (date: string) => {
    if (!serviceInfo) return;
    await selectDate(date);
  };

  const handleTimeSelect = (slot: any) => {
    selectTimeSlot(slot);
    setNotes(localNotes);
  };

  const handleConfirmBooking = async () => {
    const reservation = await createReservation();
    if (reservation) {
      Alert.alert(
        "¡Reserva Creada!",
        "Tu reserva ha sido enviada y está pendiente de confirmación",
        [
          {
            text: "Ver Mis Reservas",
            onPress: () => router.push("/(tabs)/reservas"),
          },
        ]
      );
    }
  };

  if (!isAuthenticated || !user || user.role !== "CLIENT") {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Solo los clientes pueden hacer reservas
          </Text>
        </View>
      </View>
    );
  }

  if (!serviceInfo) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Información de servicio no disponible
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Reserva</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Service Info Card */}
      <View style={[styles.serviceCard, {backgroundColor: colors.card}]}>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, {color: colors.foreground}]}>
            {serviceInfo.serviceName}
          </Text>
          <Text style={[styles.providerName, {color: colors.mutedForeground}]}>
            {serviceInfo.providerName}
          </Text>
        </View>
        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.detailText, {color: colors.foreground}]}>
              {serviceInfo.duration} min
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={[styles.priceText, {color: colors.primary}]}>${serviceInfo.price}</Text>
          </View>
        </View>
      </View>

      {/* Steps */}
      <View style={[styles.stepsContainer, {backgroundColor: colors.background}]}>
        <View style={styles.step}>
          <View
            style={[
              styles.stepNumber,
              {
                backgroundColor: state.date ? colors.primary : colors.muted,
              },
            ]}>
            <Text
              style={[
                styles.stepNumberText,
                {color: state.date ? "#ffffff" : colors.mutedForeground},
              ]}>
              1
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              {color: state.date ? colors.primary : colors.mutedForeground},
            ]}>
            Fecha
          </Text>
        </View>

        <View style={[styles.stepDivider, {backgroundColor: colors.border}]} />

        <View style={styles.step}>
          <View
            style={[
              styles.stepNumber,
              {
                backgroundColor: state.timeSlot ? colors.primary : colors.muted,
              },
            ]}>
            <Text
              style={[
                styles.stepNumberText,
                {color: state.timeSlot ? "#ffffff" : colors.mutedForeground},
              ]}>
              2
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              {color: state.timeSlot ? colors.primary : colors.mutedForeground},
            ]}>
            Hora
          </Text>
        </View>

        <View style={[styles.stepDivider, {backgroundColor: colors.border}]} />

        <View style={styles.step}>
          <View style={[styles.stepNumber, {backgroundColor: colors.muted}]}>
            <Text style={[styles.stepNumberText, {color: colors.mutedForeground}]}>3</Text>
          </View>
          <Text style={[styles.stepLabel, {color: colors.mutedForeground}]}>Confirmar</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Date Selection */}
        {!state.date ? (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, {color: colors.foreground}]}>Selecciona una fecha</Text>
            <CalendarView
              reservations={[]}
              onDayPress={handleDateSelect}
              selectedDate={state.date}
              minDate={new Date().toISOString().split("T")[0]}
            />
          </View>
        ) : !state.timeSlot ? (
          // Step 2: Time Selection
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => selectDate(undefined as any)} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>
                Selecciona un horario
              </Text>
              <View style={styles.placeholder} />
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
                  Cargando horarios disponibles...
                </Text>
              </View>
            ) : state.availableSlots ? (
              <TimeSlotPicker
                slots={state.availableSlots.slots}
                selectedTime={state.timeSlot?.time}
                onSelectTime={handleTimeSelect}
                date={state.date}
              />
            ) : null}
          </View>
        ) : (
          // Step 3: Confirmation
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TouchableOpacity
                onPress={() => selectTimeSlot(undefined as any)}
                activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>
                Confirma tu reserva
              </Text>
              <View style={styles.placeholder} />
            </View>

            {/* Summary Card */}
            <View style={[styles.summaryCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.summaryTitle, {color: colors.foreground}]}>
                Resumen de Reserva
              </Text>

              <View style={styles.summaryItem}>
                <Ionicons name="cut" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>
                    Servicio
                  </Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    {serviceInfo.serviceName}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>Fecha</Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    {new Date(state.date).toLocaleDateString("es-MX", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>Hora</Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    {state.timeSlot.time} - {state.timeSlot.end_time}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Ionicons name="cash" size={20} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryLabel, {color: colors.mutedForeground}]}>Precio</Text>
                  <Text style={[styles.summaryValue, {color: colors.foreground}]}>
                    ${serviceInfo.price}
                  </Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={[styles.label, {color: colors.foreground}]}>
                Notas para el proveedor (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={localNotes}
                onChangeText={setLocalNotes}
                placeholder="Ej: Alergia a ciertos productos, preferencias específicas..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Info */}
            <View style={[styles.infoCard, {backgroundColor: "#3b82f6" + "10"}]}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={[styles.infoText, {color: "#3b82f6"}]}>
                Tu reserva será enviada y estará pendiente de confirmación por parte del proveedor
              </Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmButton, {backgroundColor: colors.primary}]}
              onPress={handleConfirmBooking}
              disabled={isLoading}
              activeOpacity={0.9}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>Confirmar Reserva</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  serviceCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  serviceInfo: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    fontWeight: "500",
  },
  serviceDetails: {
    flexDirection: "row",
    gap: 20,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  step: {
    alignItems: "center",
    gap: 8,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  stepDivider: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  notesSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  notesInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
});







