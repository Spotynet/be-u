import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {formatPrice} from "@/lib/priceUtils";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter, useLocalSearchParams} from "expo-router";

export default function BookingConfirmationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get booking data from navigation params
  const bookingData = {
    id: "BKG-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    service: {
      name: params.serviceName || "Servicio",
      duration: "45 min", // Default duration
      price: params.price || 500,
    },
    provider: {
      name: params.providerName || "Profesional",
      type: "professional",
    },
    date: params.date || new Date().toLocaleDateString("es-MX"),
    time: params.time || "14:00",
    status: "confirmed",
  };

  const handleViewBooking = () => {
    router.push("/(tabs)/perfil");
  };

  const handleBookAnother = () => {
    router.push("/(tabs)/explore");
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Reserva Confirmada</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Animation */}
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, {backgroundColor: colors.primary + "15"}]}>
            <Ionicons name="checkmark-circle" color={colors.primary} size={80} />
          </View>
          <Text style={[styles.successTitle, {color: colors.foreground}]}>
            ¡Reserva Confirmada!
          </Text>
          <Text style={[styles.successMessage, {color: colors.mutedForeground}]}>
            Tu reserva ha sido confirmada exitosamente. Recibirás un recordatorio por email antes de tu cita.
          </Text>
        </View>

        {/* Booking Details */}
        <View style={[styles.detailsCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.cardTitle, {color: colors.foreground}]}>Detalles de la Reserva</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>
              Número de Reserva
            </Text>
            <Text style={[styles.detailValue, {color: colors.foreground}]}>{bookingData.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Servicio</Text>
            <Text style={[styles.detailValue, {color: colors.foreground}]}>
              {bookingData.service.name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>
              Profesional/Establecimiento
            </Text>
            <Text style={[styles.detailValue, {color: colors.foreground}]}>
              {bookingData.provider.name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Fecha</Text>
            <Text style={[styles.detailValue, {color: colors.foreground}]}>{bookingData.date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Hora</Text>
            <Text style={[styles.detailValue, {color: colors.foreground}]}>{bookingData.time}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Duración</Text>
            <Text style={[styles.detailValue, {color: colors.foreground}]}>
              {bookingData.service.duration}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Precio</Text>
            <Text style={[styles.detailValue, {color: colors.primary, fontWeight: "700"}]}>
              {formatPrice(bookingData.service.price, {suffix: " MXN"})}
            </Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={[styles.nextStepsCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.cardTitle, {color: colors.foreground}]}>Próximos Pasos</Text>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name="mail" color={colors.primary} size={20} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>
                Confirmación por Email
              </Text>
              <Text style={[styles.stepDescription, {color: colors.mutedForeground}]}>
                Recibirás un email con todos los detalles de tu cita
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name="notifications" color={colors.primary} size={20} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>Recordatorio</Text>
              <Text style={[styles.stepDescription, {color: colors.mutedForeground}]}>
                Te enviaremos un recordatorio 24 horas antes de tu cita
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name="calendar" color={colors.primary} size={20} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, {color: colors.foreground}]}>
                Llegar 10 minutos antes
              </Text>
              <Text style={[styles.stepDescription, {color: colors.mutedForeground}]}>
                Asegúrate de llegar puntual para tu cita
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, {backgroundColor: colors.primary}]}
            onPress={handleViewBooking}
            activeOpacity={0.8}>
            <Ionicons name="calendar" color="#ffffff" size={20} />
            <Text style={styles.primaryButtonText}>Ver Mis Reservas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, {borderColor: colors.border}]}
            onPress={handleBookAnother}
            activeOpacity={0.8}>
            <Ionicons name="add-circle" color={colors.foreground} size={20} />
            <Text style={[styles.secondaryButtonText, {color: colors.foreground}]}>
              Reservar Otra Cita
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
  },
  nextStepsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
