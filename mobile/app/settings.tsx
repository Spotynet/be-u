import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useUserProfile, useProfileUpdate} from "@/features/users";
import {useRouter, Redirect} from "expo-router";
import {useNavigation} from "@/hooks/useNavigation";
import {
  ClientSettingsForm,
  ProfessionalSettingsForm,
  PlaceSettingsForm,
} from "@/components/settings";

export default function Settings() {
  const colorScheme = useColorScheme();
  const {colors, colorMode, setColorMode} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {goBack} = useNavigation();
  const {user, isAuthenticated, logout} = useAuth();
  const {profile, isLoading: profileLoading, refreshProfile} = useUserProfile();
  const {updateProfile, isLoading: updating} = useProfileUpdate(user?.id || 0, user?.role || "");

  const handleSave = async (userData: any, profileData: any) => {
    try {
      await updateProfile(profileData, userData);
      // Refresh profile data after successful update
      refreshProfile();
    } catch (error) {
      // Error is already handled in the hook
      console.error("Error updating profile:", error);
    }
  };

  const handleLogout = () => {
    console.log("🔓 Logout button pressed");

    // For testing, let's try direct logout without confirmation
    const performLogout = async () => {
      try {
        console.log("🔓 Starting logout process...");
        console.log("🔓 Current user before logout:", user);
        console.log("🔓 Is authenticated before logout:", isAuthenticated);

        await logout();

        console.log("🔓 Logout successful, navigating to login...");
        console.log("🔓 User after logout:", user);
        console.log("🔓 Is authenticated after logout:", isAuthenticated);

        // Try different navigation methods
        try {
          router.replace("/login");
        } catch (navError) {
          console.log("🔓 Router replace failed, trying push:", navError);
          router.push("/login");
        }
      } catch (error) {
        console.error("🔓 Logout error:", error);
        // Still navigate to login even if logout fails
        try {
          router.replace("/login");
        } catch (navError) {
          console.log("🔓 Router replace failed, trying push:", navError);
          router.push("/login");
        }
      }
    };

    // Try direct logout first for testing
    performLogout();

    // Uncomment this for confirmation dialog:
    /*
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: performLogout,
        },
      ],
      {cancelable: true}
    );
    */
  };

  // Redirect if not authenticated (safe for web and native)
  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  // Show loading state
  if (profileLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/(tabs)/perfil")}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Configuración</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando configuración...
          </Text>
        </View>
      </View>
    );
  }

  // Render appropriate form based on user role
  const renderSettingsForm = () => {
    console.log("User object:", user);
    console.log("Profile object:", profile);
    console.log("User role:", user?.role);
    console.log("Role type:", typeof user?.role);

    switch (user?.role) {
      case "CLIENT":
        return (
          <ClientSettingsForm
            user={user}
            profile={profile as any}
            onSave={handleSave}
            isLoading={updating}
          />
        );
      case "PROFESSIONAL":
        return (
          <ProfessionalSettingsForm
            user={user}
            profile={profile as any}
            onSave={handleSave}
            isLoading={updating}
          />
        );
      case "PLACE":
        return (
          <PlaceSettingsForm
            user={user}
            profile={profile as any}
            onSave={handleSave}
            isLoading={updating}
          />
        );
      default:
        return (
          <View style={[styles.errorCard, {backgroundColor: colors.card}]}>
            <Ionicons name="alert-circle" color="#ef4444" size={48} />
            <Text style={[styles.errorText, {color: colors.foreground}]}>
              Tipo de usuario no reconocido
            </Text>
            <Text
              style={[
                styles.errorText,
                {color: colors.mutedForeground, fontSize: 12, marginTop: 8},
              ]}>
              Role: {user?.role || "undefined"} (Type: {typeof user?.role})
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: Math.max(insets.top + 16, 20),
        },
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Configuración</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Settings Form */}
          {renderSettingsForm()}

          {/* Additional Options */}
          <View style={styles.additionalOptions}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Opciones</Text>

            {/* Light/Dark Mode Toggle */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              onPress={() => setColorMode(colorMode === "light" ? "dark" : "light")}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: colors.primary + "15"}]}>
                  <Ionicons
                    name={colorMode === "light" ? "sunny" : "moon"}
                    color={colors.primary}
                    size={20}
                  />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>
                  {colorMode === "light" ? "Modo Oscuro" : "Modo Claro"}
                </Text>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  {backgroundColor: colorMode === "dark" ? colors.primary : colors.muted},
                ]}>
                <View style={[styles.toggleThumb, {backgroundColor: "#ffffff"}]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
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

            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#3b82f6" + "15"}]}>
                  <Ionicons name="notifications" color="#3b82f6" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>Notificaciones</Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
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

            <TouchableOpacity
              style={[
                styles.optionButton,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, {backgroundColor: "#f59e0b" + "15"}]}>
                  <Ionicons name="help-circle" color="#f59e0b" size={20} />
                </View>
                <Text style={[styles.optionText, {color: colors.foreground}]}>Ayuda y Soporte</Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, {backgroundColor: "#ef4444"}]}
              onPress={() => {
                console.log("🔓 Logout button onPress triggered");
                handleLogout();
              }}
              activeOpacity={0.9}>
              <Ionicons name="log-out" color="#ffffff" size={20} />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, {color: colors.mutedForeground}]}>
              Be-U App v1.0.0
            </Text>
          </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  additionalOptions: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 13,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
