import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useUserProfile} from "@/features/users/hooks/useUserProfile";
import {ProfileTabs, SettingsMenu} from "@/components/profile";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useState, useRef, useEffect} from "react";
import * as ImagePicker from "expo-image-picker";
import {profileCustomizationApi} from "@/lib/api";
import AddressAutocomplete from "@/components/address/AddressAutocomplete";
import {getSubCategoryById, MAIN_CATEGORIES, getAvatarColorFromSubcategory} from "@/constants/categories";

export default function Perfil() {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated, logout: authLogout} = useAuth();
  const {profile, stats, services, portfolio, teamMembers, isLoading, error, refreshProfile} =
    useUserProfile();

  // State for personalizar perfil expansion
  const [isPersonalizarExpanded, setIsPersonalizarExpanded] = useState(false);
  // State for settings menu
  const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);
  
  // Reset expansion state if user is not a provider
  useEffect(() => {
    const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";
    if (!isProvider) {
      setIsPersonalizarExpanded(false);
    }
  }, [user?.role]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [uploading, setUploading] = useState(false);
  const [profileImages, setProfileImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);
  const [publicProfileId, setPublicProfileId] = useState<number | null>(null);
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [addressValues, setAddressValues] = useState<{
    address: string;
    city?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
  }>({address: ""});

  // Fetch profile images and PublicProfile data
  const fetchProfileImages = async () => {
    try {
      setImagesLoading(true);
      const response = await profileCustomizationApi.getProfileImages();
      // The new endpoint returns a PublicProfile object with images array
      setProfileImages(response.data?.images || []);
      
      // Also update PublicProfile data for category/subcategory display
      if (response.data?.id) {
        setPublicProfileId(response.data.id as number);
        setPublicProfile(response.data);
        console.log("📋 Updated PublicProfile - Category:", response.data.category);
        console.log("📋 Updated PublicProfile - Sub categories:", response.data.sub_categories);
      }

      // If this was a newly created profile, show a message
      if (response.data?.name && response.data?.images?.length === 0) {
        console.log("New PublicProfile created automatically");
        setProfileCreated(true);
        // Hide the message after 3 seconds
        setTimeout(() => setProfileCreated(false), 3000);
      }
    } catch (error) {
      console.error("Error fetching profile images:", error);
      // If there's still an error after auto-creation, set empty array
      setProfileImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  // Removed image loading effect since we're navigating to separate pages

  // Ensure we have the PublicProfile id available for preview navigation and category display
  useEffect(() => {
    const fetchPublicProfileId = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const res = await profileCustomizationApi.getProfileImages();
        console.log("📋 PublicProfile data received:", JSON.stringify(res?.data, null, 2));
        if (res?.data?.id) {
          setPublicProfileId(res.data.id as number);
          setPublicProfile(res.data); // Store full PublicProfile data
          console.log("📋 Category:", res.data.category);
          console.log("📋 Sub categories:", res.data.sub_categories);
          console.log("📋 Profile type:", res.data.profile_type);
        } else {
          console.log("📋 No PublicProfile ID found in response");
        }
      } catch (e) {
        console.log("📋 No PublicProfile yet for preview", e);
        setPublicProfile(null);
      }
    };
    fetchPublicProfileId();
  }, [isAuthenticated, user?.id]);

  const handleLogout = async () => {
    try {
      await authLogout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string, role?: string, placeName?: string) => {
    // For PLACE, use first 2 chars of place name
    if (role === "PLACE") {
      const name = placeName || firstName || "U";
      if (name.length >= 2) {
        return name.substring(0, 2).toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    // For PROFESSIONAL, use first 2 chars of firstName
    if (role === "PROFESSIONAL") {
      if (firstName && firstName.length >= 2) {
        return firstName.substring(0, 2).toUpperCase();
      }
      return firstName?.charAt(0).toUpperCase() || "U";
    }
    // For CLIENT, use first and last name initials
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  const requestPermissions = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería para subir imágenes.", [
        {text: "OK"},
      ]);
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const formData = new FormData();

        if (Platform.OS === "web") {
          // On web, convert URI to Blob/File object
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const mimeType = blob.type || "image/jpeg";
          const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
          const file = new File([blob], `profile_image_${Date.now()}.${ext}`, {type: mimeType});
          formData.append("image", file);
        } else {
          // On native, use the React Native file descriptor
          const uriParts = result.assets[0].uri.split(".");
          const fileType = uriParts[uriParts.length - 1] || "jpg";
          const rnFile = {
            uri: result.assets[0].uri,
            type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
            name: `profile_image_${Date.now()}.${fileType}`,
          } as any;
          formData.append("image", rnFile);
        }

        const response = await profileCustomizationApi.uploadProfileImage(formData);
        // Update images directly from response
        setProfileImages(response.data?.images || []);
        Alert.alert("Éxito", "Imagen subida correctamente");
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert("Error", "No se pudo subir la imagen. Inténtalo de nuevo.");
      } finally {
        setUploading(false);
      }
    }
  };

  const displayName = user
    ? user.role === "CLIENT"
      ? `${user.firstName || "Usuario"} ${user.lastName || ""}`.trim()
      : user.role === "PLACE"
      ? (profile as any)?.name || user.firstName || "Usuario"
      : user.firstName || "Usuario"
    : "Usuario";

  // Get avatar color based on subcategory, fallback to primary color
  const avatarColor =
    publicProfile?.category && publicProfile?.sub_categories?.length > 0
      ? getAvatarColorFromSubcategory(publicProfile.category, publicProfile.sub_categories)
      : colors.primary;

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 8, 16),
            },
          ]}>
        {/* Row 1: avatar + name/role + settings icon */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerProfile}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={() => router.push("/settings")}
                activeOpacity={0.7}>
                <View style={[styles.headerAvatar, {backgroundColor: avatarColor}]}> 
                {(profile as any)?.photo ? (
                  <Image source={{uri: (profile as any).photo}} style={styles.headerAvatarImage} />
              ) : (
              <Text style={styles.headerAvatarText}>
                {getInitials(user?.firstName, user?.lastName, user?.firstName, user?.role, (profile as any)?.name)}
              </Text>
              )}
                </View>
                {/* Edit icon overlay - always visible with transparency */}
                <View style={styles.avatarEditOverlay}>
                 
                    <Ionicons name="pencil" color="#ffffff" size={16} />
                  
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.headerTextContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, {color: colors.foreground}]}>{displayName}</Text>
              {/* Settings Icon - Positioned right after the name */}
              <TouchableOpacity
                onPress={() => setIsSettingsMenuVisible(true)}
                style={styles.settingsIconButton}
                activeOpacity={0.7}>
                <View style={[styles.settingsIconContainer, {backgroundColor: colors.card}]}>
                  <Ionicons name="settings" color={colors.primary} size={22} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerRole, {color: colors.mutedForeground}]}>
              {user?.role === "PROFESSIONAL"
                ? "Profesional"
                : user?.role === "PLACE"
                ? "Establecimiento"
                : user?.role === "CLIENT"
                ? "Cliente"
                : "Usuario"}
            </Text>
            {/* Category and Subcategory - Only show for PROFESSIONAL and PLACE */}
            {(user?.role === "PROFESSIONAL" || user?.role === "PLACE") && (
              <View style={styles.headerCategoryContainer}>
                {publicProfile?.category && (Array.isArray(publicProfile.category) ? publicProfile.category.length > 0 : publicProfile.category) ? (
                  <View style={styles.headerCategoryTags}>
                    {(Array.isArray(publicProfile.category) ? publicProfile.category : [publicProfile.category]).map((catId: string, idx: number) => {
                      const category = MAIN_CATEGORIES.find((c) => c.id === catId);
                      return category ? (
                        <View
                          key={idx}
                          style={[styles.headerCategoryTag, {backgroundColor: colors.primary + "20", borderColor: colors.primary + "40"}]}>
                          <Text style={[styles.headerCategoryTagText, {color: colors.primary}]}>
                            {category.name}
                          </Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                ) : (
                  <Text style={[styles.headerCategory, {color: colors.mutedForeground, fontStyle: "italic"}]}>
                    Sin categoría
                  </Text>
                )}
                {publicProfile?.sub_categories && publicProfile.sub_categories.length > 0 ? (
                  <View style={styles.headerSubcategoryContainer}>
                    {publicProfile.sub_categories.map((subId: string, idx: number) => {
                      // Find the category that contains this subcategory
                      const categories = Array.isArray(publicProfile.category) 
                        ? publicProfile.category 
                        : publicProfile.category ? [publicProfile.category] : [];
                      let subCategory = null;
                      for (const catId of categories) {
                        subCategory = getSubCategoryById(catId, subId);
                        if (subCategory) break;
                      }
                      return subCategory ? (
                        <View
                          key={idx}
                          style={[styles.headerSubcategoryTag, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                          <Text style={[styles.headerSubcategoryTagText, {color: colors.mutedForeground}]}>
                            {subCategory.name}
                          </Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                ) : publicProfile && (
                  <Text style={[styles.headerSubcategory, {color: colors.mutedForeground, fontStyle: "italic"}]}>
                    Sin subcategoría
                  </Text>
                )}
              </View>
            )}
            </View>
          </View>
        </View>

        {/* Row 2: action buttons + settings (moved here for better visibility on devices) */}
        <View style={styles.headerActionRow}>
              {/* Personalizar Perfil Button - Only show for PROFESSIONAL and PLACE */}
              {(user?.role === "PROFESSIONAL" || user?.role === "PLACE") && (
                <View style={styles.personalizarButtonContainer}>
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
                      size={14}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Ver como cliente Button - Only show for PROFESSIONAL and PLACE roles */}
              {(user?.role === "PROFESSIONAL" || user?.role === "PLACE") && (
              <TouchableOpacity
                style={[styles.previewButton, {borderColor: colors.primary, borderWidth: 1}]}
                onPress={() => {
                  // Navigate to unified public profile preview
                  console.log("Preview public profile pressed");
                  const publicId = publicProfileId;
                  console.log("Public profile ID:", publicId);
                  if (!publicId) {
                    Alert.alert(
                      "Perfil no disponible",
                      "No pudimos encontrar tu perfil público aún. Intenta recargar el perfil o vuelve más tarde."
                    );
                    return;
                  }

                  const href = `/profile/${publicId}`;
                  try {
                    router.push(href as any);
                  } catch (e) {
                    console.warn("router.push string failed, trying object form", e);
                    try {
                      router.push({pathname: "/profile/[id]", params: {id: String(publicId)}});
                    } catch (e2) {
                      console.error("Navigation error to public profile", e2);
                    }
                  }
                }}
                activeOpacity={0.8}>
                <Ionicons name="eye-outline" color={colors.primary} size={14} />
                <Text style={[styles.previewButtonText, {color: colors.primary}]}>Ver como cliente</Text>
              </TouchableOpacity>
              )}
        </View>
        {/* Row 3: (reserved for future/status line) */}
        <View style={styles.headerActions} />
      </View>

      {/* Personalizar Perfil Section - Only show when expanded and user is PROFESSIONAL or PLACE */}
      {isPersonalizarExpanded && (user?.role === "PROFESSIONAL" || user?.role === "PLACE") && (
        <View style={[styles.personalizarSection, {backgroundColor: colors.card}]}>
          {/* Modern Header with Icon */}
          <View style={styles.personalizarHeader}>
            <View style={[styles.personalizarIconContainer, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name="brush" color={colors.primary} size={24} />
            </View>
            <View style={styles.personalizarHeaderText}>
              <Text style={[styles.personalizarTitle, {color: colors.foreground}]}>
                Personalizar Perfil
              </Text>
              <Text style={[styles.personalizarSubtitle, {color: colors.mutedForeground}]}>
                Personaliza tu presencia en la plataforma
              </Text>
            </View>
          </View>

          {/* Vertical Tab Cards Design */}
          <View style={styles.personalizarTabsVertical}>
            <TouchableOpacity
              style={[
                styles.personalizarTabCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                // Navigate to images management page
                router.push("/profile/images");
              }}
              activeOpacity={0.8}>
              <View
                style={[
                  styles.personalizarTabIconWrapper,
                  {
                    backgroundColor: colors.muted,
                  },
                ]}>
                <Ionicons
                  name="images"
                  color={colors.mutedForeground}
                  size={24}
                />
              </View>
              <View style={styles.personalizarTabCardContent}>
                <Text
                  style={[
                    styles.personalizarTabCardTitle,
                    {
                      color: colors.foreground,
                      fontWeight: "600",
                    },
                  ]}>
                  Imágenes
                </Text>
                <Text
                  style={[
                    styles.personalizarTabCardDescription,
                    {color: colors.mutedForeground},
                  ]}>
                  Gestiona tu galería de fotos
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                color={colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>

            {/* Equipo / Profesionales vinculados - Only for PLACE */}
            {user?.role === "PLACE" && (
              <TouchableOpacity
                style={[
                  styles.personalizarTabCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push("/links")}
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.personalizarTabIconWrapper,
                    {
                      backgroundColor: colors.muted,
                    },
                  ]}>
                  <Ionicons
                    name="people"
                    color={colors.mutedForeground}
                    size={24}
                  />
                </View>
                <View style={styles.personalizarTabCardContent}>
                  <Text
                    style={[
                      styles.personalizarTabCardTitle,
                      {
                        color: colors.foreground,
                        fontWeight: "600",
                      },
                    ]}>
                    Equipo
                  </Text>
                  <Text
                    style={[
                      styles.personalizarTabCardDescription,
                      {color: colors.mutedForeground},
                    ]}>
                    Vincula profesionales a tu establecimiento
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  color={colors.mutedForeground}
                  size={20}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.personalizarTabCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push("/profile/services")}
              activeOpacity={0.8}>
              <View
                style={[
                  styles.personalizarTabIconWrapper,
                  {
                    backgroundColor: colors.muted,
                  },
                ]}>
                <Ionicons
                  name="briefcase"
                  color={colors.mutedForeground}
                  size={24}
                />
              </View>
              <View style={styles.personalizarTabCardContent}>
                <Text
                  style={[
                    styles.personalizarTabCardTitle,
                    {
                      color: colors.foreground,
                      fontWeight: "600",
                    },
                  ]}>
                  Servicios
                </Text>
                <Text
                  style={[
                    styles.personalizarTabCardDescription,
                    {color: colors.mutedForeground},
                  ]}>
                  Administra tus servicios
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                color={colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.personalizarTabCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push("/availability")}
              activeOpacity={0.8}>
              <View
                style={[
                  styles.personalizarTabIconWrapper,
                  {
                    backgroundColor: colors.muted,
                  },
                ]}>
                <Ionicons
                  name="calendar"
                  color={colors.mutedForeground}
                  size={24}
                />
              </View>
              <View style={styles.personalizarTabCardContent}>
                <Text
                  style={[
                    styles.personalizarTabCardTitle,
                    {
                      color: colors.foreground,
                      fontWeight: "600",
                    },
                  ]}>
                  Disponibilidad
                </Text>
                <Text
                  style={[
                    styles.personalizarTabCardDescription,
                    {color: colors.mutedForeground},
                  ]}>
                  Configura tus horarios
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                color={colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

        {/* Profile Tabs */}
        <View style={styles.tabsContainer}>
          <ProfileTabs userRole={user.role as "CLIENT" | "PROFESSIONAL" | "PLACE"} />
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEditOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  avatarEditIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
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
  headerRole: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
  },
  headerCategoryContainer: {
    marginTop: 8,
    gap: 6,
  },
  headerCategoryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  headerCategoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerCategoryTagText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  headerCategory: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  headerSubcategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  headerSubcategoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerSubcategoryTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  headerSubcategory: {
    fontSize: 11,
    fontWeight: "400",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  smallHeaderButton: {
    padding: 6,
    marginLeft: 8,
    marginRight: 12,
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
    width: "100%",
  },
  personalizarButtonContainer: {
    position: "relative",
    alignSelf: "flex-start",
  },
  personalizarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    minHeight: 36,
    width: "auto",
  },
  personalizarButtonActive: {
    backgroundColor: "#6d28d9", // Slightly darker purple when active
  },
  personalizarButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 2,
    flexShrink: 1,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    backgroundColor: "transparent",
  },
  previewButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  personalizarSection: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  personalizarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  personalizarIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  personalizarHeaderText: {
    flex: 1,
  },
  personalizarTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  personalizarSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  personalizarTabsVertical: {
    gap: 12,
    marginBottom: 24,
  },
  personalizarTabCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  personalizarTabCardActive: {
    ...Platform.select({
      ios: {
        shadowColor: "#8b5cf6",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  personalizarTabIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  personalizarTabCardContent: {
    flex: 1,
    gap: 4,
  },
  personalizarTabCardTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  personalizarTabCardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  personalizarContent: {
    minHeight: 200,
    marginTop: 8,
  },
  personalizarCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(139, 92, 246, 0.15)",
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#8b5cf6",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  personalizarCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  personalizarCardDescription: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 22,
    color: "#6b7280",
    fontWeight: "400",
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
  imageGallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  imageItem: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  deleteImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#8b5cf6",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addImageButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#8b5cf6",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  manageButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  settingsIconButton: {
    padding: 4,
  },
  settingsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
});
