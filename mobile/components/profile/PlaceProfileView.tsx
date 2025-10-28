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
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {User, PlaceProfile} from "@/types/global";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react";
import {profileCustomizationApi} from "@/lib/api";
import {ProfileTabs} from "./ProfileTabs";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface PlaceProfileViewProps {
  user: User;
  profile: PlaceProfile | null;
  stats: {
    services?: number;
    reviews?: number;
    teamMembers?: number;
  };
  services?: any[];
  teamMembers?: any[];
}

export const PlaceProfileView = ({
  user,
  profile,
  stats,
  services = [],
  teamMembers = [],
}: PlaceProfileViewProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const [customServices, setCustomServices] = useState<any[]>([]);
  const [customImages, setCustomImages] = useState<any[]>([]);
  const [loadingCustomization, setLoadingCustomization] = useState(false);

  useEffect(() => {
    loadCustomizationData();
  }, []);

  const loadCustomizationData = async () => {
    try {
      setLoadingCustomization(true);
      const [servicesResponse, imagesResponse] = await Promise.all([
        profileCustomizationApi.getCustomServices(),
        profileCustomizationApi.getProfileImages(),
      ]);
      setCustomServices(servicesResponse.data || []);
      setCustomImages(imagesResponse.data || []);
    } catch (error) {
      console.log("Customization data not available:", error);
    } finally {
      setLoadingCustomization(false);
    }
  };

  // Use custom services if available, otherwise fall back to passed services
  const displayServices = customServices.length > 0 ? customServices : services;

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const placeName =
    profile?.name ||
    `${user?.first_name || user?.firstName || "Usuario"} ${
      user?.last_name || user?.lastName || ""
    }`;
  const fullAddress = profile
    ? `${profile.street} ${profile.number_ext || ""}${
        profile.number_int ? ` Int. ${profile.number_int}` : ""
      }`
    : "Sin dirección";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

            {/* Simplified Place Info */}
            <View style={styles.placeInfo}>
              <Text style={[styles.placeName, {color: colors.foreground}]}>{placeName}</Text>

              <Text style={[styles.placeEmail, {color: colors.mutedForeground}]} numberOfLines={1}>
                {user?.email || "No email"}
              </Text>
            </View>
          </View>

          {/* Rating */}
          <View style={[styles.ratingContainer, {backgroundColor: colors.card}]}>
            <View style={styles.ratingContent}>
              <Ionicons name="star" color="#fbbf24" size={20} />
              <Text style={[styles.ratingText, {color: colors.foreground}]}>4.8</Text>
            </View>
            <Text style={[styles.reviewsCount, {color: colors.mutedForeground}]}>
              ({stats.reviews || 0} reseñas)
            </Text>
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

        {profile ? (
          <>
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
              activeOpacity={0.9}>
              <Ionicons name="map" color="#ffffff" size={18} />
              <Text style={styles.mapButtonText}>Ver en Mapa</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={[styles.noDataText, {color: colors.mutedForeground}]}>
            Dirección no disponible
          </Text>
        )}
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="sparkles" color={colors.primary} size={24} />
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
              Nuestros Servicios
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/create-service")}>
            <Text style={[styles.seeAllText, {color: colors.primary}]}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {displayServices.length > 0 ? (
          <>
            {displayServices.slice(0, 3).map((service) => (
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
                  <Text style={[styles.servicePrice, {color: colors.primary}]}>
                    ${service.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View
            style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={[styles.emptyIconContainer, {backgroundColor: colors.primary + "10"}]}>
              <Ionicons name="sparkles-outline" color={colors.primary} size={48} />
            </View>
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay servicios disponibles
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Agrega servicios para que tus clientes puedan reservar
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionButton, {backgroundColor: colors.primary}]}
              onPress={() => router.push("/create-service")}
              activeOpacity={0.9}>
              <Ionicons name="add" color="#ffffff" size={18} />
              <Text style={styles.emptyActionText}>Agregar Servicio</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Team Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="people" color={colors.primary} size={24} />
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Nuestro Equipo</Text>
          </View>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, {color: colors.primary}]}>Gestionar</Text>
          </TouchableOpacity>
        </View>

        {teamMembers.length > 0 ? (
          teamMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[styles.teamCard, {backgroundColor: colors.card, borderColor: colors.border}]}
              activeOpacity={0.7}>
              <View style={[styles.teamAvatar, {backgroundColor: colors.primary}]}>
                <Text style={styles.teamAvatarText}>
                  {member.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, {color: colors.foreground}]}>{member.name}</Text>
                <View style={styles.teamMeta}>
                  <View style={[styles.teamRoleBadge, {backgroundColor: colors.primary + "15"}]}>
                    <Ionicons name="briefcase" color={colors.primary} size={10} />
                    <Text style={[styles.teamRole, {color: colors.primary}]}>{member.role}</Text>
                  </View>
                  <View style={styles.teamRating}>
                    <Ionicons name="star" color="#fbbf24" size={12} />
                    <Text style={[styles.teamRatingText, {color: colors.foreground}]}>
                      {member.rating || "5.0"}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={[styles.emptyIconContainer, {backgroundColor: colors.primary + "10"}]}>
              <Ionicons name="people-outline" color={colors.primary} size={48} />
            </View>
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay miembros en el equipo
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Agrega profesionales a tu establecimiento
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionButton, {backgroundColor: colors.primary}]}
              activeOpacity={0.9}>
              <Ionicons name="person-add" color="#ffffff" size={18} />
              <Text style={styles.emptyActionText}>Agregar Profesional</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Management Actions - Removed */}

      {/* Bottom Spacing */}
      <View style={{height: 20}} />

      {/* Profile Tabs */}
      <View style={{minHeight: 400}}>
        <ProfileTabs userRole="PLACE" />
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 32,
  },
  profileHeader: {
    paddingTop: 24,
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
  placeEmail: {
    fontSize: 16,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
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
  noDataText: {
    fontSize: 14,
    fontStyle: "italic",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
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
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  managementGrid: {
    gap: 12,
  },
  managementCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
  managementIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  managementInfo: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },
  managementSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
});
