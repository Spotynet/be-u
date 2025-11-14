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
import {ProfessionalProfile} from "@/types/global";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface ViewProfessionalProfileProps {
  professionalId: number;
  onClose?: () => void;
}

export const ViewProfessionalProfile = ({
  professionalId,
  onClose,
}: ViewProfessionalProfileProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [linkedPlaces, setLinkedPlaces] = useState<PlaceProfessionalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfessionalData();
  }, [professionalId]);

  const loadProfessionalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load professional profile
      const profileResponse = await providerApi.getProfessionalProfile(professionalId);
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

      // Load linked places
      try {
        // Try to get professional user ID from profile
        // If profile has user_id, use it; otherwise try using professionalId directly
        const profUserId =
          (profileResponse.data as any)?.user_id ||
          (profileResponse.data as any)?.user?.id ||
          professionalId;
        const linksResponse = await linkApi.listProfessionalLinks(profUserId, "ACCEPTED");
        const rawLinks = Array.isArray(linksResponse.data) ? linksResponse.data : [];

        const profEmail = ((profileResponse.data as any)?.user?.email || "").toLowerCase();
        const profName = `${(profileResponse.data as any)?.name || ""} ${
          (profileResponse.data as any)?.last_name || ""
        }`
          .toLowerCase()
          .trim();

        const filtered = rawLinks.filter((link: any) => {
          const linkEmail = (link.professional_email || "").toLowerCase();
          const linkName = (link.professional_name || "").toLowerCase().trim();

          if (profEmail && linkEmail && linkEmail === profEmail) return true;
          if (profName && linkName && linkName.includes(profName)) return true;
          return false;
        });

        setLinkedPlaces(filtered);
      } catch (linksError) {
        console.log("Linked places not available:", linksError);
        setLinkedPlaces([]);
      }
    } catch (err: any) {
      console.error("Error loading professional data:", err);
      setError("Error al cargar el perfil del profesional");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "P";
  };

  const displayName = profile ? `${profile.name} ${profile.last_name}` : "Profesional";

  const handleBookAppointment = () => {
    if (profile) {
      router.push({
        pathname: "/book-appointment",
        params: {professionalId: professionalId.toString()},
      });
    }
  };

  const handleCall = () => {
    if (profile?.phone) {
      Alert.alert("Llamar", `¿Deseas llamar a ${displayName}?`, [
        {text: "Cancelar", style: "cancel"},
        {text: "Llamar", onPress: () => console.log("Calling:", profile.phone)},
      ]);
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: "/chat",
      params: {professionalId: professionalId.toString()},
    });
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
          {error || "No se pudo cargar el perfil del profesional"}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: colors.primary}]}
          onPress={loadProfessionalData}>
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

      {/* Professional Header with Background */}
      <View style={[styles.headerGradient, {backgroundColor: isDark ? "#1e1b4b" : "#dbeafe"}]}>
        <View style={styles.profileHeader}>
          <View style={styles.horizontalLayout}>
            {/* Enhanced Avatar */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarWrapper, {backgroundColor: colors.card}]}>
                {profile?.photo ? (
                  <Image source={{uri: profile.photo}} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarPlaceholder,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Text style={styles.avatarText}>
                      {getInitials(profile?.name, profile?.last_name)}
                    </Text>
                  </View>
                )}
                {/* Professional status ring */}
                <View style={[styles.statusRing, {borderColor: colors.primary}]} />
              </View>
              {/* Verified Badge */}
              <View style={[styles.verifiedBadge, {backgroundColor: "#3b82f6"}]}>
                <Ionicons name="checkmark-circle" color="#ffffff" size={20} />
              </View>
            </View>

            {/* Professional Info */}
            <View style={styles.professionalInfo}>
              <Text style={[styles.profileName, {color: colors.foreground}]}>{displayName}</Text>
              <Text style={[styles.professionalTitle, {color: colors.mutedForeground}]}>
                {profile.specialty || "Profesional"}
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

          {/* Rating */}
          <View style={[styles.ratingCard, {backgroundColor: isDark ? "#1e293b" : "#ffffff"}]}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(profile?.rating || 0) ? "star" : "star-outline"}
                  color="#fbbf24"
                  size={20}
                />
              ))}
            </View>
            <Text style={[styles.ratingText, {color: colors.foreground}]}>
              {profile?.rating?.toFixed(1) || "0.0"}
            </Text>
            <Text style={[styles.reviewsCount, {color: colors.mutedForeground}]}>
              {profile?.reviews_count || 0} reseñas
            </Text>
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

      {/* About Section */}
      {profile.bio && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Acerca de</Text>
          <View
            style={[styles.aboutCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Text style={[styles.aboutText, {color: colors.foreground}]}>{profile.bio}</Text>
          </View>
        </View>
      )}

      {/* Linked Places Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Trabaja en</Text>
        {linkedPlaces.length > 0 ? (
          linkedPlaces.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={[styles.linkedPlaceCard, {backgroundColor: colors.card, borderColor: colors.border}]}
              activeOpacity={0.7}
              onPress={() => {
                router.push({
                  pathname: "/view-place-profile",
                  params: {placeId: link.place_id.toString()},
                });
              }}>
              <View style={[styles.linkedPlaceIcon, {backgroundColor: colors.primary + "15"}]}>
                <Ionicons name="business" color={colors.primary} size={24} />
              </View>
              <View style={styles.linkedPlaceInfo}>
                <Text style={[styles.linkedPlaceName, {color: colors.foreground}]}>
                  {link.place_name}
                </Text>
                <View style={styles.linkedPlaceBadge}>
                  <Ionicons name="checkmark-circle" color="#10b981" size={14} />
                  <Text style={[styles.linkedPlaceStatus, {color: colors.mutedForeground}]}>
                    Vinculado
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Ionicons name="business-outline" color={colors.mutedForeground} size={48} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No está vinculado a ningún lugar
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Este profesional aún no está vinculado a ningún establecimiento
            </Text>
          </View>
        )}
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Servicios</Text>
        {services.length > 0 ? (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <View style={styles.serviceHeader}>
                <View
                  style={[styles.serviceCategoryBadge, {backgroundColor: colors.primary + "15"}]}>
                  <Ionicons name="sparkles" color={colors.primary} size={12} />
                  <Text style={[styles.serviceCategoryText, {color: colors.primary}]}>
                    {service.category || "General"}
                  </Text>
                </View>
                <View style={styles.serviceStatusDot} />
              </View>
              <Text style={[styles.serviceName, {color: colors.foreground}]}>{service.name}</Text>
              <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                {service.description || "Sin descripción"}
              </Text>
              <View style={styles.serviceFooter}>
                <View style={styles.serviceDurationContainer}>
                  <Ionicons name="time-outline" color={colors.mutedForeground} size={14} />
                  <Text style={[styles.serviceDuration, {color: colors.mutedForeground}]}>
                    {service.duration} min
                  </Text>
                </View>
                <Text style={[styles.servicePrice, {color: colors.primary}]}>${service.price}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Ionicons name="cut-outline" color={colors.mutedForeground} size={48} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay servicios disponibles
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Este profesional aún no ha agregado servicios
            </Text>
          </View>
        )}
      </View>

      {/* Portfolio Section */}
      {images.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Portfolio</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.portfolioScroll}>
            {images.map((image, index) => (
              <View key={index} style={[styles.portfolioItem, {backgroundColor: colors.card}]}>
                <Image source={{uri: image.image_url}} style={styles.portfolioImage} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Availability Section */}
      {availability && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Disponibilidad</Text>
          <View
            style={[
              styles.availabilityCard,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Text style={[styles.availabilityText, {color: colors.foreground}]}>
              Horarios disponibles próximamente
            </Text>
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
  avatarContainer: {
    position: "relative",
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statusRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 52,
    borderWidth: 3,
    opacity: 0.3,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
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
  professionalInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  professionalTitle: {
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
  ratingCard: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ratingStars: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
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
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  serviceCategoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  serviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceDurationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceDuration: {
    fontSize: 13,
    fontWeight: "500",
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: "700",
  },
  portfolioScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  portfolioItem: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
  },
  portfolioImage: {
    width: "100%",
    height: "100%",
  },
  availabilityCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  availabilityText: {
    fontSize: 15,
    fontWeight: "500",
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
  linkedPlaceCard: {
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
  linkedPlaceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  linkedPlaceInfo: {
    flex: 1,
  },
  linkedPlaceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  linkedPlaceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkedPlaceStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
});
