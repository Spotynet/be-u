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
import {useRef, useEffect, useState} from "react";
import {
  ClientSettingsForm,
  ProfessionalSettingsForm,
  PlaceSettingsForm,
} from "@/components/settings";
import {SettingsMenu} from "@/components/profile";
import {CalendarConnectionCard} from "@/features/calendar";

export default function Settings({embedded = false}: {embedded?: boolean} = {}) {
  const colorScheme = useColorScheme();
  const {colors, colorMode, setColorMode} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {goBack} = useNavigation();
  const {user, isAuthenticated, logout, refreshToken} = useAuth();
  const {profile, isLoading: profileLoading, refreshProfile} = useUserProfile();
  const {updateProfile, isLoading: updating} = useProfileUpdate(user?.id || 0, user?.role || "");
  const formRef = useRef<{save: () => Promise<void>} | null>(null);
  const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);

  // Redirect to /perfil if accessed directly (not embedded)
  if (!embedded) {
    return <Redirect href="/(tabs)/perfil" />;
  }

  // Reset ref when user role changes
  useEffect(() => {
    formRef.current = null;
  }, [user?.role]);

  const handleSave = async (userData: any, profileData: any) => {
    try {
      const result = await updateProfile(profileData, userData);
      // Refresh profile data after successful update
      await refreshProfile();
      // Refresh auth token to get updated user data (including username and image)
      if (refreshToken) {
        await refreshToken();
      }
      // Small delay to ensure backend has processed everything
      await new Promise(resolve => setTimeout(resolve, 300));
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
        {!embedded && (
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
        )}
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
            ref={formRef}
            user={user}
            profile={profile as any}
            onSave={handleSave}
            isLoading={updating}
          />
        );
      case "PROFESSIONAL":
        return (
          <>
            <ProfessionalSettingsForm
              ref={formRef}
              user={user}
              profile={profile as any}
              onSave={handleSave}
              isLoading={updating}
            />
            {/* Google Calendar Integration */}
            <View style={styles.calendarSection}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                Integración de Calendario
              </Text>
              <CalendarConnectionCard />
            </View>
          </>
        );
      case "PLACE":
        return (
          <>
            <PlaceSettingsForm
              ref={formRef}
              user={user}
              profile={profile as any}
              onSave={handleSave}
              isLoading={updating}
            />
            {/* Google Calendar Integration */}
            <View style={styles.calendarSection}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                Integración de Calendario
              </Text>
              <CalendarConnectionCard />
            </View>
          </>
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
      {!embedded && (
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Configuración</Text>
          <TouchableOpacity
            style={styles.settingsIconButton}
            onPress={() => setIsSettingsMenuVisible(true)}
            activeOpacity={0.7}>
            <View style={[styles.settingsIconContainer, {backgroundColor: colors.card}]}>
              <Ionicons name="settings" color={colors.primary} size={22} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{paddingBottom: 100}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Settings Form */}
          {renderSettingsForm()}

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, {color: colors.mutedForeground}]}>
              nabbi App v1.3.10
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <View 
        style={[
          styles.floatingButtonContainer, 
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom || 20,
          }
        ]}>
        <TouchableOpacity
          style={[styles.saveButton, {backgroundColor: colors.primary}]}
          onPress={async () => {
            if (formRef.current && typeof formRef.current.save === "function") {
              await formRef.current.save();
            }
          }}
          disabled={updating || profileLoading}
          activeOpacity={0.8}>
          {updating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" color="#ffffff" size={20} />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Settings Menu Modal */}
      <SettingsMenu
        visible={isSettingsMenuVisible}
        onClose={() => setIsSettingsMenuVisible(false)}
      />
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
  headerSpacer: {
    width: 40,
  },
  settingsIconButton: {
    padding: 4,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  versionContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 13,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
    calendarSection: {
    marginTop: 24,
    marginHorizontal: -16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginHorizontal: 16,
  },
});
