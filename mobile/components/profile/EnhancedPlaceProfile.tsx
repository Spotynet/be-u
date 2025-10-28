import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect} from "react";
import {useRouter} from "expo-router";
import {providerApi, profileCustomizationApi} from "@/lib/api";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface EnhancedPlaceProfileProps {
  placeId: number;
  onClose?: () => void;
}

export const EnhancedPlaceProfile = ({placeId, onClose}: EnhancedPlaceProfileProps) => {
  const {colors} = useThemeVariant();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"servicios" | "opiniones">("servicios");

  useEffect(() => {
    loadPlaceData();
  }, [placeId]);

  const loadPlaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileResponse = await providerApi.getPlaceProfile(placeId);
      setProfile(profileResponse.data);

      try {
        const [servicesResponse, imagesResponse] = await Promise.all([
          profileCustomizationApi.getCustomServices(),
          profileCustomizationApi.getProfileImages(),
        ]);

        setServices(servicesResponse.data || []);
        setImages(imagesResponse.data || []);
      } catch (customizationError) {
        console.log("Customization data not available:", customizationError);
      }

      // Mock reviews data - replace with actual API call
      setReviews([
        {id: 1, name: "Eric Cruz", rating: 5, comment: "Excelente Servicio"},
        {id: 2, name: "David Perez", rating: 5, comment: "Gracias"},
        {id: 3, name: "Alejandra Erazo", rating: 5, comment: "La atencion fue muy buena"},
        {id: 4, name: "Maria Navarro", rating: 5, comment: "Me atendieron tarde"},
        {id: 5, name: "Soraya Duarte", rating: 5, comment: "No me gusto"},
        {id: 6, name: "Sergio Lopez", rating: 5, comment: "Muy buena experiencia"},
        {id: 7, name: "Ingrid Tobar", rating: 5, comment: "Recomendado"},
      ]);
    } catch (err: any) {
      console.error("Error loading place data:", err);
      setError("Error al cargar el perfil del establecimiento");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const placeName = profile?.name || "Establecimiento";
  const fullAddress = profile?.street ? `${profile.street}, ${profile.city}` : profile?.city || "";

  const handleBookAppointment = () => {
    router.push(`/booking/place/${placeId}`);
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
    router.push(`/messages/place/${placeId}`);
  };

  const copyAddress = () => {
    Alert.alert("Dirección copiada", fullAddress);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" color={colors.mutedForeground} size={48} />
        <Text style={[styles.errorText, {color: colors.foreground}]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: colors.primary}]}
          onPress={loadPlaceData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.background}]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="chevron-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Perfil: Salones</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={{uri: images[0]?.image_url || "https://via.placeholder.com/400x200"}}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Profile Summary */}
        <View style={styles.profileSummary}>
          <Text style={[styles.salonTitle, {color: colors.foreground}]}>Tu salón</Text>
          <View style={styles.summaryRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" color="#fbbf24" size={16} />
              <Text style={[styles.ratingText, {color: colors.foreground}]}>
                {profile?.rating?.toFixed(1) || "4.9"}
              </Text>
            </View>
            <Text style={[styles.distanceText, {color: colors.mutedForeground}]}>560m</Text>
          </View>
          <Text style={[styles.followersText, {color: colors.mutedForeground}]}>
            {profile?.followers_count || 1690} Seguidores
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "servicios" && styles.activeTab]}
            onPress={() => setActiveTab("servicios")}>
            <Text
              style={[
                styles.tabText,
                {color: activeTab === "servicios" ? colors.primary : colors.mutedForeground},
              ]}>
              Servicios
            </Text>
            {activeTab === "servicios" && (
              <View style={[styles.tabIndicator, {backgroundColor: colors.primary}]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "opiniones" && styles.activeTab]}
            onPress={() => setActiveTab("opiniones")}>
            <Text
              style={[
                styles.tabText,
                {color: activeTab === "opiniones" ? colors.primary : colors.mutedForeground},
              ]}>
              Opiniones
            </Text>
            {activeTab === "opiniones" && (
              <View style={[styles.tabIndicator, {backgroundColor: colors.primary}]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Operating Hours */}
        <View style={styles.hoursContainer}>
          <Text style={[styles.hoursTitle, {color: colors.foreground}]}>Horarios</Text>
          <Text style={[styles.hoursText, {color: colors.mutedForeground}]}>
            Lun - Vie: 10AM - 8PM
          </Text>
          <Text style={[styles.hoursText, {color: colors.mutedForeground}]}>
            Sab - Dom: 10AM - 5PM
          </Text>
        </View>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Text style={[styles.locationTitle, {color: colors.foreground}]}>Ubicación</Text>
          <View style={styles.addressRow}>
            <Text style={[styles.addressText, {color: colors.mutedForeground}]}>{fullAddress}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
              <Text style={[styles.copyButtonText, {color: colors.primary}]}>Copiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === "servicios" && (
          <View style={styles.servicesContainer}>
            {services.length > 0 ? (
              services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceCard, {backgroundColor: colors.card}]}
                  onPress={handleBookAppointment}>
                  <Image
                    source={{uri: service.image_url || "https://via.placeholder.com/80x80"}}
                    style={styles.serviceImage}
                  />
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, {color: colors.foreground}]}>
                      {service.name}
                    </Text>
                    <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                      {service.description || "Servicio profesional de calidad"}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <Text style={[styles.serviceDuration, {color: colors.mutedForeground}]}>
                        {service.duration} min
                      </Text>
                      <Text style={[styles.servicePrice, {color: colors.primary}]}>
                        $ {service.price} MXN
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyState, {backgroundColor: colors.card}]}>
                <Ionicons name="cut-outline" color={colors.mutedForeground} size={48} />
                <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
                  No hay servicios disponibles
                </Text>
                <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
                  Este establecimiento aún no ha agregado servicios
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "opiniones" && (
          <View style={styles.reviewsContainer}>
            {reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, {backgroundColor: colors.card}]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, {backgroundColor: colors.primary}]}>
                    <Text style={styles.reviewAvatarText}>{getInitials(review.name)}</Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={[styles.reviewName, {color: colors.foreground}]}>
                      {review.name}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? "star" : "star-outline"}
                          color="#fbbf24"
                          size={16}
                        />
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.reviewAction}>
                    <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={16} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.reviewComment, {color: colors.foreground}]}>
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        )}

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

        {/* Bottom Spacing */}
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  favoriteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroImageContainer: {
    height: 200,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  profileSummary: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  salonTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  distanceText: {
    fontSize: 14,
  },
  followersText: {
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    position: "relative",
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  hoursContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 14,
    marginBottom: 2,
  },
  locationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressText: {
    fontSize: 14,
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  servicesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceDuration: {
    fontSize: 14,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reviewAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewAction: {
    padding: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {},
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
