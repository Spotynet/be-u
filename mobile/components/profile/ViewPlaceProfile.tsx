import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect} from "react";
import {useRouter} from "expo-router";
import {providerApi, profileCustomizationApi, linkApi, PlaceProfessionalLink} from "@/lib/api";
import {PlaceProfile} from "@/types/global";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface ViewPlaceProfileProps {
  placeId: number;
  onClose?: () => void;
}

export const ViewPlaceProfile = ({placeId, onClose}: ViewPlaceProfileProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const [profile, setProfile] = useState<PlaceProfile | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [linkedProfessionals, setLinkedProfessionals] = useState<PlaceProfessionalLink[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlaceData();
  }, [placeId]);

  const loadPlaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load place profile
      const profileResponse = await providerApi.getPlaceProfile(placeId);
      setProfile(profileResponse.data);

      // Load profile customization data
      try {
        const [servicesResponse, imagesResponse, availabilityResponse] = await Promise.all([
          profileCustomizationApi.getCustomServices(),
          profileCustomizationApi.getProfileImages(),
          profileCustomizationApi.getAvailabilitySchedule(),
        ]);

        setServices(servicesResponse.data || []);
        setImages(imagesResponse.data || []);
        setAvailability(availabilityResponse.data || null);
      } catch (customizationError) {
        console.log("Customization data not available:", customizationError);
        // Continue without customization data
      }

      // Load linked professionals
      try {
        // Try to get place user ID from profile
        const placeUserId = (profileResponse.data as any)?.user_id || (profileResponse.data as any)?.user?.id;
        if (placeUserId) {
          // Get place profile ID to use with listPlaceLinks
          const placeProfileId = (profileResponse.data as any)?.id || placeId;
          const linksResponse = await linkApi.listPlaceLinks(placeProfileId, "ACCEPTED");
          setLinkedProfessionals(Array.isArray(linksResponse.data) ? linksResponse.data : []);
        }
      } catch (linksError) {
        console.log("Linked professionals not available:", linksError);
        setLinkedProfessionals([]);
      }
    } catch (err: any) {
      console.error("Error loading place data:", err);
      setError("Error al cargar el perfil del establecimiento");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const placeName = profile?.name || "Establecimiento";
  const fullAddress = profile
    ? `${profile.street} ${profile.number_ext || ""}${
        profile.number_int ? ` Int. ${profile.number_int}` : ""
      }`
    : "Sin dirección";

  const handleBookAppointment = () => {
    if (profile) {
      router.push({
        pathname: "/book-appointment",
        params: {placeId: placeId.toString()},
      });
    }
  };

  const handleCall = () => {
    if (profile?.phone) {
      Alert.alert("Llamar", `¿Deseas llamar a ${placeName}?`, [
        {text: "Cancelar", style: "cancel"},
        {text: "Llamar", onPress: () => console.log("Calling:", profile.phone)},
      ]);
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: "/chat",
      params: {placeId: placeId.toString()},
    });
  };

  const handleViewOnMap = () => {
    if (profile) {
      // Open maps with the place location
      console.log("Opening maps for:", fullAddress);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, styles.centered, {backgroundColor: colors.background}]}>
        <Ionicons name="alert-circle-outline" size={80} color={colors.mutedForeground} />
        <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error al cargar perfil</Text>
        <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
          {error || "No se pudo cargar el perfil del establecimiento"}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: colors.primary}]}
          onPress={loadPlaceData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Close Button */}
      <View style={[styles.header, {backgroundColor: colors.background}]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      {/* Place Header with Corporate Background */}
      <View style={[styles.headerGradient, {backgroundColor: isDark ? "#18181b" : "#f1f5f9"}]}>
        <View style={styles.profileHeader}>
          <View style={styles.horizontalLayout}>
            {/* Enhanced Place Logo */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoWrapper, {backgroundColor: colors.card}]}>
                {profile?.logo ? (
                  <Image source={{uri: profile.logo}} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, {backgroundColor: colors.primary}]}>
                    <Text style={styles.logoText}>{getInitials(placeName)}</Text>
                  </View>
                )}
                {/* Business status ring */}
                <View style={[styles.statusRing, {borderColor: colors.primary}]} />
              </View>
              {/* Business Badge */}
              <View style={[styles.businessBadge, {backgroundColor: "#10b981"}]}>
                <Ionicons name="business" color="#ffffff" size={18} />
              </View>
            </View>

            {/* Place Info */}
            <View style={styles.placeInfo}>
              <Text style={[styles.placeName, {color: colors.foreground}]}>{placeName}</Text>
              <Text style={[styles.placeType, {color: colors.mutedForeground}]}>
                {profile.business_type || "Establecimiento"}
              </Text>
              {profile.city && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" color={colors.mutedForeground} size={16} />
                  <Text style={[styles.location, {color: colors.mutedForeground}]}>
                    {profile.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Rating (reviews not implemented yet) */}
          <View style={[styles.ratingContainer, {backgroundColor: colors.card}]}>
            <View style={styles.ratingContent}>
              <Ionicons name="star" color="#fbbf24" size={20} />
              <Text style={[styles.ratingText, {color: colors.foreground}]}>
                {profile?.rating?.toFixed(1) || "0.0"}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, {backgroundColor: colors.primary}]}
              onPress={handleBookAppointment}>
              <Ionicons name="calendar" color="#ffffff" size={20} />
              <Text style={styles.primaryButtonText}>Reservar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton, {borderColor: colors.primary}]}
              onPress={handleMessage}>
              <Ionicons name="chatbubble" color={colors.primary} size={20} />
              <Text style={[styles.secondaryButtonText, {color: colors.primary}]}>Mensaje</Text>
            </TouchableOpacity>

            {profile.phone && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, {borderColor: colors.primary}]}
                onPress={handleCall}>
                <Ionicons name="call" color={colors.primary} size={20} />
                <Text style={[styles.secondaryButtonText, {color: colors.primary}]}>Llamar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Location Information */}
      <View
        style={[styles.locationCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" color={colors.primary} size={24} />
          <Text style={[styles.locationTitle, {color: colors.foreground}]}>Ubicación</Text>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="navigate" color={colors.mutedForeground} size={16} />
          <Text style={[styles.addressText, {color: colors.foreground}]}>{fullAddress}</Text>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="pin" color={colors.mutedForeground} size={16} />
          <Text style={[styles.addressText, {color: colors.foreground}]}>
            {profile.city}, {profile.country}
          </Text>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="mail" color={colors.mutedForeground} size={16} />
          <Text style={[styles.addressText, {color: colors.foreground}]}>
            C.P. {profile.postal_code}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.mapButton, {backgroundColor: colors.primary}]}
          onPress={handleViewOnMap}>
          <Ionicons name="map" color="#ffffff" size={18} />
          <Text style={styles.mapButtonText}>Ver en Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      {profile.description && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Acerca de</Text>
          <View
            style={[styles.aboutCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Text style={[styles.aboutText, {color: colors.foreground}]}>
              {profile.description}
            </Text>
          </View>
        </View>
      )}

      {/* Services Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Servicios</Text>
        {services.length > 0 ? (
          services.slice(0, 5).map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <View style={styles.serviceContent}>
                <View
                  style={[styles.serviceIconContainer, {backgroundColor: colors.primary + "15"}]}>
                  <Ionicons name="cut" color={colors.primary} size={20} />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, {color: colors.foreground}]}>
                    {service.name}
                  </Text>
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetailItem}>
                      <Ionicons name="time-outline" color={colors.mutedForeground} size={12} />
                      <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                        {service.duration} min
                      </Text>
                    </View>
                    {service.category && (
                      <View
                        style={[
                          styles.serviceCategoryBadge,
                          {backgroundColor: colors.primary + "10"},
                        ]}>
                        <Text style={[styles.serviceCategoryText, {color: colors.primary}]}>
                          {service.category}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.servicePrice, {color: colors.primary}]}>${service.price}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Ionicons name="sparkles-outline" color={colors.mutedForeground} size={48} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay servicios disponibles
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Este establecimiento aún no ha agregado servicios
            </Text>
          </View>
        )}
      </View>

      {/* Team Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Nuestro Equipo</Text>
        {linkedProfessionals.length > 0 ? (
          linkedProfessionals.map((link) => {
            const getInitials = (name: string) => {
              const words = name.split(" ");
              if (words.length >= 2) {
                return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
              }
              return name.substring(0, 2).toUpperCase();
            };
            return (
              <TouchableOpacity
                key={link.id}
                style={[styles.teamCard, {backgroundColor: colors.card, borderColor: colors.border}]}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: "/view-professional-profile",
                    params: {professionalId: link.professional_id.toString()},
                  });
                }}>
                <View style={[styles.teamAvatar, {backgroundColor: colors.primary}]}>
                  <Text style={styles.teamAvatarText}>
                    {getInitials(link.professional_name)}
                  </Text>
                </View>
                <View style={styles.teamInfo}>
                  <Text style={[styles.teamName, {color: colors.foreground}]}>
                    {link.professional_name}
                  </Text>
                  <View style={styles.teamMeta}>
                    <View style={[styles.teamRoleBadge, {backgroundColor: colors.primary + "15"}]}>
                      <Ionicons name="person" color={colors.primary} size={10} />
                      <Text style={[styles.teamRole, {color: colors.primary}]}>Profesional</Text>
                    </View>
                    <View style={styles.linkedBadge}>
                      <Ionicons name="checkmark-circle" color="#10b981" size={12} />
                      <Text style={[styles.linkedStatus, {color: colors.mutedForeground}]}>
                        Vinculado
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
            );
          })
        ) : (
          <View
            style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Ionicons name="people-outline" color={colors.mutedForeground} size={48} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay profesionales en el equipo
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Este establecimiento aún no tiene profesionales vinculados
            </Text>
          </View>
        )}
      </View>

      {/* Portfolio Section */}
      {images.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Galería</Text>
          <View style={styles.portfolioGrid}>
            {images.map((image, index) => (
              <View key={index} style={[styles.portfolioItem, {backgroundColor: colors.card}]}>
                <Image source={{uri: image.image_url}} style={styles.portfolioImage} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={{height: 40}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerGradient: {
    paddingBottom: 32,
  },
  profileHeader: {
    paddingHorizontal: 24,
  },
  horizontalLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 20,
  },
  logoContainer: {
    position: "relative",
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 22,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logo: {
    width: 102,
    height: 102,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statusRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24,
    borderWidth: 3,
    opacity: 0.3,
  },
  businessBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  placeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  placeName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  placeType: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  location: {
    fontSize: 14,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "700",
  },
  reviewsCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#8b5cf6",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  locationCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  mapButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  aboutCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  serviceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  serviceDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 12,
    fontWeight: "500",
  },
  serviceCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceCategoryText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  teamAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  teamAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  teamMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  teamRole: {
    fontSize: 11,
    fontWeight: "600",
  },
  teamRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  teamRatingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkedStatus: {
    fontSize: 11,
    fontWeight: "500",
  },
  portfolioScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  portfolioItem: {
    width: (SCREEN_WIDTH - 48) / 3,
    height: (SCREEN_WIDTH - 48) / 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  portfolioImage: {
    width: "100%",
    height: "100%",
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
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
