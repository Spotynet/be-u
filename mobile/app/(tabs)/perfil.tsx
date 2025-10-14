import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useUserProfile} from "@/features/users/hooks/useUserProfile";
import {ProfileTabs} from "@/components/profile";
import {useRouter} from "expo-router";

export default function Perfil() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated, logout: authLogout} = useAuth();
  const {profile, stats, services, portfolio, teamMembers, isLoading, error, refreshProfile} =
    useUserProfile();

  const handleLogout = async () => {
    try {
      await authLogout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  const displayName = user
    ? `${user.first_name || user.firstName || "Usuario"} ${user.last_name || user.lastName || ""}`
    : "Usuario";

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {backgroundColor: colors.background, borderBottomColor: colors.border},
          ]}>
          <View style={styles.headerProfile}>
            <View style={[styles.headerAvatar, {backgroundColor: colors.primary}]}>
              <Text style={styles.headerAvatarText}>U</Text>
            </View>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>Usuario</Text>
          </View>
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Inicia sesión para ver tu perfil
          </Text>
          <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
            Accede a tu cuenta para gestionar tus reservas, favoritos y más
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, {backgroundColor: colors.primary}]}
            onPress={() => router.push("/login")}
            activeOpacity={0.9}>
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {backgroundColor: colors.background, borderBottomColor: colors.border},
          ]}>
          <View style={styles.headerProfile}>
            <View style={[styles.headerAvatar, {backgroundColor: colors.primary}]}>
              <Text style={styles.headerAvatarText}>U</Text>
            </View>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>Usuario</Text>
          </View>
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando perfil...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {backgroundColor: colors.background, borderBottomColor: colors.border},
          ]}>
          <View style={styles.headerProfile}>
            <View style={[styles.headerAvatar, {backgroundColor: colors.primary}]}>
              <Text style={styles.headerAvatarText}>U</Text>
            </View>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>Usuario</Text>
          </View>
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Error al cargar perfil
          </Text>
          <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={refreshProfile}
            activeOpacity={0.9}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}>
        <View style={styles.headerProfile}>
          <View style={[styles.headerAvatar, {backgroundColor: colors.primary}]}>
            {profile?.photo ? (
              <Image source={{uri: profile.photo}} style={styles.headerAvatarImage} />
            ) : (
              <Text style={styles.headerAvatarText}>
                {getInitials(user?.first_name, user?.last_name)}
              </Text>
            )}
          </View>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>{displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}>
            <Ionicons name="settings-outline" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Tabs */}
      <View style={styles.tabsContainer}>
        <ProfileTabs userRole={user.role as "CLIENT" | "PROFESSIONAL" | "PLACE"} />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  tabsContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
