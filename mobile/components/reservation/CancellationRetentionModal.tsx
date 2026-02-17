import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";

export type RetentionAction = "reschedule" | "cancel";

interface CancellationRetentionModalProps {
  visible: boolean;
  onClose: () => void;
  onChoose: (action: RetentionAction) => void;
}

export function CancellationRetentionModal({
  visible,
  onClose,
  onChoose,
}: CancellationRetentionModalProps) {
  const { colors } = useThemeVariant();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            ¿Hubo un cambio de planes?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            No te preocupes, esto pasa. ¿Qué prefieres hacer?
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => onChoose("reschedule")}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Buscar otro horario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => onChoose("cancel")}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.foreground} />
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
              Cancelar definitivamente
            </Text>
          </TouchableOpacity>

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
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
