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
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@/hooks/useNavigation";
import {providerApi, serviceApi, reviewApi, postApi, profileCustomizationApi} from "@/lib/api";
import {PlaceProfile} from "@/types/global";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {SubCategoryBar} from "@/components/ui/SubCategoryBar";
import {errorUtils} from "@/lib/api";
import {getSubCategoryById, MAIN_CATEGORIES} from "@/constants/categories";
import {useAuth} from "@/features/auth";
import {MediaUploader} from "@/components/posts/MediaUploader";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function PlaceDetailScreen() {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {goBack} = useNavigation();
  const insets = useSafeAreaInsets();
  const {id} = useLocalSearchParams<{id: string}>();

  // Extract numeric ID from the string (e.g., "place_0_1761200070463" -> "1761200070463")
  const numericId = id?.includes("_") ? id.split("_").pop() : id;

  // Validate that we have a valid numeric ID
  if (!numericId || isNaN(Number(numericId))) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/(tabs)/explore")}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" color="#ef4444" size={64} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            ID de establecimiento inválido
          </Text>
        </View>
      </View>
    );
  }

  const [place, setPlace] = useState<PlaceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "servicios" | "profesionales" | "posts" | "opiniones" | "personalizar"
  >("servicios");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // Profile customization data
  const [profileImages, setProfileImages] = useState<any[]>([]);
  const [customServices, setCustomServices] = useState<any[]>([]);
  const [availabilitySchedule, setAvailabilitySchedule] = useState<any[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Posts data - will be fetched from API in real implementation
  const [salonPosts, setSalonPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const {user, isAuthenticated} = useAuth();
  const canSubmitReview = isAuthenticated && user?.role === "CLIENT";

  useEffect(() => {
    const fetchPlacePosts = async () => {
      try {
        // Fetch posts from place and its professionals
        const [placePostsResponse, professionalPostsResponse] = await Promise.all([
          postApi.getPosts({author: Number(numericId), page_size: 10}),
          postApi.getPosts({page_size: 10}), // Get some general posts as fallback
        ]);

        const placePosts = placePostsResponse.data.results || [];
        const allPosts = professionalPostsResponse.data.results || [];

        // Combine and deduplicate posts
        const combinedPosts = [...placePosts, ...allPosts].slice(0, 10);
        setSalonPosts(combinedPosts);
      } catch (error) {
        console.error("Error fetching place posts:", error);
        // Keep empty array as fallback
      }
    };

    fetchPlacePosts();
  }, [numericId]);

  useEffect(() => {
    fetchPlaceDetails();
  }, [numericId]);

  useEffect(() => {
    loadReviews();
  }, [numericId]);

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

      // Fetch place details
      const placeResponse = await providerApi.getPlaceProfile(Number(numericId));
      const placeData = placeResponse.data;

      // Fetch place services
      const servicesResponse = await serviceApi.getPlaceServices({
        place: Number(numericId),
        is_active: true,
      });

      // Fetch place professionals
      const professionalsResponse = await providerApi.getProfessionalProfiles({
        place: Number(numericId),
        page_size: 20,
      });

      // Transform API response to match expected format for UI
      const transformedPlace: PlaceProfile = {
        id: placeData.id,
        user_id: placeData.id,
        email: "",
        name: placeData.name,
        street: placeData.street || placeData.address,
        city: placeData.city,
        country: placeData.country || "México",
        services_count: placeData.services_count || 0,
        address: placeData.street || placeData.address || "Dirección no disponible",
        category: placeData.category,
        sub_categories: placeData.sub_categories || [],
        rating: placeData.rating || 0,
        type: "place",
        coordinates: {
          top: "50%",
          left: "50%",
        },
        avatar: "🏢",
        distance: "0.5 km",
        services: servicesResponse.data.results.map((service: any) => ({
          id: service.id,
          name: service.service_name || service.name,
          duration: service.time || "1 hr",
          price: service.price,
          description: service.description || "Servicio disponible",
        })),
        professionals: professionalsResponse.data.results.map((prof: any) => ({
          id: prof.id,
          name: prof.user?.first_name || prof.name || "Nombre no disponible",
          last_name: prof.user?.last_name || prof.last_name || "",
          rating: prof.rating || 4.5,
        })),
      };

      // Fetch profile customization data
      try {
        const [imagesResponse, servicesResponse, availabilityResponse] = await Promise.all([
          profileCustomizationApi.getProfileImages(),
          profileCustomizationApi.getCustomServices(),
          profileCustomizationApi.getAvailabilitySchedule(),
        ]);

        setProfileImages(imagesResponse.data || []);
        setCustomServices(servicesResponse.data || []);
        setAvailabilitySchedule(availabilityResponse.data || []);
      } catch (customizationError) {
        console.log("Profile customization data not available:", customizationError);
        // Don't fail the entire request if customization data is not available
      }

      setPlace(transformedPlace);
    } catch (err: any) {
      console.error("Error fetching place:", err);
      setError(errorUtils.getErrorMessage(err) || "Error al cargar el establecimiento");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await reviewApi.getReviews({public_profile: Number(numericId)});
      const data = response.data;
      const resultList = Array.isArray(data) ? data : data.results || [];
      const total = data.count ?? resultList.length ?? 0;
      setReviews(resultList);
      setReviewsCount(total);
    } catch (err) {
      console.error("Error fetching place reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const resetReviewForm = () => {
    setReviewRating(0);
    setReviewMessage("");
    setReviewPhotos([]);
  };

  const refreshPlaceRating = async () => {
    try {
      const response = await providerApi.getPlaceProfile(Number(numericId));
      const latestRating = response.data?.rating ?? place?.rating;
      setPlace((prev) => (prev ? {...prev, rating: latestRating ?? prev.rating} : prev));
    } catch (err) {
      console.error("Error refreshing place rating:", err);
    }
  };

  const renderRatingStars = (rating: number) => (
    <View style={styles.reviewRating}>
      {[...Array(5)].map((_, index) => (
        <Ionicons
          key={index}
          name={index < rating ? "star" : "star-outline"}
          color="#FFD700"
          size={16}
        />
      ))}
    </View>
  );

  const renderSelectableStars = () => (
    <View style={styles.selectableStarsRow}>
      {[1, 2, 3, 4, 5].map((value) => (
        <TouchableOpacity key={value} onPress={() => setReviewRating(value)} activeOpacity={0.7}>
          <Ionicons
            name={value <= reviewRating ? "star" : "star-outline"}
            size={28}
            color={value <= reviewRating ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleOpenReviewModal = () => {
    if (!canSubmitReview) {
      Alert.alert("Solo clientes", "Debes iniciar sesión como cliente para reseñar.");
      return;
    }
    resetReviewForm();
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!canSubmitReview) {
      Alert.alert("Inicia sesión", "Necesitas ser cliente para dejar una reseña.");
      return;
    }

    if (reviewRating === 0) {
      Alert.alert("Calificación requerida", "Selecciona una calificación para tu reseña.");
      return;
    }

    try {
      setSubmittingReview(true);

      const formData = new FormData();
      formData.append("to_public_profile", String(numericId));
      formData.append("rating", String(reviewRating));
      if (reviewMessage.trim()) {
        formData.append("message", reviewMessage.trim());
      }

      if (reviewPhotos.length > 0) {
        if (Platform.OS === "web") {
          await Promise.all(
            reviewPhotos.map(async (uri, index) => {
              const res = await fetch(uri);
              const blob = await res.blob();
              const mimeType = blob.type || "image/jpeg";
              const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
              const file = new File([blob], `review_${Date.now()}_${index}.${ext}`, {
                type: mimeType,
              });
              formData.append("images", file);
            })
          );
        } else {
          reviewPhotos.forEach((uri, index) => {
            const extension = uri.split(".").pop() || "jpg";
            const file = {
              uri,
              type: `image/${extension === "jpg" ? "jpeg" : extension}`,
              name: `review_${Date.now()}_${index}.${extension}`,
            } as any;
            formData.append("images", file);
          });
        }
      }

      await reviewApi.createReview(formData);

      Alert.alert("¡Gracias!", "Tu reseña se publicó exitosamente.");
      setReviewModalVisible(false);
      resetReviewForm();
      await loadReviews();
      await refreshPlaceRating();
    } catch (err: any) {
      console.error("Error creando reseña:", err);
      Alert.alert(
        "Error",
        errorUtils.getErrorMessage?.(err) || "No se pudo publicar tu reseña. Intenta de nuevo."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // Salon images - would come from API in real implementation
  const [salonImages, setSalonImages] = useState<any[]>([
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
  ]);

  useEffect(() => {
    const fetchSalonImages = async () => {
      try {
        // In a real implementation, this would fetch from the place's gallery
        // For now, we'll use placeholder images
        setSalonImages([
          {
            id: 1,
            image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
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
        console.error("Error fetching salon images:", error);
      }
    };

    fetchSalonImages();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/(tabs)/explore")}>
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
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/(tabs)/explore")}>
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
      <View
        style={[
          styles.header,
          {
            backgroundColor: "transparent",
            paddingTop: Math.max(insets.top + 16, 20),
          },
        ]}>
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
              {/* Category and Subcategory */}
              {(place.category || (place.sub_categories && place.sub_categories.length > 0)) && (
                <View style={styles.categoryContainer}>
                  {place.category && (
                    <View style={[styles.categoryBadge, {backgroundColor: colors.primary + "15"}]}>
                      <Ionicons name="pricetag" color={colors.primary} size={12} />
                      <Text style={[styles.categoryText, {color: colors.primary}]}>
                        {MAIN_CATEGORIES.find((c) => c.id === place.category)?.name || place.category}
                      </Text>
                    </View>
                  )}
                  {place.sub_categories && place.sub_categories.length > 0 && (
                    <View style={styles.subcategoryContainer}>
                      {place.sub_categories.map((subId, idx) => {
                        const subCategory = getSubCategoryById(place.category || "", subId);
                        return subCategory ? (
                          <View
                            key={idx}
                            style={[
                              styles.subcategoryBadge,
                              {
                                backgroundColor: subCategory.color ? subCategory.color + "20" : colors.muted + "40",
                                borderColor: subCategory.color || colors.border,
                              },
                            ]}>
                            <Text style={[styles.subcategoryText, {color: subCategory.color || colors.foreground}]}>
                              {subCategory.name}
                            </Text>
                          </View>
                        ) : null;
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={[styles.ratingBadge, {backgroundColor: "#EF4444"}]}>
              <Ionicons name="star" color="#ffffff" size={16} />
              <Text style={styles.ratingText}>
                {Number(place.rating || 0).toFixed(1)}
              </Text>
            </View>
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
                Pros
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
                Posts
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
                Reviews
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "personalizar" && [
                  styles.activeTab,
                  {borderBottomColor: colors.primary},
                ],
              ]}
              onPress={() => setActiveTab("personalizar")}>
              <Text
                style={[
                  styles.tabText,
                  {color: activeTab === "personalizar" ? colors.primary : colors.mutedForeground},
                ]}>
                Personalizar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sub-Category Bar */}
          <View style={styles.subCategoryContainer}>
            <SubCategoryBar
              categories={[
                {id: "todos", name: "Todos", icon: "apps"},
                {id: "cabello", name: "Cabello", icon: "cut"},
                {id: "pestanas", name: "Pestañas", icon: "eye"},
                {id: "cejas", name: "Cejas", icon: "eye-outline"},
                {id: "maquillaje_peinado", name: "Maquillaje y Peinado", icon: "brush"},
                {id: "manos_pies", name: "Manos y Pies", icon: "hand-left"},
                {id: "faciales", name: "Faciales", icon: "flower"},
                {id: "barberia", name: "Barbería", icon: "cut"},
              ]}
              selectedCategoryId={selectedCategory}
              onCategorySelect={setSelectedCategory}
              showLabels={true}
            />
          </View>

          {/* Tab Content */}
          {activeTab === "servicios" && (
            <View style={[styles.servicesSection, {backgroundColor: colors.card}]}>
              {place.services && place.services.length > 0 ? (
                place.services.map((service: any, index: number) => (
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

              {place.professionals && place.professionals.length > 0 ? (
                <View style={styles.professionalsGrid}>
                  {place.professionals.map((professional, index) => {
                    const borderColors = [
                      "#8B5CF6",
                      "#10B981",
                      "#3B82F6",
                      "#F59E0B",
                      "#10B981",
                      "#8B5CF6",
                    ];
                    const borderColor = borderColors[index % borderColors.length];

                    return (
                      <TouchableOpacity
                        key={professional.id}
                        style={[
                          styles.professionalCardGrid,
                          index % 2 === 0
                            ? styles.professionalCardLeft
                            : styles.professionalCardRight,
                        ]}
                        onPress={() => router.push(`/professional/${professional.id}`)}
                        activeOpacity={0.8}>
                        <View style={[styles.professionalImageContainer, {borderColor}]}>
                          <View
                            style={[
                              styles.professionalAvatarGrid,
                              {backgroundColor: colors.primary},
                            ]}>
                            <Text style={styles.professionalAvatarTextGrid}>
                              {professional.name.charAt(0)}
                              {professional.last_name.charAt(0)}
                            </Text>
                          </View>
                          <View style={[styles.ratingBadgeGrid, {backgroundColor: borderColor}]}>
                            <Ionicons name="star" color="#ffffff" size={12} />
                            <Text style={styles.ratingBadgeTextGrid}>{professional.rating}</Text>
                          </View>
                        </View>
                        <Text style={[styles.professionalNameGrid, {color: colors.foreground}]}>
                          {professional.name} {professional.last_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
                    No hay profesionales disponibles
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "posts" && (
            <View style={styles.postsSection}>
              <View style={styles.postsGrid}>
                {salonPosts.map((post, index) => (
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
              <View style={styles.reviewsHeader}>
                <Text style={[styles.reviewsTitle, {color: colors.foreground}]}> 
                  Reseñas ({reviewsCount})
                </Text>
                {canSubmitReview && (
                  <TouchableOpacity
                    style={[styles.addReviewButton, {backgroundColor: colors.primary}]}
                    onPress={handleOpenReviewModal}
                    activeOpacity={0.85}>
                    <Ionicons name="create" size={16} color="#ffffff" />
                    <Text style={styles.addReviewButtonText}>Escribir reseña</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingReviews ? (
                <View style={styles.loadingReviews}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : reviews.length > 0 ? (
                reviews.map((review: any) => {
                  const createdAt = review.created_at ? new Date(review.created_at) : null;
                  const imageUrls = Array.isArray(review.images)
                    ? review.images.map((img: any) => (typeof img === "string" ? img : img.url))
                    : [];

                  return (
                    <View
                      key={review.id}
                      style={[styles.reviewCard, {borderBottomColor: colors.border}]}> 
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewAuthor}>
                          <View style={[styles.reviewAvatar, {backgroundColor: colors.primary}]}> 
                            <Text style={styles.reviewAvatarText}>
                              {(review.reviewer_name || "C")
                                .toString()
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.reviewAuthorInfo}>
                            <Text style={[styles.reviewAuthorName, {color: colors.foreground}]}> 
                              {review.reviewer_name || "Cliente"}
                            </Text>
                            {renderRatingStars(review.rating || 0)}
                          </View>
                        </View>
                        {createdAt && (
                          <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}> 
                            {createdAt.toLocaleDateString("es-MX")}
                          </Text>
                        )}
                      </View>

                      {review.message ? (
                        <Text style={[styles.reviewComment, {color: colors.foreground}]}> 
                          {review.message}
                        </Text>
                      ) : null}

                      {imageUrls.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.reviewImagesRow}>
                          {imageUrls.map((uri: string, index: number) => (
                            <Image
                              key={`${review.id}-img-${index}`}
                              source={{uri}}
                              style={styles.reviewImageThumb}
                            />
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })
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

          {activeTab === "personalizar" && (
            <View style={[styles.personalizarSection, {backgroundColor: colors.card}]}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                Personalizar Perfil
              </Text>
              <Text style={[styles.sectionSubtitle, {color: colors.mutedForeground}]}>
                Personaliza tu establecimiento para atraer más clientes
              </Text>

              {/* Image Gallery Section */}
              <View style={styles.personalizarCard}>
                <View style={styles.personalizarCardHeader}>
                  <Ionicons name="images" color={colors.primary} size={20} />
                  <Text style={[styles.personalizarCardTitle, {color: colors.foreground}]}>
                    Galería de Imágenes (0/10)
                  </Text>
                </View>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Agrega imágenes de tu establecimiento para mostrar a los clientes
                </Text>
                <View style={styles.imageGalleryPlaceholder}>
                  <Ionicons name="image-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.placeholderText, {color: colors.mutedForeground}]}>
                    No hay imágenes
                  </Text>
                  <Text style={[styles.placeholderSubtext, {color: colors.mutedForeground}]}>
                    Agrega imágenes de tu establecimiento para atraer más clientes
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addImageButton, {backgroundColor: colors.primary}]}
                  onPress={() => {
                    // Navigate to profile customization or show image picker
                    console.log("Add image functionality - implement as needed");
                  }}
                  activeOpacity={0.8}>
                  <Ionicons name="camera" color="#ffffff" size={20} />
                  <Text style={styles.addImageButtonText}>Agregar Primera Imagen</Text>
                </TouchableOpacity>
              </View>

              {/* Services Management Section */}
              <View style={styles.personalizarCard}>
                <View style={styles.personalizarCardHeader}>
                  <Ionicons name="briefcase" color={colors.primary} size={20} />
                  <Text style={[styles.personalizarCardTitle, {color: colors.foreground}]}>
                    Servicios del Establecimiento
                  </Text>
                </View>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Gestiona los servicios que ofrece tu establecimiento
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

              {/* Professionals Management Section */}
              <View style={styles.personalizarCard}>
                <View style={styles.personalizarCardHeader}>
                  <Ionicons name="people" color={colors.primary} size={20} />
                  <Text style={[styles.personalizarCardTitle, {color: colors.foreground}]}>
                    Profesionales
                  </Text>
                </View>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Gestiona los profesionales que trabajan en tu establecimiento
                </Text>
                <TouchableOpacity
                  style={[styles.manageButton, {backgroundColor: colors.primary}]}
                  activeOpacity={0.8}
                  onPress={() => router.push("/place/manage-links")}>
                  <Text style={styles.manageButtonText}>Gestionar Profesionales</Text>
                  <Ionicons name="chevron-forward" color="#ffffff" size={16} />
                </TouchableOpacity>
              </View>

              {/* Availability Section */}
              <View style={styles.personalizarCard}>
                <View style={styles.personalizarCardHeader}>
                  <Ionicons name="calendar" color={colors.primary} size={20} />
                  <Text style={[styles.personalizarCardTitle, {color: colors.foreground}]}>
                    Horarios del Establecimiento
                  </Text>
                </View>
                <Text style={[styles.personalizarCardDescription, {color: colors.mutedForeground}]}>
                  Configura los horarios de atención de tu establecimiento
                </Text>
                <TouchableOpacity
                  style={[styles.manageButton, {backgroundColor: colors.primary}]}
                  activeOpacity={0.8}
                  onPress={() => router.push("/place/manage-links")}>
                  <Text style={styles.manageButtonText}>Configurar Horarios</Text>
                  <Ionicons name="chevron-forward" color="#ffffff" size={16} />
                </TouchableOpacity>
              </View>
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
          provider={place}
          service={selectedService}
          availableProfessionals={place.professionals}
        />
      )}

      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.reviewModalContainer, {backgroundColor: colors.card}]}> 
            <View style={styles.reviewModalHeader}>
              <Text style={[styles.reviewModalTitle, {color: colors.foreground}]}> 
                Escribir reseña
              </Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.reviewModalSubtitle, {color: colors.mutedForeground}]}> 
              ¿Cómo fue tu experiencia en este lugar?
            </Text>

            {renderSelectableStars()}

            <TextInput
              style={[styles.reviewInput, {borderColor: colors.border, color: colors.foreground}]}
              placeholder="Comparte detalles que puedan ayudar a otros clientes"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              value={reviewMessage}
              onChangeText={setReviewMessage}
              textAlignVertical="top"
            />

            <MediaUploader
              mediaType="photo"
              maxFiles={4}
              selectedMedia={reviewPhotos}
              onMediaSelected={setReviewPhotos}
            />

            <TouchableOpacity
              style={[styles.submitReviewButton, {backgroundColor: colors.primary}]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
              activeOpacity={0.85}>
              {submittingReview ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#ffffff" />
                  <Text style={styles.submitReviewButtonText}>Enviar reseña</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  categoryContainer: {
    marginTop: 12,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  subcategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  subcategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  subcategoryText: {
    fontSize: 11,
    fontWeight: "600",
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
  infoCards: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  infoCard: {
    padding: 20,
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
    marginBottom: 24,
    marginTop: 20,
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
  subCategoryContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
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
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addReviewButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
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
  reviewImagesRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
  },
  reviewImageThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  loadingReviews: {
    paddingVertical: 24,
    alignItems: "center",
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
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  professionalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  professionalCardGrid: {
    width: "48%",
    alignItems: "center",
    marginBottom: 20,
  },
  professionalCardLeft: {
    alignSelf: "flex-start",
  },
  professionalCardRight: {
    alignSelf: "flex-end",
  },
  professionalImageContainer: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  professionalAvatarGrid: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  professionalAvatarTextGrid: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  ratingBadgeGrid: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    marginLeft: -20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  ratingBadgeTextGrid: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  professionalNameGrid: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
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
  // Legacy styles (keeping for compatibility)
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
    justifyContent: "center",
    alignItems: "center",
  },
  professionalAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  reviewModalContainer: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  reviewModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  reviewModalSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 15,
  },
  selectableStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  submitReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitReviewButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  // Personalizar Section Styles
  personalizarSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  personalizarCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
  },
  personalizarCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  personalizarCardTitle: {
    fontSize: 16,
    fontWeight: "600",
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
