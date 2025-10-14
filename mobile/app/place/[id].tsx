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
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {providerApi} from "@/lib/api";
import {PlaceProfile} from "@/types/global";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {mockPlaces, mockServices, mockReviews} from "@/lib/mockData";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function PlaceDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();

  const [place, setPlace] = useState<PlaceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"servicios" | "profesionales" | "opiniones">(
    "servicios"
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPlaceDetails();
  }, [id]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [place]);

  const fetchPlaceDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Load mock data
      const placeData = mockPlaces.find((p) => p.id === parseInt(id || "1"));
      if (placeData) {
        // Add services and reviews mock
        const placeWithServices = {
          ...placeData,
          services: mockServices.slice(0, 3), // First 3 services
          reviews: mockReviews.slice(0, 2), // First 2 reviews
        };
        setPlace(placeWithServices);
      } else {
        setError("Lugar no encontrado");
      }
    } catch (err: any) {
      console.error("Error fetching place:", err);
      setError(err.message || "Error al cargar el establecimiento");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock salon images
  const salonImages = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
    },
  ];

  // Mock salon professionals
  const salonProfessionals = [
    {
      id: 1,
      name: "Ana López",
      last_name: "Martínez",
      specialty: "Colorista",
      rating: 4.9,
      experience: "8 años",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
      services: ["Color Completo", "Balayage", "Mechas"],
    },
    {
      id: 2,
      name: "Carlos",
      last_name: "Rodríguez",
      specialty: "Barbero",
      rating: 4.8,
      experience: "5 años",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      services: ["Corte Clásico", "Barba", "Afeitado"],
    },
    {
      id: 3,
      name: "María",
      last_name: "González",
      specialty: "Manicurista",
      rating: 4.7,
      experience: "6 años",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      services: ["Manicure", "Pedicure", "Gel"],
    },
  ];

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
            Cargando establecimiento...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !place) {
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
            {error || "No se pudo cargar el establecimiento"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={fetchPlaceDetails}>
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
        <TouchableOpacity style={styles.headerButton}>
          <View style={styles.headerButtonBg}>
            <Ionicons name="heart-outline" color="#ffffff" size={24} />
          </View>
        </TouchableOpacity>
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
            {salonImages.map((item, index) => (
              <View key={item.id} style={styles.carouselImageContainer}>
                <Image source={{uri: item.image}} style={styles.heroImage} />
                <View style={styles.imageOverlay} />
              </View>
            ))}
          </ScrollView>

          {/* Carousel Indicators */}
          <View style={styles.carouselIndicators}>
            {salonImages.map((_, index) => (
              <View
                key={index}
                style={[styles.indicator, index === currentImageIndex && styles.activeIndicator]}
              />
            ))}
          </View>

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>★ 4.9</Text>
          </View>
        </View>

        {/* Profile Info */}
        <Animated.View style={[styles.profileInfo, {opacity: fadeAnim}]}>
          <View style={styles.profileHeader}>
            <View style={styles.profileTextContainer}>
              <Text style={[styles.placeName, {color: colors.foreground}]}>{place.name}</Text>
              <View style={styles.placeMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" color={colors.mutedForeground} size={14} />
                  <Text style={[styles.metaText, {color: colors.mutedForeground}]}>560m</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people" color={colors.mutedForeground} size={14} />
                  <Text style={[styles.metaText, {color: colors.mutedForeground}]}>
                    1690 Seguidores
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.followButton, {backgroundColor: colors.primary}]}>
              <Ionicons name="checkmark" color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={[styles.infoCard, {backgroundColor: colors.card}]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="time" color={colors.primary} size={20} />
                <Text style={[styles.infoCardTitle, {color: colors.foreground}]}>Horarios</Text>
              </View>
              <Text style={[styles.infoCardText, {color: colors.mutedForeground}]}>
                Lun - Vie: 10AM - 8PM{"\n"}
                Sab - Dom: 10AM - 5PM
              </Text>
            </View>

            <View style={[styles.infoCard, {backgroundColor: colors.card}]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="location" color={colors.primary} size={20} />
                <Text style={[styles.infoCardTitle, {color: colors.foreground}]}>Ubicación</Text>
              </View>
              <Text style={[styles.infoCardText, {color: colors.mutedForeground}]}>
                {place.address}
              </Text>
              <TouchableOpacity style={[styles.locationButton, {backgroundColor: "#22C55E"}]}>
                <Text style={styles.locationButtonText}>Cómo llegar</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                activeTab === "profesionales" && [
                  styles.activeTab,
                  {borderBottomColor: colors.primary},
                ],
              ]}
              onPress={() => setActiveTab("profesionales")}>
              <Text
                style={[
                  styles.tabText,
                  {color: activeTab === "profesionales" ? colors.primary : colors.mutedForeground},
                ]}>
                Profesionales
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
              {place.services && place.services.length > 0 ? (
                place.services.map((service: any, index: number) => (
                  <View
                    key={service.id}
                    style={[styles.serviceCard, {backgroundColor: colors.background}]}>
                    <View style={styles.serviceImageContainer}>
                      <View
                        style={[
                          styles.serviceImagePlaceholder,
                          {backgroundColor: getServiceColor(index)},
                        ]}>
                        <Ionicons name={getServiceIcon(index)} color="#ffffff" size={24} />
                      </View>
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, {color: colors.foreground}]}>
                        {service.name}
                      </Text>
                      <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                        {service.description}
                      </Text>
                      <View style={styles.serviceDetails}>
                        <View style={styles.serviceDetail}>
                          <Ionicons name="time-outline" color={colors.primary} size={16} />
                          <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                            {service.duration}
                          </Text>
                        </View>
                        <Text style={[styles.servicePrice, {color: colors.primary}]}>
                          ${service.price} MXN
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.bookButton, {backgroundColor: colors.primary}]}
                      onPress={() => {
                        setSelectedService(service);
                        setShowBookingFlow(true);
                      }}
                      activeOpacity={0.8}>
                      <Text style={styles.bookButtonText}>Reservar</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="business-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
                    No hay servicios disponibles
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "profesionales" && (
            <View style={[styles.professionalsSection, {backgroundColor: colors.card}]}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                Nuestros Profesionales
              </Text>
              <Text style={[styles.sectionSubtitle, {color: colors.mutedForeground}]}>
                Conoce al equipo que te atenderá
              </Text>

              {salonProfessionals.map((professional, index) => (
                <View
                  key={professional.id}
                  style={[styles.professionalCard, {backgroundColor: colors.background}]}>
                  <Image source={{uri: professional.avatar}} style={styles.professionalAvatar} />
                  <View style={styles.professionalInfo}>
                    <Text style={[styles.professionalName, {color: colors.foreground}]}>
                      {professional.name} {professional.last_name}
                    </Text>
                    <Text style={[styles.professionalSpecialty, {color: colors.primary}]}>
                      {professional.specialty}
                    </Text>
                    <View style={styles.professionalMeta}>
                      <View style={styles.professionalRating}>
                        <Ionicons name="star" color="#FFD700" size={14} />
                        <Text style={[styles.professionalRatingText, {color: colors.foreground}]}>
                          {professional.rating}
                        </Text>
                      </View>
                      <Text
                        style={[styles.professionalExperience, {color: colors.mutedForeground}]}>
                        • {professional.experience}
                      </Text>
                    </View>
                    <View style={styles.professionalServices}>
                      {professional.services.map((service, serviceIndex) => (
                        <View
                          key={serviceIndex}
                          style={[styles.serviceTag, {backgroundColor: colors.muted}]}>
                          <Text style={[styles.serviceTagText, {color: colors.foreground}]}>
                            {service}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.viewProfessionalButton, {backgroundColor: colors.primary}]}
                    onPress={() => router.push(`/professional/${professional.id}`)}
                    activeOpacity={0.8}>
                    <Ionicons name="eye" color="#ffffff" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === "opiniones" && (
            <View style={[styles.reviewsSection, {backgroundColor: colors.card}]}>
              {place.reviews && place.reviews.length > 0 ? (
                place.reviews.map((review: any) => (
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

      {/* Fixed Bottom Button */}
      <View style={[styles.fixedBottomButton, {backgroundColor: colors.background}]}>
        <TouchableOpacity
          style={[styles.primaryButton, {backgroundColor: colors.primary}]}
          activeOpacity={0.9}
          onPress={() => {
            if (place.services && place.services.length > 0) {
              setSelectedService(place.services[0]);
              setShowBookingFlow(true);
            }
          }}>
          <Ionicons name="calendar" color="#ffffff" size={20} />
          <Text style={styles.primaryButtonText}>Agendar Cita</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Flow Modal */}
      {selectedService && (
        <BookingFlow
          isVisible={showBookingFlow}
          onClose={() => setShowBookingFlow(false)}
          provider={place}
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
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingBadgeText: {
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  profileTextContainer: {
    flex: 1,
  },
  placeName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  placeMeta: {
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
  followButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  infoCards: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoCardText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceImageContainer: {
    marginRight: 12,
  },
  serviceImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceDetailText: {
    fontSize: 14,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  bookButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 12,
  },
  bookButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
  // Professionals Section
  professionalsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  professionalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  professionalSpecialty: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  professionalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  professionalRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  professionalRatingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  professionalExperience: {
    fontSize: 13,
  },
  professionalServices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  serviceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  viewProfessionalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  fixedBottomButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
