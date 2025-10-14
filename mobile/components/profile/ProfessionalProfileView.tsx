import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {User, ProfessionalProfile} from "@/types/global";
import {useRouter} from "expo-router";
import {ProfileTabs} from "./ProfileTabs";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface ProfessionalProfileViewProps {
  user: User;
  profile: ProfessionalProfile | null;
  stats: {
    services?: number;
    reviews?: number;
  };
  services?: any[];
  portfolio?: any[];
}

export const ProfessionalProfileView = ({
  user,
  profile,
  stats,
  services = [],
  portfolio = [],
}: ProfessionalProfileViewProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "P";
  };

  const displayName = profile
    ? `${profile.name} ${profile.last_name}`
    : `${user?.first_name || user?.firstName || "Usuario"} ${
        user?.last_name || user?.lastName || ""
      }`;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                      {getInitials(user?.first_name, user?.last_name)}
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

            {/* Simplified Professional Info */}
            <View style={styles.professionalInfo}>
              <Text style={[styles.profileName, {color: colors.foreground}]}>{displayName}</Text>

              <Text
                style={[styles.professionalEmail, {color: colors.mutedForeground}]}
                numberOfLines={1}>
                {user?.email || "No email"}
              </Text>
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
              {stats.reviews || 0} reseñas
            </Text>
          </View>

          {profile?.city && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" color={isDark ? "#cbd5e1" : "#64748b"} size={16} />
              <Text style={[styles.location, {color: isDark ? "#cbd5e1" : "#64748b"}]}>
                {profile.city}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="cut" color={colors.primary} size={24} />
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Mis Servicios</Text>
          </View>
          <TouchableOpacity
            style={[styles.addIconButton, {backgroundColor: colors.primary}]}
            onPress={() => router.push("/create-service")}>
            <Ionicons name="add" color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>

        {services.length > 0 ? (
          <>
            {services.map((service) => (
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
                  <Text style={[styles.servicePrice, {color: colors.primary}]}>
                    ${service.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.addButton, {backgroundColor: colors.primary}]}
              onPress={() => router.push("/create-service")}
              activeOpacity={0.9}>
              <Ionicons name="add-circle-outline" color="#ffffff" size={20} />
              <Text style={styles.addButtonText}>Agregar Nuevo Servicio</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View
            style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={[styles.emptyIconContainer, {backgroundColor: colors.primary + "10"}]}>
              <Ionicons name="cut-outline" color={colors.primary} size={48} />
            </View>
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No tienes servicios aún
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Comienza agregando tus servicios profesionales para que los clientes puedan reservar
              contigo
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionButton, {backgroundColor: colors.primary}]}
              onPress={() => router.push("/create-service")}
              activeOpacity={0.9}>
              <Ionicons name="add" color="#ffffff" size={20} />
              <Text style={styles.emptyActionText}>Agregar Mi Primer Servicio</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Portfolio Section */}
      {portfolio.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="images" color={colors.primary} size={24} />
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Mi Portfolio</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.portfolioScroll}>
            {portfolio.map((item, index) => (
              <View key={index} style={[styles.portfolioItem, {backgroundColor: colors.card}]}>
                <Image source={{uri: item.image}} style={styles.portfolioImage} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={{height: 20}} />

      {/* Profile Tabs */}
      <View style={{minHeight: 400}}>
        <ProfileTabs userRole="PROFESSIONAL" />
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
  professionalEmail: {
    fontSize: 16,
    fontWeight: "500",
  },
  ratingCard: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 12,
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  location: {
    fontSize: 14,
    fontWeight: "500",
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
  addIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
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
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
});
