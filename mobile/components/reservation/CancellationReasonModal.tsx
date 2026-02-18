import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";
import {
  CANCELLATION_REASONS,
  CANCELLATION_REASON_HORARIO_INCORRECTO,
  CANCELLATION_REASON_YA_NO_LA_NECESITO,
} from "@/constants/cancellationReasons";

export type RetentionStep = "reason" | "horario_offer" | "ya_no_need_offer";

interface CancellationReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmCancel: (reasonCode: string) => void;
  onChooseReschedule: () => void;
  isCancelling?: boolean;
  reasons?: ReadonlyArray<{code: string; label: string}>;
}

export function CancellationReasonModal({
  visible,
  onClose,
  onConfirmCancel,
  onChooseReschedule,
  isCancelling = false,
  reasons = CANCELLATION_REASONS,
}: CancellationReasonModalProps) {
  const { colors } = useThemeVariant();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [step, setStep] = useState<RetentionStep>("reason");

  const reset = () => {
    setSelectedCode(null);
    setStep("reason");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectReason = (code: string) => {
    setSelectedCode(code);
  };

  const handleConfirmCancelation = () => {
    if (!selectedCode) return;
    if (selectedCode === CANCELLATION_REASON_HORARIO_INCORRECTO) {
      setStep("horario_offer");
      return;
    }
    if (selectedCode === CANCELLATION_REASON_YA_NO_LA_NECESITO) {
      setStep("ya_no_need_offer");
      return;
    }
    onConfirmCancel(selectedCode);
    handleClose();
  };

  const handleHorarioOfferYes = () => {
    handleClose();
    onChooseReschedule();
  };

  const handleHorarioOfferNo = () => {
    if (selectedCode) {
      onConfirmCancel(selectedCode);
      handleClose();
    }
  };

  const handleYaNoNeedContinue = () => {
    if (selectedCode) {
      onConfirmCancel(selectedCode);
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          {step === "reason" && (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Ayúdanos a mejorar.
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Elige el motivo de cancelación
              </Text>
              <ScrollView
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContent}
                showsVerticalScrollIndicator={false}
              >
                {reasons.map(({ code, label }) => {
                  const selected = selectedCode === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.input,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleSelectReason(code)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>
                    Volver
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: selectedCode ? colors.primary : colors.muted,
                      opacity: selectedCode ? 1 : 0.6,
                    },
                  ]}
                  onPress={handleConfirmCancelation}
                  disabled={!selectedCode || isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.confirmBtnText, { color: selectedCode ? colors.primaryForeground : colors.foreground }]}>
                      Confirmar Cancelación
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
          {step === "horario_offer" && (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>
                ¿Quieres que busquemos otra?
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                ¿Quieres que rechacemos esta cita y busquemos otra automáticamente?
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleHorarioOfferYes}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                  Sí, volver a buscar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleHorarioOfferNo}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                  No, cancelar todo
                </Text>
              </TouchableOpacity>
            </>
          )}
          {step === "ya_no_need_offer" && (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>
                ¡Entendido!
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Nos alegra que lo hayas resuelto. ¿Quieres pausar tus alertas para este servicio?
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                (Próximamente)
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleYaNoNeedContinue}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                  Continuar
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  hint: {
    fontSize: 13,
    marginBottom: 16,
  },
  chipsScroll: {
    maxHeight: 280,
  },
  chipsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
