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
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {providerApi, postApi, reviewApi, serviceApi} from "@/lib/api";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {errorUtils} from "@/lib/api";
import {getSubCategoryById, MAIN_CATEGORIES, getAvatarColorFromSubcategory} from "@/constants/categories";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function ProfileDetailScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "reviews">("services");
  const [showBooking, setShowBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileResponse = await providerApi.getPublicProfile(Number(id));
      const profileData = profileResponse.data;
      setProfile(profileData);

      // Fetch related data (using public APIs that don't require authentication)
      const [postsResponse, reviewsResponse] = await Promise.all([
        postApi.getPosts({user: profileData.user}).catch(() => ({data: {results: []}})),
        reviewApi.getReviews({to_public_profile: Number(id)}).catch(() => ({data: {results: []}})),
      ]);

      // Fetch services from the public profile data (accessible to everyone)
      // If not available in public profile, try the service API (now public for list/retrieve)
      let servicesData: any[] = [];
      
      // First, check if services are already in the public profile data
      if (profileData.services && Array.isArray(profileData.services)) {
        servicesData = profileData.services;
      } else {
        // Fallback: try to get from service API based on profile type
        try {
          if (profileData.profile_type === "PLACE") {
            // For places, get place services
            const servicesResponse = await serviceApi.getPlaceServices({
              place: profileData.user,
              is_active: true,
            });
            servicesData = servicesResponse.data.results || [];
          } else {
            // For professionals, get professional services
            const servicesResponse = await serviceApi.getProfessionalServices({
              professional: profileData.user,
              is_active: true,
            });
            servicesData = servicesResponse.data.results || [];
          }
        } catch (serviceError) {
          console.log("Services not available from API:", serviceError);
          // If both fail, just use empty array - page will still work
          servicesData = [];
        }
      }

      setPosts(postsResponse.data.results || []);
      setReviews(reviewsResponse.data.results || []);
      setServices(servicesData);

      console.log("📋 Public Profile data:", JSON.stringify(profileData, null, 2));
      console.log("📋 Category:", profileData.category);
      console.log("📋 Sub categories:", profileData.sub_categories);

      // Animate content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const renderStars = (rating: number | string | null | undefined) => {
    const stars = [];
    const numericRating = Number(rating) || 0;
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" color="#FFD700" size={16} />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" color="#FFD700" size={16} />);
    }
    const emptyStars = 5 - Math.ceil(numericRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" color="#FFD700" size={16} />);
    }
    return stars;
  };

  const renderServices = () => {
    if (services.length === 0) {
      return (
        <View style={styles.noContentContainer}>
          <Ionicons name="briefcase-outline" size={60} color={colors.mutedForeground} />
          <Text style={[styles.noContentText, {color: colors.mutedForeground}]}>
            No hay servicios disponibles
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <View
            key={service.id || index}
            style={[
              styles.serviceCard,
              {backgroundColor: colors.background, borderColor: colors.border},
            ]}>
            <View style={styles.serviceImageContainer}>
              {service.image_url ? (
                <Image source={{uri: service.image_url}} style={styles.serviceImage} />
              ) : (
                <View
                  style={[styles.serviceImagePlaceholder, {backgroundColor: colors.muted + "20"}]}>
                  <Ionicons name="briefcase-outline" size={30} color={colors.mutedForeground} />
                </View>
              )}
            </View>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceName, {color: colors.foreground}]}>{service.name}</Text>
              <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                {service.description}
              </Text>
              <View style={styles.serviceDetails}>
                <View style={styles.serviceDetailItem}>
                  <Ionicons name="time-outline" color={colors.mutedForeground} size={16} />
                  <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                    {service.duration_minutes || service.duration} min
                  </Text>
                </View>
                <Text style={[styles.servicePrice, {color: colors.primary}]}>
                  ${service.price} MXN
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderReviews = () => {
    if (reviews.length === 0) {
      return (
        <View style={styles.noContentContainer}>
          <Ionicons name="star-outline" size={60} color={colors.mutedForeground} />
          <Text style={[styles.noContentText, {color: colors.mutedForeground}]}>
            No hay reseñas disponibles
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.reviewsContainer}>
        {reviews.map((review, index) => (
          <View
            key={review.id || index}
            style={[
              styles.reviewCard,
              {backgroundColor: colors.background, borderColor: colors.border},
            ]}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewerAvatar, {backgroundColor: colors.muted + "20"}]}>
                <Text style={[styles.reviewerInitial, {color: colors.mutedForeground}]}>
                  {(review.from_user_name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.reviewInfo}>
                <Text style={[styles.reviewerName, {color: colors.foreground}]}>
                  {review.from_user_name || "Usuario"}
                </Text>
                <View style={styles.reviewRating}>{renderStars(review.rating)}</View>
              </View>
            </View>
            {review.message && (
              <Text style={[styles.reviewMessage, {color: colors.mutedForeground}]}>
                {review.message}
              </Text>
            )}
            <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}>
              {new Date(review.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.foreground}]}>Cargando perfil...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={80} color="#FF6B6B" />
        <Text style={[styles.errorTitle, {color: colors.foreground}]}>
          Error al cargar el perfil
        </Text>
        <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
          {error || "No se pudo cargar la información del perfil"}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: colors.primary}]}
          onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 40,
          },
        ]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              // Fallback to explore page if no history
              router.push("/(tabs)/explore");
            }
          }}
          style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>
          {profile.profile_type === "PROFESSIONAL" ? "Perfil: Profesionales" : "Perfil: Salones"}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="heart-outline" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="share-outline" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.profileSection, {opacity: fadeAnim}]}>
          {/* Hero Section with Image Slider */}
          <View style={styles.heroSection}>
            {profile.images && profile.images.length > 0 ? (
              <View style={styles.imageSliderContainer}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setCurrentImageIndex(index);
                  }}
                  style={styles.imageSlider}>
                  {profile.images.map((imageUrl: string, index: number) => (
                    <Image
                      key={index}
                      source={{uri: imageUrl}}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>

                {/* Image Dots Indicator */}
                {profile.images.length > 1 && (
                  <View style={styles.dotsContainer}>
                    {profile.images.map((_, index: number) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              index === currentImageIndex
                                ? colors.foreground
                                : colors.mutedForeground + "50",
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.heroImagePlaceholder}>
                <Ionicons name="image-outline" color={colors.mutedForeground} size={60} />
              </View>
            )}

            {/* Rating Badge */}
            <View style={[styles.ratingBadge, {backgroundColor: colors.card}]}>
              <Ionicons name="star" color="#FF6B6B" size={16} />
              <Text style={[styles.ratingText, {color: colors.foreground}]}>
                {(Number(profile.rating) || 0).toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            {/* Row 1: avatar - name/role - settings */}
            <View style={styles.profileRowTop}>
              <View
                style={[
                  styles.profileAvatar,
                  {
                    backgroundColor: getAvatarColorFromSubcategory(
                      profile.category,
                      profile.sub_categories
                    ),
                  },
                ]}>
                <Text style={styles.profileAvatarText}>
                  {(profile.name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileNameRole}>
                <Text style={[styles.profileName, {color: colors.foreground}]} numberOfLines={1}>
                  {profile.name || "Sin nombre"}
                </Text>
                <Text style={[styles.profileRole, {color: colors.mutedForeground}]} numberOfLines={1}>
                  {profile.profile_type === "PROFESSIONAL" ? "Profesional" : "Salón"}
                </Text>
                {/* Category and Subcategory */}
                {(profile.category || (profile.sub_categories && profile.sub_categories.length > 0)) && (
                  <View style={styles.profileCategoryContainer}>
                    {profile.category && (
                      <Text style={[styles.profileCategory, {color: colors.mutedForeground}]}>
                        {MAIN_CATEGORIES.find((c) => c.id === profile.category)?.name || profile.category}
                      </Text>
                    )}
                    {profile.sub_categories && profile.sub_categories.length > 0 && (
                      <View style={styles.profileSubcategoryContainer}>
                        {profile.sub_categories.map((subId: string, idx: number) => {
                          const subCategory = getSubCategoryById(profile.category || "", subId);
                          return subCategory ? (
                            <Text
                              key={idx}
                              style={[styles.profileSubcategory, {color: colors.mutedForeground}]}>
                              {idx > 0 ? " • " : ""}
                              {subCategory.name}
                            </Text>
                          ) : null;
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Row 2: actions */}
            <View style={styles.profileRowActions}>
              <TouchableOpacity
                style={[styles.primaryAction, {backgroundColor: colors.primary}]}
                activeOpacity={0.9}
              >
                <Ionicons name="color-wand" size={16} color="#ffffff" />
                <Text style={styles.primaryActionText}>Personalizar Perfil</Text>
                <Ionicons name="chevron-down" size={14} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryAction, {borderColor: colors.border}]}
                activeOpacity={0.9}
              >
                <Ionicons name="eye-outline" size={16} color={colors.foreground} />
                <Text style={[styles.secondaryActionText, {color: colors.foreground}]}>Ver como cliente</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabsContainer, {backgroundColor: colors.muted + "20"}]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "services" && [
                  styles.activeTab,
                  {backgroundColor: colors.background},
                ],
              ]}
              onPress={() => setActiveTab("services")}>
              <Text
                style={[
                  styles.tabText,
                  {color: colors.mutedForeground},
                  activeTab === "services" && [styles.activeTabText, {color: colors.foreground}],
                ]}>
                Servicios
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "reviews" && [styles.activeTab, {backgroundColor: colors.background}],
              ]}
              onPress={() => setActiveTab("reviews")}>
              <Text
                style={[
                  styles.tabText,
                  {color: colors.mutedForeground},
                  activeTab === "reviews" && [styles.activeTabText, {color: colors.foreground}],
                ]}>
                Opiniones
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === "services" && renderServices()}
            {activeTab === "reviews" && renderReviews()}
          </View>

          {/* Information Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, {color: colors.foreground}]}>Horarios</Text>
              <Text style={[styles.infoValue, {color: colors.mutedForeground}]}>
                Lun - Vie : 10AM - 8PM
              </Text>
              <Text style={[styles.infoValue, {color: colors.mutedForeground}]}>
                Sab - Dom : 10AM - 5PM
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, {color: colors.foreground}]}>Ubicación</Text>
              <Text style={[styles.infoValue, {color: colors.mutedForeground}]}>
                {profile.street && `${profile.street}, `}
                {profile.city}, {profile.country}
              </Text>
              <TouchableOpacity style={[styles.locationButton, {backgroundColor: colors.primary}]}>
                <Text style={styles.locationButtonText}>Cómo llegar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionContainer,
          {backgroundColor: colors.background, borderTopColor: colors.border},
        ]}>
        <TouchableOpacity
          style={[styles.primaryButton, {backgroundColor: colors.primary}]}
          onPress={() => setShowBooking(true)}>
          <Text style={styles.primaryButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      {showBooking && (
        <BookingFlow
          profile={profile}
          onClose={() => setShowBooking(false)}
          onBookingComplete={() => {
            setShowBooking(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    paddingBottom: 100,
  },
  heroSection: {
    position: "relative",
    height: 200,
  },
  imageSliderContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  imageSlider: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  heroImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileInfo: {
    padding: 20,
    alignItems: "stretch",
  },
  profileRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  profileNameRole: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 0,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  profileCategoryContainer: {
    marginTop: 4,
    gap: 2,
  },
  profileCategory: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  profileSubcategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  profileSubcategory: {
    fontSize: 11,
    fontWeight: "400",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  profileRowActions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexShrink: 1,
  },
  primaryActionText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 1,
  },
  secondaryActionText: {
    fontWeight: "600",
  },
  profileDistance: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  followersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  followersText: {
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  tabContent: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  servicesContainer: {
    gap: 16,
  },
  serviceCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  serviceImageContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  serviceImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 14,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "600",
  },
  reviewsContainer: {
    gap: 16,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: "600",
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
  },
  infoSection: {
    paddingHorizontal: 16,
    gap: 20,
  },
  infoItem: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  noContentContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noContentText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
