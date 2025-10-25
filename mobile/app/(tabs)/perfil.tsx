import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useUserProfile} from "@/features/users/hooks/useUserProfile";
import {ProfileTabs} from "@/components/profile";
import {useRouter} from "expo-router";
import {useState, useRef} from "react";

export default function Perfil() {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user, isAuthenticated, logout: authLogout} = useAuth();
  const {profile, stats, services, portfolio, teamMembers, isLoading, error, refreshProfile} =
    useUserProfile();

  // State for personalizar perfil expansion
  const [isPersonalizarExpanded, setIsPersonalizarExpanded] = useState(false);
  const [activePersonalizarTab, setActivePersonalizarTab] = useState<
    "imagenes" | "servicios" | "disponibilidad"
  >("imagenes");
  const slideAnim = useRef(new Animated.Value(0)).current;

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
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>{displayName}</Text>
            {/* Personalizar Perfil Button */}
            <TouchableOpacity
              style={[
                styles.personalizarButton,
                {backgroundColor: colors.primary},
                isPersonalizarExpanded && styles.personalizarButtonActive,
              ]}
              onPress={() => setIsPersonalizarExpanded(!isPersonalizarExpanded)}
              activeOpacity={0.8}>
              <Ionicons name="settings" color="#ffffff" size={16} />
              <Text style={styles.personalizarButtonText}>Personalizar Perfil</Text>
              <Ionicons
                name={isPersonalizarExpanded ? "chevron-up" : "chevron-down"}
                color="#ffffff"
                size={16}
              />
            </TouchableOpacity>
          </View>
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

      {/* Personalizar Perfil Section - Only show when expanded */}
      {isPersonalizarExpanded && (
        <View style={[styles.personalizarSection, {backgroundColor: colors.card}]}>
          <Text style={[styles.personalizarTitle, {color: colors.foreground}]}>
            Personalizar Perfil
          </Text>

          {/* Personalizar Sub-tabs */}
          <View style={[styles.personalizarTabs, {backgroundColor: colors.background}]}>
            <TouchableOpacity
              style={[
                styles.personalizarTab,
                activePersonalizarTab === "imagenes" && [
                  styles.personalizarTabActive,
                  {borderBottomColor: colors.primary},
                ],
              ]}
              onPress={() => setActivePersonalizarTab("imagenes")}>
              <Ionicons
                name="images"
                color={
                  activePersonalizarTab === "imagenes" ? colors.primary : colors.mutedForeground
                }
                size={20}
              />
              <Text
                style={[
                  styles.personalizarTabText,
                  {
                    color:
                      activePersonalizarTab === "imagenes"
                        ? colors.primary
                        : colors.mutedForeground,
                  },
                ]}>
                Imágenes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.personalizarTab,
                activePersonalizarTab === "servicios" && [
                  styles.personalizarTabActive,
                  {borderBottomColor: colors.primary},
                ],
              ]}
              onPress={() => setActivePersonalizarTab("servicios")}>
              <Ionicons
                name="briefcase"
                color={
                  activePersonalizarTab === "servicios" ? colors.primary : colors.mutedForeground
                }
                size={20}
              />
              <Text
                style={[
                  styles.personalizarTabText,
                  {
                    color:
                      activePersonalizarTab === "servicios"
                        ? colors.primary
                        : colors.mutedForeground,
                  },
                ]}>
                Servicios
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.personalizarTab,
                activePersonalizarTab === "disponibilidad" && [
                  styles.personalizarTabActive,
                  {borderBottomColor: colors.primary},
                ],
              ]}
              onPress={() => setActivePersonalizarTab("disponibilidad")}>
              <Ionicons
                name="calendar"
                color={
                  activePersonalizarTab === "disponibilidad"
                    ? colors.primary
                    : colors.mutedForeground
                }
                size={20}
              />
              <Text
                style={[
                  styles.personalizarTabText,
                  {
                    color:
                      activePersonalizarTab === "disponibilidad"
                        ? colors.primary
                        : colors.mutedForeground,
                  },
                ]}>
                Disponibilidad
              </Text>
            </TouchableOpacity>
          </View>

          {/* Personalizar Content */}
          <View style={styles.personalizarContent}>
            {activePersonalizarTab === "imagenes" && (
              <View style={styles.personalizarCard}>
                <Text style={[styles.personalizarCardTitle, {color: colors.foreground}]}>
                  Galería de Imágenes (0/10)
                </Text>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Agrega imágenes de tu trabajo para mostrar a los clientes
                </Text>
                <View style={styles.imageGalleryPlaceholder}>
                  <Ionicons name="image-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.placeholderText, {color: colors.mutedForeground}]}>
                    No hay imágenes
                  </Text>
                  <Text style={[styles.placeholderSubtext, {color: colors.mutedForeground}]}>
                    Agrega imágenes de tu trabajo para atraer más clientes
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addImageButton, {backgroundColor: colors.primary}]}
                  activeOpacity={0.8}>
                  <Ionicons name="camera" color="#ffffff" size={20} />
                  <Text style={styles.addImageButtonText}>Agregar Primera Imagen</Text>
                </TouchableOpacity>
              </View>
            )}

            {activePersonalizarTab === "servicios" && (
              <View style={styles.personalizarCard}>
                <Text style={[styles.personalizarCardTitle, {color: colors.foreground}]}>
                  Mis Servicios
                </Text>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Gestiona los servicios que ofreces
                </Text>
                <TouchableOpacity
                  style={[styles.manageButton, {backgroundColor: colors.primary}]}
                  activeOpacity={0.8}>
                  <Text style={styles.manageButtonText}>Gestionar Servicios</Text>
                  <Ionicons name="chevron-forward" color="#ffffff" size={16} />
                </TouchableOpacity>
              </View>
            )}

            {activePersonalizarTab === "disponibilidad" && (
              <View style={styles.personalizarCard}>
                <Text style={[styles.personalizarCardTitle, {color: colors.foreground}]}>
                  Disponibilidad
                </Text>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Configura tus horarios de trabajo
                </Text>
                <TouchableOpacity
                  style={[styles.manageButton, {backgroundColor: colors.primary}]}
                  activeOpacity={0.8}>
                  <Text style={styles.manageButtonText}>Configurar Horarios</Text>
                  <Ionicons name="chevron-forward" color="#ffffff" size={16} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

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
  // Personalizar Perfil Styles
  headerTextContainer: {
    flex: 1,
  },
  personalizarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  personalizarButtonActive: {
    backgroundColor: "#6d28d9", // Slightly darker purple when active
  },
  personalizarButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  personalizarSection: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  personalizarTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  personalizarTabs: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  personalizarTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  personalizarTabActive: {
    borderBottomWidth: 2,
  },
  personalizarTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  personalizarContent: {
    minHeight: 200,
  },
  personalizarCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
  },
  personalizarCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  personalizarCardDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  imageGalleryPlaceholder: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  addImageButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  manageButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
