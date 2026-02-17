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

interface CancellationSuccessModalProps {
  visible: boolean;
  onGoBack: () => void;
}

export function CancellationSuccessModal({
  visible,
  onGoBack,
}: CancellationSuccessModalProps) {
  const { colors } = useThemeVariant();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onGoBack}
    >
      <Pressable style={styles.overlay} onPress={onGoBack}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + "25" }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Entendido. Hemos liberado tu lugar.
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Nabbi queda en modo de espera para cuando nos necesites de nuevo.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onGoBack}
            activeOpacity={0.85}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              Volver al Inicio
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
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignSelf: "stretch",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
