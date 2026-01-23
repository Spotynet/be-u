import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useRouter} from "expo-router";

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsMenu({visible, onClose}: SettingsMenuProps) {
  const {colors, colorMode, setColorMode} = useThemeVariant();
  const {logout} = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleOptionPress = (option: string) => {
    onClose();
    // Aquí puedes agregar navegación a las diferentes pantallas según la opción
    switch (option) {
      case "agenda":
        router.push("/agenda");
        break;
      case "password":
        // router.push("/change-password");
        console.log("Cambiar contraseña");
        break;
      case "notifications":
        // router.push("/notifications-settings");
        console.log("Notificaciones");
        break;
      case "privacy":
        // router.push("/privacy-security");
        console.log("Privacidad y Seguridad");
        break;
      case "help":
        // router.push("/help-support");
        console.log("Ayuda y Soporte");
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

            {/* Change Password */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => handleOptionPress("password")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#8b5cf6" + "15"}]}>
                  <Ionicons name="lock-closed" color="#8b5cf6" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  Cambiar Contraseña
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
                Be-U App v1.0.0
              </Text>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </View>
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
});

