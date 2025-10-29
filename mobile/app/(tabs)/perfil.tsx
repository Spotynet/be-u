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
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useUserProfile} from "@/features/users/hooks/useUserProfile";
import {ProfileTabs} from "@/components/profile";
import {useRouter} from "expo-router";
import {useState, useRef, useEffect} from "react";
import * as ImagePicker from "expo-image-picker";
import {profileCustomizationApi} from "@/lib/api";

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
  const [uploading, setUploading] = useState(false);
  const [profileImages, setProfileImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);
  const [publicProfileId, setPublicProfileId] = useState<number | null>(null);

  // Fetch profile images
  const fetchProfileImages = async () => {
    try {
      setImagesLoading(true);
      const response = await profileCustomizationApi.getProfileImages();
      // The new endpoint returns a PublicProfile object with images array
      setProfileImages(response.data?.images || []);

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

  // Load profile images when component mounts or when personalizar section opens
  useEffect(() => {
    if (isPersonalizarExpanded && activePersonalizarTab === "imagenes") {
      fetchProfileImages();
    }
  }, [isPersonalizarExpanded, activePersonalizarTab]);

  // Ensure we have the PublicProfile id available for preview navigation
  useEffect(() => {
    const fetchPublicProfileId = async () => {
      try {
        const res = await profileCustomizationApi.getProfileImages();
        if (res?.data?.id) {
          setPublicProfileId(res.data.id as number);
        }
      } catch (e) {
        console.log("No PublicProfile yet for preview", e);
      }
    };
    fetchPublicProfileId();
  }, []);

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
            <Text style={[styles.headerRole, {color: colors.mutedForeground}]}>
              {user?.role === "PROFESSIONAL"
                ? "Profesional"
                : user?.role === "PLACE"
                ? "Establecimiento"
                : user?.role === "CLIENT"
                ? "Cliente"
                : "Usuario"}
            </Text>
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
                <Ionicons name="eye-outline" color={colors.primary} size={16} />
                <Text style={[styles.previewButtonText, {color: colors.primary}]}>
                  Ver como cliente
                </Text>
              </TouchableOpacity>
            )}
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
                  Galería de Imágenes ({profileImages.length}/10)
                </Text>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Agrega imágenes de tu trabajo para mostrar a los clientes
                </Text>

                {profileCreated && (
                  <View
                    style={[
                      styles.successMessage,
                      {backgroundColor: colors.primary + "20", borderColor: colors.primary},
                    ]}>
                    <Ionicons name="checkmark-circle" color={colors.primary} size={20} />
                    <Text style={[styles.successText, {color: colors.primary}]}>
                      ¡Perfil creado automáticamente! Ya puedes subir imágenes.
                    </Text>
                  </View>
                )}

                {imagesLoading ? (
                  <View style={styles.imageGalleryPlaceholder}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={[styles.placeholderText, {color: colors.mutedForeground}]}>
                      Cargando imágenes...
                    </Text>
                  </View>
                ) : profileImages.length > 0 ? (
                  <View style={styles.imageGallery}>
                    {profileImages.map((imageUrl, index) => (
                      <View key={index} style={styles.imageItem}>
                        <Image source={{uri: imageUrl}} style={styles.galleryImage} />
                        <TouchableOpacity
                          style={styles.deleteImageButton}
                          onPress={() => {
                            Alert.alert(
                              "Eliminar imagen",
                              "¿Estás seguro de que quieres eliminar esta imagen?",
                              [
                                {text: "Cancelar", style: "cancel"},
                                {
                                  text: "Eliminar",
                                  style: "destructive",
                                  onPress: async () => {
                                    try {
                                      setUploading(true);
                                      await profileCustomizationApi.deleteProfileImage(index);
                                      // Update images directly
                                      const newImages = [...profileImages];
                                      newImages.splice(index, 1);
                                      setProfileImages(newImages);
                                      Alert.alert("Éxito", "Imagen eliminada correctamente");
                                    } catch (error) {
                                      console.error("Error deleting image:", error);
                                      Alert.alert("Error", "No se pudo eliminar la imagen");
                                    } finally {
                                      setUploading(false);
                                    }
                                  },
                                },
                              ]
                            );
                          }}>
                          <Ionicons name="close-circle" color="#ff4444" size={20} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.imageGalleryPlaceholder}>
                    <Ionicons name="image-outline" color={colors.mutedForeground} size={48} />
                    <Text style={[styles.placeholderText, {color: colors.mutedForeground}]}>
                      No hay imágenes
                    </Text>
                    <Text style={[styles.placeholderSubtext, {color: colors.mutedForeground}]}>
                      Agrega imágenes de tu trabajo para atraer más clientes
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.addImageButton, {backgroundColor: colors.primary}]}
                  onPress={pickImage}
                  activeOpacity={0.8}
                  disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="camera" color="#ffffff" size={20} />
                      <Text style={styles.addImageButtonText}>Agregar Primera Imagen</Text>
                    </>
                  )}
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
                  onPress={() => {
                    // Navigate to service management screen
                    router.push("/profile/services");
                  }}
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
  headerRole: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
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
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
    backgroundColor: "transparent",
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
