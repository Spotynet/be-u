import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { authApi, errorUtils } from "@/lib/api";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function DeleteAccountScreen() {
  const { colors } = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que deseas eliminar tu cuenta y todos los datos asociados? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await authApi.deleteMyAccount();
      await logout();
      router.replace("/login");
    } catch (error: any) {
      const message = errorUtils.getErrorMessage(error);
      Alert.alert("Error", message || "No se pudo eliminar la cuenta.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 12),
          },
        ]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isDeleting}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Eliminar cuenta
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <View style={[styles.iconContainer, { backgroundColor: "#ef4444" + "20" }]}>
          <Ionicons name="trash-outline" color="#ef4444" size={48} />
        </View>
        <Text style={[styles.warningTitle, { color: colors.foreground }]}>
          Eliminar tu cuenta
        </Text>
        <Text
          style={[styles.warningText, { color: colors.mutedForeground }]}>
          Se eliminará tu cuenta y todos los datos asociados (perfil, reservas, publicaciones, etc.). Esta acción no se puede deshacer.
        </Text>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: isDeleting ? colors.muted : "#ef4444" },
          ]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          activeOpacity={0.9}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="trash" color="#ffffff" size={20} />
          )}
          <Text style={styles.deleteButtonText}>
            {isDeleting ? "Eliminando..." : "Confirmar eliminar cuenta"}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 12,
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
  headerSpacer: {
    width: 40,
  },
  body: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  warningText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    width: "100%",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
