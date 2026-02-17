import {useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useRouter} from "expo-router";
import {authApi, errorUtils} from "@/lib/api";

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsMenu({visible, onClose}: SettingsMenuProps) {
  const {colors, colorMode, setColorMode} = useThemeVariant();
  const {logout} = useAuth();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteModal(false);
      await authApi.deleteMyAccount();
      onClose();
      await logout();
      router.replace("/login");
    } catch (error: any) {
      const message = errorUtils.getErrorMessage(error);
      Alert.alert("Error", message || "No se pudo eliminar la cuenta.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOptionPress = (option: string) => {
    onClose();
    switch (option) {
      case "guardados":
        router.push("/guardados");
        break;
      case "agenda":
        router.push("/agenda");
        break;
      case "notifications":
        router.push("/(tabs)/notificaciones");
        break;
      case "privacy":
        // router.push("/privacy-security");
        console.log("Privacidad y Seguridad");
        break;
      case "help":
        router.push("/help-support");
        break;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />

      {/* Menu Container */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.menu,
            {
              backgroundColor: colors.card,
              shadowColor: "#000",
            },
          ]}>
          {/* Header */}
          <View style={styles.menuHeader}>
            <View style={styles.menuTitleContainer}>
              <View style={[styles.menuIconContainer, {backgroundColor: colors.primary + "15"}]}>
                <Ionicons name="settings" color={colors.primary} size={24} />
              </View>
              <Text style={[styles.menuTitle, {color: colors.foreground}]}>Configuración</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" color={colors.mutedForeground} size={24} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={[styles.divider, {backgroundColor: colors.border}]} />

          {/* Options */}
          <ScrollView 
            style={styles.optionsContainer}
            showsVerticalScrollIndicator={false}>
            {/* Light/Dark Mode Toggle */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => setColorMode(colorMode === "light" ? "dark" : "light")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: colors.primary + "15"}]}>
                  <Ionicons
                    name={colorMode === "light" ? "moon" : "sunny"}
                    color={colors.primary}
                    size={20}
                  />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  {colorMode === "light" ? "Modo Oscuro" : "Modo Claro"}
                </Text>
              </View>
              <Switch
                value={colorMode === "dark"}
                onValueChange={(value) => setColorMode(value ? "dark" : "light")}
                trackColor={{false: colors.muted, true: colors.primary}}
                thumbColor="#ffffff"
              />
            </TouchableOpacity>

            {/* Guardados */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => handleOptionPress("guardados")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#ec4899" + "15"}]}>
                  <Ionicons name="heart" color="#ec4899" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  Guardados
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            {/* View Agenda */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => handleOptionPress("agenda")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#22c55e" + "15"}]}>
                  <Ionicons name="calendar" color="#22c55e" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  Ver agenda
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => handleOptionPress("notifications")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#3b82f6" + "15"}]}>
                  <Ionicons name="notifications" color="#3b82f6" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  Notificaciones
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            {/* Privacy and Security */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => handleOptionPress("privacy")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#10b981" + "15"}]}>
                  <Ionicons name="shield-checkmark" color="#10b981" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  Privacidad y Seguridad
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            {/* Help and Support */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => handleOptionPress("help")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#f59e0b" + "15"}]}>
                  <Ionicons name="help-circle" color="#f59e0b" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  Ayuda y Soporte
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            {/* Eliminar cuenta */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#ef4444" + "15"}]}>
                  <Ionicons name="trash-outline" color="#ef4444" size={20} />
                </View>
                <Text style={[styles.optionText, {color: "#ef4444"}]}>
                  Eliminar cuenta
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            {/* Divider before Logout */}
            <View style={[styles.divider, {backgroundColor: colors.border, marginVertical: 12}]} />

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, {backgroundColor: "#ef4444"}]}
              onPress={handleLogout}
              activeOpacity={0.9}>
              <Ionicons name="log-out" color="#ffffff" size={20} />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <Text style={[styles.versionText, {color: colors.mutedForeground}]}>
                nabbi App v1.3.10
              </Text>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </View>

      {/* Delete account confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}>
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, {backgroundColor: colors.card}]}>
            <TouchableOpacity
              style={styles.deleteModalClose}
              onPress={() => !isDeleting && setShowDeleteModal(false)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <Ionicons name="close" color={colors.foreground} size={24} />
            </TouchableOpacity>
            <Text style={[styles.deleteModalTitle, {color: colors.foreground}]}>
              Eliminar cuenta
            </Text>
            <View style={[styles.deleteModalIconWrap, {backgroundColor: "#ef4444" + "20"}]}>
              <Ionicons name="trash-outline" color="#ef4444" size={48} />
            </View>
            <Text style={[styles.deleteModalWarning, {color: colors.foreground}]}>
              Tenga en cuenta que eliminar su cuenta eliminará permanentemente todo su progreso y datos, y esta acción no se puede revertir.
            </Text>
            <TouchableOpacity
              style={[styles.deleteModalCancelBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              activeOpacity={0.8}>
              <Text style={styles.deleteModalCancelText}>Sigue disfrutando</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteModalConfirmWrap}
              onPress={handleConfirmDelete}
              disabled={isDeleting}
              activeOpacity={0.7}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text style={styles.deleteModalConfirmText}>Borrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menu: {
    borderRadius: 24,
    maxHeight: "85%",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  menuTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  optionsContainer: {
    padding: 20,
    paddingTop: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  deleteModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  deleteModalClose: {
    alignSelf: "flex-end",
    padding: 8,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  deleteModalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  deleteModalWarning: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  deleteModalCancelBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  deleteModalCancelText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteModalConfirmWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteModalConfirmText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },
});

