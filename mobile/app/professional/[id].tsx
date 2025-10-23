import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {providerApi, postApi, reviewApi, serviceApi} from "@/lib/api";
import {ProfessionalProfile} from "@/types/global";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {errorUtils} from "@/lib/api";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function ProfessionalDetailScreen() {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();

  // Extract numeric ID from the string (e.g., "professional_0_1761200070463" -> "1761200070463")
  const numericId = id?.includes("_") ? id.split("_").pop() : id;

  // Validate that we have a valid numeric ID
  if (!numericId || isNaN(Number(numericId))) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.background}]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" color="#ef4444" size={64} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            ID de profesional inválido
          </Text>
        </View>
      </View>
    );
  }

  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"servicios" | "opiniones" | "posts">("servicios");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Posts data - will be fetched from API in real implementation
  const [professionalPosts, setProfessionalPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfessionalPosts = async () => {
      try {
        const response = await postApi.getPosts({
          author: Number(numericId),
          page_size: 20,
        });
        setProfessionalPosts(response.data.results || []);
      } catch (error) {
        console.error("Error fetching professional posts:", error);
        // Keep empty array as fallback
      }
    };

    fetchProfessionalPosts();
  }, [numericId]);

  useEffect(() => {
    fetchProfessionalDetails();
  }, [numericId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [professional]);

  const fetchProfessionalDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch professional profile
      const professionalResponse = await providerApi.getProfessionalProfile(Number(numericId));
      const professionalData = professionalResponse.data;

      // Fetch professional services
      const servicesResponse = await serviceApi.getProfessionalServices({
        professional: Number(numericId),
        is_active: true,
      });

      // Fetch professional reviews
      const reviewsResponse = await reviewApi.listProfessionals({
        professional: Number(numericId),
        page_size: 10,
      });

      // Transform API response to match expected format for UI
      const transformedProfessional: ProfessionalProfile = {
        id: professionalData.id,
        user_id: professionalData.user?.id || professionalData.id,
        email: professionalData.user?.email || "",
        name: professionalData.user?.first_name || professionalData.name || "Nombre no disponible",
        last_name: professionalData.user?.last_name || professionalData.last_name || "",
        bio: professionalData.bio,
        city: professionalData.city || "Ciudad no especificada",
        rating: professionalData.rating || 4.5,
        services_count: professionalData.services_count || 0,
        photo: professionalData.photo,
        type: "professional",
        coordinates: {
          top: "50%",
          left: "50%",
        },
        avatar: "💇‍♀️",
        distance: "0.5 km",
        services: servicesResponse.data.results.map((service: any) => ({
          id: service.id,
          name: service.service_name || service.name,
          duration: service.time || "1 hr",
          price: service.price,
          description: service.description || "Servicio profesional",
        })),
        reviews: reviewsResponse.data.results.map((review: any) => ({
          id: review.id,
          providerId: review.provider_id,
          providerType: review.provider_type,
          author: review.client_name || review.user_name || "Cliente",
          rating: review.rating,
          date: review.created_at,
          comment: review.comment,
          photos: review.photos || [],
        })),
      };

      setProfessional(transformedProfessional);
    } catch (err: any) {
      console.error("Error fetching professional:", err);
      setError(errorUtils.getErrorMessage(err) || "Error al cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  // Portfolio images - would come from API in real implementation
  const [portfolioImages, setPortfolioImages] = useState<any[]>([
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
    },
  ]);

  useEffect(() => {
    const fetchPortfolioImages = async () => {
      try {
        // In a real implementation, this would fetch from the professional's portfolio
        // For now, we'll use placeholder images
        setPortfolioImages([
          {
            id: 1,
            image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
          },
          {
            id: 2,
            image:
              "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
          },
          {
            id: 3,
            image:
              "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
          },
        ]);
      } catch (error) {
        console.error("Error fetching portfolio images:", error);
      }
    };

    fetchPortfolioImages();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.background}]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando perfil...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !professional) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.background}]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" color="#ef4444" size={64} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            {error || "No se pudo cargar el perfil"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={fetchProfessionalDetails}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: "transparent"}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.backButtonBg}>
            <Ionicons name="arrow-back" color="#ffffff" size={24} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <View style={styles.headerButtonBg}>
              <Ionicons name="share-outline" color="#ffffff" size={24} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <View style={styles.headerButtonBg}>
              <Ionicons name="heart-outline" color="#ffffff" size={24} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image Carousel */}
        <View style={styles.heroSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            style={styles.imageCarousel}>
            {portfolioImages.map((item, index) => (
              <View key={item.id} style={styles.carouselImageContainer}>
                <Image source={{uri: item.image}} style={styles.heroImage} />
                <View style={styles.imageOverlay} />
              </View>
            ))}
          </ScrollView>

          {/* Carousel Indicators */}
          <View style={styles.carouselIndicators}>
            {portfolioImages.map((_, index) => (
              <View
                key={index}
                style={[styles.indicator, index === currentImageIndex && styles.activeIndicator]}
              />
            ))}
          </View>
        </View>

        {/* Profile Info */}
        <Animated.View style={[styles.profileInfo, {opacity: fadeAnim}]}>
          <View style={styles.profileHeader}>
            <View style={styles.profileTextContainer}>
              <Text style={[styles.profileName, {color: colors.foreground}]}>
                {professional.name} {professional.last_name}
              </Text>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" color={colors.mutedForeground} size={14} />
                  <Text style={[styles.metaText, {color: colors.mutedForeground}]}>
                    {professional.city}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people" color={colors.mutedForeground} size={14} />
                  <Text style={[styles.metaText, {color: colors.mutedForeground}]}>
                    {professional.services_count} servicios
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.ratingBadge, {backgroundColor: "#EF4444"}]}>
              <Ionicons name="star" color="#ffffff" size={16} />
              <Text style={styles.ratingText}>{Number(professional.rating || 0).toFixed(1)}</Text>
            </View>
          </View>

          {/* Place/Location Section */}
          <View style={[styles.locationSection, {backgroundColor: colors.card}]}>
            <View style={styles.locationHeader}>
              <Ionicons name="business-outline" color={colors.primary} size={20} />
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                {(professional as any).isIndependent ? "Trabajo Independiente" : "Lugar de Trabajo"}
              </Text>
            </View>
            {(professional as any).isIndependent ? (
              <Text style={[styles.locationText, {color: colors.mutedForeground}]}>
                Profesional independiente - Atención en diferentes ubicaciones
              </Text>
            ) : (professional as any).place ? (
              <TouchableOpacity
                style={styles.placeCard}
                onPress={() => {
                  router.push(`/place/${(professional as any).place.id}` as any);
                }}
                activeOpacity={0.7}>
                <View style={styles.placeInfo}>
                  <Text style={[styles.placeName, {color: colors.foreground}]}>
                    {(professional as any).place.name}
                  </Text>
                  <View style={styles.placeAddress}>
                    <Ionicons name="location" color={colors.mutedForeground} size={14} />
                    <Text style={[styles.placeAddressText, {color: colors.mutedForeground}]}>
                      {(professional as any).place.address}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* About Section */}
          {professional.bio && (
            <View style={[styles.aboutSection, {backgroundColor: colors.card}]}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Sobre mí</Text>
              <Text style={[styles.bioText, {color: colors.mutedForeground}]}>
                {professional.bio}
              </Text>
            </View>
          )}

          {/* Tabs */}
          <View style={[styles.tabsContainer, {backgroundColor: colors.card}]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "servicios" && [
                  styles.activeTab,
                  {borderBottomColor: colors.primary},
                ],
              ]}
              onPress={() => setActiveTab("servicios")}>
              <Text
                style={[
                  styles.tabText,
                  {color: activeTab === "servicios" ? colors.primary : colors.mutedForeground},
                ]}>
                Servicios
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "posts" && [styles.activeTab, {borderBottomColor: colors.primary}],
              ]}
              onPress={() => setActiveTab("posts")}>
              <Text
                style={[
                  styles.tabText,
                  {color: activeTab === "posts" ? colors.primary : colors.mutedForeground},
                ]}>
                Publicaciones
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "opiniones" && [
                  styles.activeTab,
                  {borderBottomColor: colors.primary},
                ],
              ]}
              onPress={() => setActiveTab("opiniones")}>
              <Text
                style={[
                  styles.tabText,
                  {color: activeTab === "opiniones" ? colors.primary : colors.mutedForeground},
                ]}>
                Opiniones
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === "servicios" && (
            <View style={[styles.servicesSection, {backgroundColor: colors.card}]}>
              {professional.services && professional.services.length > 0 ? (
                professional.services.map((service: any, index: number) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      {
                        backgroundColor: colorScheme === "dark" ? "#1a1f2e" : "#ffffff",
                        borderColor: colorScheme === "dark" ? "#2d3548" : "#e2e8f0",
                      },
                    ]}
                    activeOpacity={0.95}>
                    <View style={styles.serviceHeader}>
                      <View style={[styles.serviceIcon, {backgroundColor: getServiceColor(index)}]}>
                        <Ionicons name={getServiceIcon(index)} color="#ffffff" size={28} />
                      </View>
                      <View style={styles.serviceMainInfo}>
                        <Text
                          style={[
                            styles.serviceName,
                            {color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b"},
                          ]}>
                          {service.name}
                        </Text>
                        <View style={styles.serviceMeta}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                          />
                          <Text
                            style={[
                              styles.serviceMetaText,
                              {color: colorScheme === "dark" ? "#94a3b8" : "#64748b"},
                            ]}>
                            {service.duration}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.serviceFooter}>
                      <Text style={[styles.servicePrice, {color: colors.primary}]}>
                        ${service.price} MXN
                      </Text>
                      <TouchableOpacity
                        style={[styles.reserveButton, {backgroundColor: colors.primary}]}
                        onPress={() => {
                          setSelectedService(service);
                          setShowBookingFlow(true);
                        }}
                        activeOpacity={0.8}>
                        <Text style={styles.reserveButtonText}>Reservar</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="cut-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
                    No hay servicios disponibles
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "posts" && (
            <View style={styles.postsSection}>
              <View style={styles.postsGrid}>
                {professionalPosts.map((post, index) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postItem}
                    onPress={() => {
                      // Navigate to post detail
                      console.log("Navigate to post:", post.id);
                    }}
                    activeOpacity={0.9}>
                    <Image source={{uri: post.image}} style={styles.postImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === "opiniones" && (
            <View style={[styles.reviewsSection, {backgroundColor: colors.card}]}>
              {professional.reviews && professional.reviews.length > 0 ? (
                professional.reviews.map((review: any) => (
                  <View
                    key={review.id}
                    style={[styles.reviewCard, {borderBottomColor: colors.border}]}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAuthor}>
                        <View style={[styles.reviewAvatar, {backgroundColor: colors.primary}]}>
                          <Text style={styles.reviewAvatarText}>
                            {review.author[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.reviewAuthorInfo}>
                          <Text style={[styles.reviewAuthorName, {color: colors.foreground}]}>
                            {review.author}
                          </Text>
                          <View style={styles.reviewRating}>
                            {[...Array(5)].map((_, i) => (
                              <Ionicons
                                key={i}
                                name={i < review.rating ? "star" : "star-outline"}
                                color="#FFD700"
                                size={14}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}>
                        {new Date(review.date).toLocaleDateString("es-MX")}
                      </Text>
                    </View>
                    <Text style={[styles.reviewComment, {color: colors.foreground}]}>
                      {review.comment}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
                    No hay reseñas disponibles
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Booking Flow Modal */}
      {selectedService && (
        <BookingFlow
          isVisible={showBookingFlow}
          onClose={() => setShowBookingFlow(false)}
          provider={professional}
          service={selectedService}
        />
      )}
    </View>
  );
}

// Helper functions for service styling
const getServiceColor = (index: number) => {
  const colors = ["#FFB6C1", "#DDA0DD", "#87CEEB", "#98FB98"];
  return colors[index % colors.length];
};

const getServiceIcon = (index: number) => {
  const icons = ["hand-left", "foot", "cut", "color-palette"];
  return icons[index % icons.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  heroSection: {
    height: 400,
    position: "relative",
  },
  imageCarousel: {
    flex: 1,
  },
  carouselImageContainer: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
  },
  carouselIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeIndicator: {
    backgroundColor: "#ffffff",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  ratingText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  profileInfo: {
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  profileMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontWeight: "500",
  },
  locationSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  placeAddress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeAddressText: {
    fontSize: 14,
    flex: 1,
  },
  aboutSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tabsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  servicesSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
  },
  serviceCard: {
    borderRadius: 20,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  serviceMainInfo: {
    flex: 1,
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 22,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 14,
    fontWeight: "500",
  },
  serviceFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  reserveButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  reserveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  reviewsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  reviewCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reviewAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  reviewAuthorInfo: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  bottomSpacing: {
    height: 40,
  },
  // Posts Section
  postsSection: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 20,
    alignItems: "center",
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  postItem: {
    width: "33.33%",
    aspectRatio: 1,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
