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
import {useNavigation} from "@/hooks/useNavigation";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {providerApi, postApi, reviewApi, serviceApi, linkApi, PlaceProfessionalLink, api} from "@/lib/api";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {errorUtils} from "@/lib/api";
import {getSubCategoryById, MAIN_CATEGORIES, getAvatarColorFromSubcategory} from "@/constants/categories";
import {ServiceDetailModal} from "@/components/service/ServiceDetailModal";
import {AvailabilityDisplay} from "@/components/profile/AvailabilityDisplay";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function ProfileDetailScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {goBack} = useNavigation();
  const {id} = useLocalSearchParams<{id: string}>();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [linkedProfessionals, setLinkedProfessionals] = useState<PlaceProfessionalLink[]>([]);
  const [linkedPlaces, setLinkedPlaces] = useState<PlaceProfessionalLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "reviews" | "posts">("services");
  const [showBooking, setShowBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("📋 ====== FETCHING PROFILE ======");
      console.log("📋 Profile ID:", id);
      const profileResponse = await providerApi.getPublicProfile(Number(id));
      const profileData = profileResponse.data;
      console.log("📋 Profile type:", profileData.profile_type);
      console.log("📋 Full profile data:", profileData);
      setProfile(profileData);

      // Fetch reviews (same for all profile types)
      const reviewsResponse = await reviewApi.getReviews({to_public_profile: Number(id)}).catch(() => ({data: {results: []}}));

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

      setReviews(reviewsResponse.data.results || []);
      setServices(servicesData);

      // Load linked professionals and posts if this is a place profile
      console.log("📋 Checking profile type for posts loading...");
      console.log("📋 profileData.profile_type === 'PLACE':", profileData.profile_type === "PLACE");
      console.log("📋 profileData.profile_type === 'PROFESSIONAL':", profileData.profile_type === "PROFESSIONAL");
      
      if (profileData.profile_type === "PLACE") {
        console.log("📋 Loading data for PLACE profile");
        try {
          // Try to get PlaceProfile by searching places endpoint with user_id
          // PublicProfile.user -> User.place_profile -> PlaceProfile.id
          const userId = profileData.user;
          if (userId) {
            try {
              // Try to get PlaceProfile by listing places and finding the one with matching user_id
              // Or try using the places endpoint with the PublicProfile name to find the PlaceProfile
              const placesResponse = await api.get<any>(`/places/`, {
                params: { search: profileData.name }
              });
              const places = Array.isArray(placesResponse.data?.results) 
                ? placesResponse.data.results 
                : Array.isArray(placesResponse.data) 
                  ? placesResponse.data 
                  : [];
              
              // Find the place with matching user_id
              const matchingPlace = places.find((place: any) => place.user_id === userId);
              
              if (matchingPlace?.id) {
                console.log("📋 Found PlaceProfile ID:", matchingPlace.id);
                const linksResponse = await linkApi.listPlaceLinks(matchingPlace.id, "ACCEPTED");
                console.log("📋 Linked professionals response:", linksResponse.data);
                const linkedPros = Array.isArray(linksResponse.data) ? linksResponse.data : [];
                setLinkedProfessionals(linkedPros);

                // Load posts from place and all linked professionals
                // First, get user_ids for all linked professionals
                const professionalUserIds = await Promise.all(
                  linkedPros.map(async (link: PlaceProfessionalLink) => {
                    try {
                      const profResponse = await profileApi.getProfessionalProfile(link.professional_id);
                      return profResponse.data?.user || profResponse.data?.user_id || null;
                    } catch (error) {
                      console.log(`Error getting user_id for professional ${link.professional_id}:`, error);
                      return null;
                    }
                  })
                );

                const allPostPromises = [
                  // Posts from the place itself
                  postApi.getPosts({author: userId}).catch(() => ({data: {results: []}})),
                  // Posts from each linked professional (using their user_id)
                  ...professionalUserIds
                    .filter((uid): uid is number => uid !== null)
                    .map((professionalUserId: number) =>
                      postApi.getPosts({author: professionalUserId}).catch(() => ({data: {results: []}}))
                    ),
                ];

                const allPostsResponses = await Promise.all(allPostPromises);
                // Combine all posts and sort by created_at (most recent first)
                const allPosts = allPostsResponses
                  .flatMap((response) => response.data?.results || [])
                  .sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || a.created || 0).getTime();
                    const dateB = new Date(b.created_at || b.created || 0).getTime();
                    return dateB - dateA; // Most recent first
                  });
                setPosts(allPosts);
              } else {
                console.log("📋 PlaceProfile not found, trying direct link API call");
                // Fallback: try using PublicProfile id directly
                const placeProfileId = profileData.id || Number(id);
                console.log("📋 Trying with PublicProfile ID as fallback:", placeProfileId);
                const linksResponse = await linkApi.listPlaceLinks(placeProfileId, "ACCEPTED");
                const linkedPros = Array.isArray(linksResponse.data) ? linksResponse.data : [];
                setLinkedProfessionals(linkedPros);

                // Load posts from place and all linked professionals
                // First, get user_ids for all linked professionals
                const professionalUserIds = await Promise.all(
                  linkedPros.map(async (link: PlaceProfessionalLink) => {
                    try {
                      const profResponse = await profileApi.getProfessionalProfile(link.professional_id);
                      return profResponse.data?.user || profResponse.data?.user_id || null;
                    } catch (error) {
                      console.log(`Error getting user_id for professional ${link.professional_id}:`, error);
                      return null;
                    }
                  })
                );

                const allPostPromises = [
                  postApi.getPosts({author: userId}).catch(() => ({data: {results: []}})),
                  ...professionalUserIds
                    .filter((uid): uid is number => uid !== null)
                    .map((professionalUserId: number) =>
                      postApi.getPosts({author: professionalUserId}).catch(() => ({data: {results: []}}))
                    ),
                ];
                const allPostsResponses = await Promise.all(allPostPromises);
                const allPosts = allPostsResponses
                  .flatMap((response) => response.data?.results || [])
                  .sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || a.created || 0).getTime();
                    const dateB = new Date(b.created_at || b.created || 0).getTime();
                    return dateB - dateA;
                  });
                setPosts(allPosts);
              }
            } catch (searchError) {
              console.log("📋 Error searching PlaceProfile:", searchError);
              // Fallback: try using PublicProfile id directly
              const placeProfileId = profileData.id || Number(id);
              console.log("📋 Trying with PublicProfile ID as fallback:", placeProfileId);
              const linksResponse = await linkApi.listPlaceLinks(placeProfileId, "ACCEPTED");
              const linkedPros = Array.isArray(linksResponse.data) ? linksResponse.data : [];
              setLinkedProfessionals(linkedPros);

              // Load posts from place and all linked professionals
              // First, get user_ids for all linked professionals
              const professionalUserIds = await Promise.all(
                linkedPros.map(async (link: PlaceProfessionalLink) => {
                  try {
                    const profResponse = await profileApi.getProfessionalProfile(link.professional_id);
                    return profResponse.data?.user || profResponse.data?.user_id || null;
                  } catch (error) {
                    console.log(`Error getting user_id for professional ${link.professional_id}:`, error);
                    return null;
                  }
                })
              );

              const allPostPromises = [
                postApi.getPosts({author: userId}).catch(() => ({data: {results: []}})),
                ...professionalUserIds
                  .filter((uid): uid is number => uid !== null)
                  .map((professionalUserId: number) =>
                    postApi.getPosts({author: professionalUserId}).catch(() => ({data: {results: []}}))
                  ),
              ];
              const allPostsResponses = await Promise.all(allPostPromises);
              const allPosts = allPostsResponses
                .flatMap((response) => response.data?.results || [])
                .sort((a: any, b: any) => {
                  const dateA = new Date(a.created_at || a.created || 0).getTime();
                  const dateB = new Date(b.created_at || b.created || 0).getTime();
                  return dateB - dateA;
                });
              setPosts(allPosts);
            }
          } else {
            console.log("📋 No user ID found in profileData");
            setLinkedProfessionals([]);
            // Still load posts from the place
            const userId = profileData.user || profileData.user_id;
            if (userId) {
              const postsResponse = await postApi.getPosts({author: userId}).catch((error) => {
                console.error("📋 Error loading posts:", error);
                return {data: {results: []}};
              });
              setPosts(postsResponse.data?.results || postsResponse.data || []);
            } else {
              setPosts([]);
            }
          }
        } catch (linksError) {
          console.log("📋 Linked professionals error:", linksError);
          setLinkedProfessionals([]);
          // Still load posts from the place
          const userId = profileData.user || profileData.user_id;
          if (userId) {
            const postsResponse = await postApi.getPosts({author: userId}).catch((error) => {
              console.error("📋 Error loading posts:", error);
              return {data: {results: []}};
            });
            setPosts(postsResponse.data?.results || postsResponse.data || []);
          } else {
            setPosts([]);
          }
        }
      } else if (profileData.profile_type === "PROFESSIONAL") {
        // For professional profiles, use same feed endpoint as Home
        // and filter client-side by the USER who created the post
        console.log("📋 ====== LOADING POSTS FOR PROFESSIONAL (FEED FILTER BY USER) ======");
        const userId = profileData.user; // this is the User.id (e.g. 19)
        console.log("📋 PublicProfile ID:", profileData.id);
        console.log("📋 User ID (author id to match):", userId);

        try {
          const res = await postApi.getPosts(); // same as Home
          const allPosts = res.data?.results || res.data || [];
          console.log("📋 Total posts from feed:", allPosts.length);

          // Log a small sample of posts to inspect author data
          console.log(
            "📋 Sample posts:",
            allPosts.slice(0, 5).map((p: any) => ({
              id: p.id,
              author_id: p.author?.id,
              author_email: p.author?.email,
              author_profile_id: p.author_profile_id,
              author_display_name: p.author_display_name,
            })),
          );

          const profilePosts = allPosts.filter((post: any) => {
            // Filter by the user who created the post
            return post.author && post.author.id === userId;
          });

          console.log("📋 Posts for this user:", profilePosts.length);
          setPosts(profilePosts);
        } catch (err) {
          console.error("📋 Error fetching posts for professional profile:", err);
          setPosts([]);
        }
        console.log("📋 ====== FINISHED LOADING POSTS (FEED FILTER BY USER) ======");
      }

      // Load linked places if this is a professional profile
      if (profileData.profile_type === "PROFESSIONAL") {
        try {
          const professionalUserId = profileData.user_id || profileData.user || Number(id);
          console.log("📍 Loading links for professional user_id:", professionalUserId);
          const linksResponse = await linkApi.listProfessionalLinks(professionalUserId, "ACCEPTED");
          const rawLinks = Array.isArray(linksResponse.data) ? linksResponse.data : [];
          console.log("📍 Raw links from API:", rawLinks);

          // Extra safety: filter on frontend by professional email/name to avoid showing wrong salon
          const profEmail = (profileData.user_email || "").toLowerCase();
          const profName = (profileData.name || "").toLowerCase().trim();

          const filtered = rawLinks.filter((link: any) => {
            const linkEmail = (link.professional_email || "").toLowerCase();
            const linkName = (link.professional_name || "").toLowerCase().trim();

            if (profEmail && linkEmail && linkEmail === profEmail) {
              return true;
            }
            if (profName && linkName && linkName.includes(profName)) {
              return true;
            }
            return false;
          });

          console.log(
            "📍 Filtered links for this professional:",
            filtered.map((l: any) => ({id: l.id, place: l.place_name, professional: l.professional_name})),
          );

          setLinkedPlaces(filtered);
        } catch (linksError) {
          console.log("Linked places not available:", linksError);
          setLinkedPlaces([]);
        }
      }

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

  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

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
          <TouchableOpacity
            key={service.id || index}
            style={[
              styles.serviceCard,
              {backgroundColor: colors.background, borderColor: colors.border},
            ]}
            activeOpacity={0.7}
            onPress={() => {
              setSelectedService(service);
              setServiceModalVisible(true);
            }}>
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
              {/* Availability indicator */}
              {service.availability_summary && service.availability_summary.length > 0 && (
                <View style={styles.availabilityIndicator}>
                  <Ionicons name="calendar-outline" color={colors.primary} size={14} />
                  <Text style={[styles.availabilityText, {color: colors.primary}]}>
                    Disponible {service.availability_summary.length} días/semana
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.noContentContainer}>
          <Ionicons name="images-outline" size={60} color={colors.mutedForeground} />
          <Text style={[styles.noContentText, {color: colors.mutedForeground}]}>
            No hay publicaciones disponibles
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.postsSection}>
        <View style={styles.postsGrid}>
          {posts.map((post, index) => (
            <TouchableOpacity
              key={post.id || index}
              style={[styles.postCard, {backgroundColor: colors.card}]}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to post detail if needed
                console.log("Post pressed:", post.id);
              }}>
              {post.image_url || (post.media && post.media.length > 0) ? (
                <Image
                  source={{uri: post.image_url || post.media[0]}}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.postImagePlaceholder, {backgroundColor: colors.muted + "20"}]}>
                  <Ionicons name="image-outline" size={30} color={colors.mutedForeground} />
                </View>
              )}
              {(post.caption || post.text) && (
                <View style={styles.postCaptionContainer}>
                  <Text
                    style={[styles.postCaption, {color: colors.mutedForeground}]}
                    numberOfLines={2}>
                    {post.caption || post.text}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
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
            paddingTop: Math.max(insets.top + 16, 20),
          },
        ]}>
        <TouchableOpacity
          onPress={() => {
            goBack("/(tabs)/explore");
          }}
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}>
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

          </View>

          {/* Team Section - Only for Places */}
          {profile.profile_type === "PLACE" && (
            <View style={styles.teamSection}>
              <Text style={[styles.teamSectionTitle, {color: colors.foreground}]}>Nuestro Equipo</Text>
              {linkedProfessionals.length > 0 ? (
                <View style={styles.teamContainer}>
                  {linkedProfessionals.map((link) => {
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
                          router.push(`/profile/${link.professional_id}`);
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
                  })}
                </View>
              ) : (
                <View style={[styles.emptyTeamCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Ionicons name="people-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.emptyTeamTitle, {color: colors.foreground}]}>
                    No hay profesionales en el equipo
                  </Text>
                  <Text style={[styles.emptyTeamText, {color: colors.mutedForeground}]}>
                    Este establecimiento aún no tiene profesionales vinculados
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Linked Places Section - Only for Professionals */}
          {profile.profile_type === "PROFESSIONAL" && (
            <View style={styles.teamSection}>
              <Text style={[styles.teamSectionTitle, {color: colors.foreground}]}>Trabaja en</Text>
              {linkedPlaces.length > 0 ? (
                <View style={styles.teamContainer}>
                  {linkedPlaces.map((link) => (
                    <TouchableOpacity
                      key={link.id}
                      style={[styles.teamCard, {backgroundColor: colors.card, borderColor: colors.border}]}
                      activeOpacity={0.7}
                      onPress={() => {
                        router.push(`/profile/${link.place_id}`);
                      }}>
                      <View style={[styles.teamAvatar, {backgroundColor: colors.primary}]}>
                        <Ionicons name="business" color="#ffffff" size={24} />
                      </View>
                      <View style={styles.teamInfo}>
                        <Text style={[styles.teamName, {color: colors.foreground}]}>
                          {link.place_name}
                        </Text>
                        <View style={styles.teamMeta}>
                          <View style={[styles.teamRoleBadge, {backgroundColor: colors.primary + "15"}]}>
                            <Ionicons name="business" color={colors.primary} size={10} />
                            <Text style={[styles.teamRole, {color: colors.primary}]}>Establecimiento</Text>
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
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyTeamCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Ionicons name="business-outline" color={colors.mutedForeground} size={48} />
                  <Text style={[styles.emptyTeamTitle, {color: colors.foreground}]}>
                    No está vinculado a ningún lugar
                  </Text>
                  <Text style={[styles.emptyTeamText, {color: colors.mutedForeground}]}>
                    Este profesional aún no está vinculado a ningún establecimiento
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tab Navigation */}
          <View style={styles.tabsWrapper}>
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
                    activeTab === "services" && [
                      styles.activeTabText,
                      {color: colors.foreground},
                    ],
                  ]}
                  numberOfLines={1}>
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
                  ]}
                  numberOfLines={1}>
                  Opiniones
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "posts" && [styles.activeTab, {backgroundColor: colors.background}],
                ]}
                onPress={() => setActiveTab("posts")}>
                <Text
                  style={[
                    styles.tabText,
                    {color: colors.mutedForeground},
                    activeTab === "posts" && [styles.activeTabText, {color: colors.foreground}],
                  ]}
                  numberOfLines={1}>
                  Publicaciones
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === "services" && renderServices()}
            {activeTab === "reviews" && renderReviews()}
            {activeTab === "posts" && renderPosts()}
          </View>

          {/* Availability Section */}
          {profile.availability && Array.isArray(profile.availability) && (
            <View style={styles.availabilitySection}>
              <AvailabilityDisplay availability={profile.availability} />
            </View>
          )}

          {/* Information Section */}
          <View style={styles.infoSection}>
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

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          visible={serviceModalVisible}
          service={selectedService}
          providerType={profile.profile_type === 'PLACE' ? 'place' : 'professional'}
          providerId={profile.user || profile.user_id}
          onClose={() => {
            setServiceModalVisible(false);
            setSelectedService(null);
          }}
          onBook={(date, slot) => {
            setServiceModalVisible(false);
            setShowBooking(true);
            // You can pass the selected date/slot to BookingFlow if needed
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
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    paddingBottom: 0,
  },
  postsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    marginTop: 16,
  },
  postsSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  postCard: {
    width: (SCREEN_WIDTH - 50) / 3, // 3 columns: 20px padding each side + 20px total gaps (10px between items)
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  postImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  postCaptionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  postCaption: {
    fontSize: 10,
    color: "#ffffff",
    lineHeight: 14,
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
    paddingTop: 24,
    alignItems: "stretch",
  },
  profileRowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
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
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  profileRole: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  profileCategoryContainer: {
    marginTop: 6,
    gap: 4,
  },
  profileCategory: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
    letterSpacing: 0.1,
  },
  profileSubcategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
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
  tabsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    minHeight: 48,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    fontWeight: "700",
  },
  tabContent: {
    paddingHorizontal: 20,
    marginBottom: 32,
    minHeight: 100,
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
  availabilityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "500",
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
  availabilitySection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 24,
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
  teamSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    marginTop: 16,
  },
  teamSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  teamContainer: {
    gap: 12,
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
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
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkedStatus: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyTeamCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    borderStyle: "dashed",
  },
  emptyTeamTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTeamText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
