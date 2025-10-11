import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useUserProfile} from "@/features/users/hooks/useUserProfile";
import {ClientProfileView, ProfessionalProfileView, PlaceProfileView} from "@/components/profile";
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

  // Render appropriate profile based on user role
  const renderProfileContent = () => {
    if (!user) return null;

    switch (user.role) {
      case "CLIENT":
        return <ClientProfileView user={user} profile={profile} stats={stats} />;
      case "PROFESSIONAL":
        return (
          <ProfessionalProfileView
            user={user}
            profile={profile}
            stats={stats}
            services={services}
            portfolio={portfolio}
          />
        );
      case "PLACE":
        return (
          <PlaceProfileView
            user={user}
            profile={profile}
            stats={stats}
            services={services}
            teamMembers={teamMembers}
          />
        );
      default:
        return <ClientProfileView user={user} profile={profile} stats={stats} />;
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {backgroundColor: colors.background, borderBottomColor: colors.border},
          ]}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Perfil</Text>
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
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Perfil</Text>
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
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Perfil</Text>
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
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Perfil</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}>
            <Ionicons name="settings-outline" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Content */}
      {renderProfileContent()}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 8,
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
