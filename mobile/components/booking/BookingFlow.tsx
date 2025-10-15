import React, {useState} from "react";
import {View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {DateTimePicker} from "./DateTimePicker";
import {ProfessionalSelector} from "./ProfessionalSelector";
import {mockAvailableSlots} from "@/lib/mockData";
import {useRouter} from "expo-router";
import {ProfessionalProfile} from "@/types/global";

// Force reload - BookingFlow component

interface BookingFlowProps {
  isVisible: boolean;
  onClose: () => void;
  service: {
    id: number;
    name: string;
    duration: string;
    price: number;
    description: string;
    professional?: string;
  };
  provider: {
    id: number;
    name: string;
    last_name?: string;
    type?: "professional" | "place";
  };
  selectedProfessional?: ProfessionalProfile;
  availableProfessionals?: ProfessionalProfile[];
  onConfirm?: (bookingData: any) => void;
}

export function BookingFlow({
  isVisible,
  onClose,
  service,
  provider,
  selectedProfessional: initialProfessional,
  availableProfessionals,
  onConfirm,
}: BookingFlowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalProfile | null>(
    initialProfessional || null
  );

  // Dynamic steps based on whether we need professional selection
  const steps = availableProfessionals
    ? [
        {id: 1, title: "Profesional", icon: "person-outline"},
        {id: 2, title: "Fecha y Hora", icon: "calendar-outline"},
        {id: 3, title: "Detalles", icon: "document-text-outline"},
        {id: 4, title: "Confirmar", icon: "checkmark-circle-outline"},
      ]
    : [
        {id: 1, title: "Fecha y Hora", icon: "calendar-outline"},
        {id: 2, title: "Detalles", icon: "document-text-outline"},
        {id: 3, title: "Confirmar", icon: "checkmark-circle-outline"},
      ];

  const maxSteps = steps.length;

  const handleNext = () => {
    console.log("handleNext called", {currentStep, selectedDate, selectedTime});
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const bookingData = {
      service,
      provider,
      professional: selectedProfessional,
      date: selectedDate,
      time: selectedTime,
      notes,
      status: "confirmed",
    };

    if (onConfirm) {
      onConfirm(bookingData);
    }
    setIsConfirming(false);
    onClose();

    // Navigate to confirmation page
    const providerName = selectedProfessional
      ? `${selectedProfessional.name} ${selectedProfessional.last_name || ""}`.trim()
      : `${provider.name} ${provider.last_name || ""}`.trim();

    router.push({
      pathname: "/booking-confirmation",
      params: {
        serviceName: service.name,
        providerName,
        date: selectedDate.toLocaleDateString("es-MX"),
        time: selectedTime,
        price: service.price,
      },
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step) => (
        <View key={step.id} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: currentStep >= step.id ? colors.primary : colors.muted,
              },
            ]}>
            <Ionicons
              name={step.icon as any}
              color={currentStep >= step.id ? "#ffffff" : colors.mutedForeground}
              size={16}
            />
          </View>
          <Text
            style={[
              styles.stepTitle,
              {
                color: currentStep >= step.id ? colors.foreground : colors.mutedForeground,
              },
            ]}>
            {step.title}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    // If we have professionals to select from, step 1 is professional selection
    if (availableProfessionals && currentStep === 1) {
      return (
        <ProfessionalSelector
          professionals={availableProfessionals}
          selectedProfessional={selectedProfessional}
          onSelectProfessional={setSelectedProfessional}
        />
      );
    }

    // Calculate the actual step based on whether we have professional selection
    const actualStep = availableProfessionals ? currentStep - 1 : currentStep;

    switch (actualStep) {
      case 1:
        return (
          <DateTimePicker
            selectedDate={selectedDate}
            onDateChange={(date) => {
              console.log("Date selected:", date);
              setSelectedDate(date);
            }}
            selectedTime={selectedTime}
            onTimeChange={(time) => {
              console.log("Time selected:", time);
              setSelectedTime(time);
            }}
            availableSlots={mockAvailableSlots}
            serviceDuration={service.duration}
          />
        );
      case 2:
        return (
          <View style={styles.detailsStep}>
            <Text style={[styles.stepTitle, {color: colors.foreground}]}>
              Información de la Reserva
            </Text>

            <View style={[styles.serviceCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.serviceName, {color: colors.foreground}]}>{service.name}</Text>
              <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                {service.description}
              </Text>
              <View style={styles.serviceDetails}>
                <View style={styles.serviceDetail}>
                  <Ionicons name="time-outline" color={colors.primary} size={16} />
                  <Text style={[styles.detailText, {color: colors.foreground}]}>
                    {service.duration}
                  </Text>
                </View>
                <View style={styles.serviceDetail}>
                  <Ionicons name="cash-outline" color={colors.primary} size={16} />
                  <Text style={[styles.detailText, {color: colors.foreground}]}>
                    ${service.price} MXN
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.providerCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.providerName, {color: colors.foreground}]}>
                {selectedProfessional
                  ? `${selectedProfessional.name} ${selectedProfessional.last_name || ""}`.trim()
                  : `${provider.name} ${provider.last_name || ""}`.trim()}
              </Text>
              <Text style={[styles.providerType, {color: colors.mutedForeground}]}>
                {selectedProfessional
                  ? "Profesional"
                  : provider.type === "professional"
                  ? "Profesional"
                  : "Establecimiento"}
              </Text>
            </View>

            <View style={[styles.dateTimeCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.dateTimeTitle, {color: colors.foreground}]}>
                Fecha y Hora Seleccionada
              </Text>
              <Text style={[styles.dateTimeText, {color: colors.foreground}]}>
                {selectedDate.toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              <Text style={[styles.dateTimeText, {color: colors.foreground}]}>{selectedTime}</Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.confirmStep}>
            <View style={[styles.confirmationCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.confirmTitle, {color: colors.foreground}]}>
                ¡Confirmar Reserva!
              </Text>
              <Text style={[styles.confirmDescription, {color: colors.mutedForeground}]}>
                Revisa los detalles de tu reserva antes de confirmar
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        {/* Header */}
        <View style={[styles.header, {borderBottomColor: colors.border}]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>
            Reservar {service.name}
          </Text>
          <View style={{width: 40}} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, {borderTopColor: colors.border}]}>
          <View style={styles.footerButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, {borderColor: colors.border}]}
                onPress={handlePrevious}
                activeOpacity={0.8}>
                <Text style={[styles.buttonText, {color: colors.foreground}]}>Anterior</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: (() => {
                    // Professional selection step validation
                    if (availableProfessionals && currentStep === 1 && !selectedProfessional) {
                      return colors.muted;
                    }
                    // Date/time selection step validation
                    const dateTimeStep = availableProfessionals ? 2 : 1;
                    if (currentStep === dateTimeStep && (!selectedDate || !selectedTime)) {
                      return colors.muted;
                    }
                    return colors.primary;
                  })(),
                },
                currentStep === maxSteps && isConfirming && styles.disabledButton,
              ]}
              onPress={currentStep === maxSteps ? handleConfirm : handleNext}
              disabled={
                (availableProfessionals && currentStep === 1 && !selectedProfessional) ||
                (currentStep === (availableProfessionals ? 2 : 1) &&
                  (!selectedDate || !selectedTime)) ||
                (currentStep === maxSteps && isConfirming)
              }
              activeOpacity={0.8}>
              {currentStep === maxSteps && isConfirming ? (
                <Text style={styles.buttonText}>Confirmando...</Text>
              ) : (
                <Text style={styles.buttonText}>
                  {currentStep === maxSteps ? "Confirmar Reserva" : "Siguiente"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  detailsStep: {
    gap: 16,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: "row",
    gap: 16,
  },
  serviceDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  providerCard: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  providerType: {
    fontSize: 14,
  },
  dateTimeCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dateTimeTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateTimeText: {
    fontSize: 14,
  },
  confirmStep: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  confirmDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#4ECDC4",
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
