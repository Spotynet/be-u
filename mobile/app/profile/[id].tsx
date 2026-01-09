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
import {providerApi, postApi, serviceApi, linkApi, profileCustomizationApi, PlaceProfessionalLink, api} from "@/lib/api";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {errorUtils} from "@/lib/api";
import {getSubCategoryById, MAIN_CATEGORIES, getAvatarColorFromSubcategory} from "@/constants/categories";
import {ServiceDetailModal} from "@/components/service/ServiceDetailModal";
import {AvailabilityDisplay} from "@/components/profile/AvailabilityDisplay";
import {useFavorites} from "@/features/favorites";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function ProfileDetailScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {goBack} = useNavigation();
  const {id} = useLocalSearchParams<{id: string}>();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [linkedProfessionals, setLinkedProfessionals] = useState<PlaceProfessionalLink[]>([]);
  const [linkedProfessionalsDetails, setLinkedProfessionalsDetails] = useState<any[]>([]);
  const [linkedPlaces, setLinkedPlaces] = useState<PlaceProfessionalLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "posts">("services");
  const [showBooking, setShowBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Favorites functionality
  const {toggleFavorite, isFavorited} = useFavorites();
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Check if profile is favorited
  useEffect(() => {
    if (profile && Number(id)) {
      const contentType = profile.profile_type === "PROFESSIONAL" ? "professionalprofile" : "placeprofile";
      setIsFavorite(isFavorited(contentType, Number(id)));
    }
  }, [profile, id, isFavorited]);
  
  const handleToggleFavorite = async () => {
    if (!profile || !id) return;
    
    try {
      const contentType = profile.profile_type === "PROFESSIONAL" ? "professionalprofile" : "placeprofile";
      await toggleFavorite(contentType, Number(id));
      setIsFavorite(!isFavorite);
    } catch (err) {
      // Error already handled in hook
    }
  };

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
      console.log("📋 Bio field (profile.bio):", profileData.bio);
      console.log("📋 Bio exists?", !!profileData.bio);
      setProfile(profileData);

      // Fetch services using the SAME endpoint as settings page
      let servicesData: any[] = [];
      
      try {
        // Use /profile/services/ endpoint with user parameter (same as settings page)
        const servicesResponse = await profileCustomizationApi.getCustomServices({
          user: profileData.user,
        });
        console.log("📋 Custom services response:", servicesResponse.data);
        servicesData = servicesResponse.data || [];
      } catch (serviceError) {
        console.log("Services not available:", serviceError);
        servicesData = [];
      }

      setServices(servicesData);

      console.log("📋 ========== LOADING POSTS ==========");
      console.log("📋 Profile type:", profileData.profile_type);
      console.log("📋 Profile user ID:", profileData.user);
      
      if (profileData.profile_type === "PLACE") {
        console.log("📋 Loading data for PLACE profile");
        const userId = profileData.user;
        const publicProfileId = Number(id); // Use the Public Profile ID from the URL
        console.log("📋 Public Profile ID:", publicProfileId);
        console.log("📋 User ID:", userId);
        
        // Load linked professionals using the Public Profile ID
        let linkedPros: any[] = [];
        try {
          // Try public endpoint first (no authentication required)
          let linksResponse;
          try {
            linksResponse = await linkApi.listPlaceLinksPublic(publicProfileId, "ACCEPTED");
            console.log("📋 Linked professionals response (public):", linksResponse.data);
          } catch (publicError: any) {
            // Fallback to private endpoint if public doesn't exist
            // When using private endpoint, we need the PlaceProfile ID not PublicProfile ID
            // So let's get it from the places endpoint
            console.log("📋 Public endpoint not available, searching for PlaceProfile ID...");
            try {
              const placesResponse = await api.get<any>(`/places/`, {
                params: { search: profileData.name }
              });
              const places = Array.isArray(placesResponse.data?.results) 
                ? placesResponse.data.results 
                : Array.isArray(placesResponse.data) 
                  ? placesResponse.data 
                  : [];
              const matchingPlace = places.find((place: any) => place.user_id === userId);
              if (matchingPlace?.id) {
                console.log("📋 Found PlaceProfile ID:", matchingPlace.id);
                linksResponse = await linkApi.listPlaceLinks(matchingPlace.id, "ACCEPTED");
                console.log("📋 Linked professionals response (private):", linksResponse.data);
              } else {
                console.log("📋 PlaceProfile not found");
                linksResponse = { data: [] };
              }
            } catch (searchError) {
              console.log("📋 Error searching for PlaceProfile:", searchError);
              linksResponse = { data: [] };
            }
          }
          linkedPros = Array.isArray(linksResponse.data) ? linksResponse.data : [];
          setLinkedProfessionals(linkedPros);
        } catch (linkError: any) {
          console.log("📋 Error loading linked professionals:", linkError.response?.status || linkError.message);
          linkedPros = [];
          setLinkedProfessionals([]);
        }
        
        if (linkedPros.length > 0) {
          try {

                // Load posts from place and all linked professionals
                // First, get full details for all linked professionals (including category/subcategories)
                const professionalDetails = await Promise.all(
                  linkedPros.map(async (link: any) => {
                    // Use professional_public_profile_id from backend
                    const publicProfileId = link.professional_public_profile_id || link.professional_id;
                    console.log(`📋 Professional ${link.professional_name}:`, {
                      link_professional_id: link.professional_id,
                      professional_public_profile_id: link.professional_public_profile_id,
                      using_public_profile_id: publicProfileId,
                    });
                    
                    try {
                      const profResponse = await providerApi.getPublicProfile(publicProfileId);
                      return {
                        ...link,
                        public_profile_id: publicProfileId,
                        user_id: profResponse.data?.user || profResponse.data?.user_id || null,
                        user_image: profResponse.data?.user_image || null,
                        category: profResponse.data?.category,
                        sub_categories: profResponse.data?.sub_categories || [],
                      };
                    } catch (error) {
                      console.log(`Error getting details for professional ${publicProfileId}:`, error);
                      return {
                        ...link,
                        public_profile_id: publicProfileId,
                        user_id: null,
                        user_image: null,
                        category: null,
                        sub_categories: [],
                      };
                    }
                  })
                );
                setLinkedProfessionalsDetails(professionalDetails);
                const professionalUserIds = professionalDetails.map(p => p.user_id).filter((id): id is number => id !== null);

                console.log("📋 Loading posts for place user_id:", userId);
                console.log("📋 Loading posts for professionals:", professionalUserIds);
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
                console.log("📋 ========== POST RESPONSES ==========");
                allPostsResponses.forEach((r, i) => {
                  console.log(`📋 Response ${i}: ${r.data?.results?.length || 0} posts`);
                });
                // Combine all posts and sort by created_at (most recent first)
                const allPosts = allPostsResponses
                  .flatMap((response) => response.data?.results || [])
                  .sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || a.created || 0).getTime();
                    const dateB = new Date(b.created_at || b.created || 0).getTime();
                    return dateB - dateA; // Most recent first
                  });
                console.log("📋 ========== FINAL RESULT ==========");
                console.log("📋 Combined posts for PLACE:", allPosts.length);
                console.log("📋 First 3 posts:", allPosts.slice(0, 3).map((p: any) => ({id: p.id, author: p.author?.email, media_count: p.media?.length})));
                setPosts(allPosts);
          } catch (postsError) {
            console.log("📋 Error loading posts:", postsError);
            // Still load posts from the place only
            if (userId) {
              const postsResponse = await postApi.getPosts({author: userId}).catch((error) => {
                console.error("📋 Error loading place posts:", error);
                return {data: {results: []}};
              });
              setPosts(postsResponse.data?.results || postsResponse.data || []);
            } else {
              setPosts([]);
            }
          }
        } else {
          // No linked professionals, just load place posts
          console.log("📋 No linked professionals, loading place posts only");
          if (userId) {
            const postsResponse = await postApi.getPosts({author: userId}).catch((error) => {
              console.error("📋 Error loading place posts:", error);
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
          const professionalPublicProfileId = Number(id);
          console.log("📍 Loading links for professional public profile ID:", professionalPublicProfileId);
          
          // Try public endpoint first (no authentication required)
          let linksResponse;
          try {
            linksResponse = await linkApi.listProfessionalLinksPublic(professionalPublicProfileId, "ACCEPTED");
            console.log("📍 Links response (public):", linksResponse.data);
          } catch (publicError: any) {
            // Fallback to private endpoint if public doesn't exist
            console.log("📍 Public endpoint not available, trying private endpoint");
            const professionalUserId = profileData.user_id || profileData.user;
            linksResponse = await linkApi.listProfessionalLinks(professionalUserId, "ACCEPTED");
            console.log("📍 Links response (private):", linksResponse.data);
          }
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

          // Use place_public_profile_id from backend
          const placesWithDetails = filtered.map((link: any) => {
            const publicProfileId = link.place_public_profile_id || link.place_id;
            console.log(`📍 Place ${link.place_name}: link.place_id=${link.place_id}, place_public_profile_id=${link.place_public_profile_id}, using=${publicProfileId}`);
            return {
              ...link,
              public_profile_id: publicProfileId,
            };
          });

          setLinkedPlaces(placesWithDetails);
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
      <View style={styles.postsGrid}>
        {posts.map((post, index) => {
          // Get the first media image if available
          const mediaUrl = post.media && post.media.length > 0 
            ? (typeof post.media[0] === 'string' ? post.media[0] : post.media[0]?.media_file)
            : post.image_url;
          
          return (
            <TouchableOpacity
              key={post.id || index}
              style={styles.postGridItem}
              activeOpacity={0.7}
              onPress={() => {
                if (post.id) {
                  router.push(`/post/${post.id}`);
                }
              }}>
              {mediaUrl ? (
                <Image
                  source={{uri: mediaUrl}}
                  style={styles.postGridImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.postGridImagePlaceholder, {backgroundColor: colors.muted}]}>
                  <Ionicons name="image-outline" size={40} color={colors.mutedForeground} />
                </View>
              )}
              <View style={styles.postGridOverlay}>
                <View style={styles.postGridStats}>
                  <View style={styles.postGridStat}>
                    <Ionicons name="heart" size={16} color="#ffffff" />
                    <Text style={styles.postGridStatText}>{post.likes_count || 0}</Text>
                  </View>
                  {post.comments_count > 0 && (
                    <View style={styles.postGridStat}>
                      <Ionicons name="chatbubble" size={16} color="#ffffff" />
                      <Text style={styles.postGridStatText}>{post.comments_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Reseñas no implementadas todavía

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
          Perfil
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleToggleFavorite}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              color={isFavorite ? "#EF4444" : colors.foreground} 
              size={24} 
            />
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

            {/* Rating badge hidden (reseñas/calificaciones no implementadas todavía) */}
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
                {profile.user_image ? (
                  <Image 
                    source={{uri: profile.user_image}} 
                    style={styles.profileAvatarImage}
                    onError={(error) => {
                      console.error("Error loading profile image:", profile.user_image, error);
                    }}
                  />
                ) : (
                  <Text style={styles.profileAvatarText}>
                    {(profile.name || "U").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.profileNameRole}>
                <Text style={[styles.profileName, {color: colors.foreground}]} numberOfLines={1}>
                  {profile.name || "Sin nombre"}
                </Text>
                
                {/* Location */}
                {(profile.city || profile.street) && (
                  <Text style={[styles.profileLocation, {color: colors.mutedForeground}]} numberOfLines={1}>
                    <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                    {" "}
                    {profile.street && `${profile.street}, `}
                    {profile.city}{profile.country && `, ${profile.country}`}
                  </Text>
                )}
                
                {/* Tags for Category and Subcategories */}
                <View style={styles.profileTagsContainer}>
                  {profile.category && (Array.isArray(profile.category) ? profile.category.length > 0 : profile.category) && (
                    (Array.isArray(profile.category) ? profile.category : [profile.category]).map((catId: string, idx: number) => {
                      const category = MAIN_CATEGORIES.find((c) => c.id === catId);
                      return category ? (
                        <View 
                          key={idx}
                          style={[styles.profileTag, {backgroundColor: colors.primary + "20", borderColor: colors.primary + "40"}]}>
                          <Text style={[styles.profileTagText, {color: colors.primary}]}>
                            {category.name}
                          </Text>
                        </View>
                      ) : null;
                    })
                  )}
                  {profile.sub_categories && profile.sub_categories.length > 0 && (
                    profile.sub_categories.map((subId: string, idx: number) => {
                      // Find the category that contains this subcategory
                      const categories = Array.isArray(profile.category) 
                        ? profile.category 
                        : profile.category ? [profile.category] : [];
                      let subCategory = null;
                      for (const catId of categories) {
                        subCategory = getSubCategoryById(catId, subId);
                        if (subCategory) break;
                      }
                      return subCategory ? (
                        <View 
                          key={idx}
                          style={[styles.profileTag, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                          <Text style={[styles.profileTagText, {color: colors.mutedForeground}]}>
                            {subCategory.name}
                          </Text>
                        </View>
                      ) : null;
                    })
                  )}
                </View>

                {/* Bio/Description */}
                {(profile.bio || profile.description) && (
                  <Text style={[styles.profileBio, {color: colors.mutedForeground}]} numberOfLines={4}>
                    {profile.bio || profile.description}
                  </Text>
                )}
                
                {/* Phone */}
                {profile.user_phone && (
                  <View style={styles.profilePhoneContainer}>
                    <Ionicons name="call-outline" color={colors.mutedForeground} size={16} />
                    <Text style={[styles.profilePhone, {color: colors.mutedForeground}]}>
                      {profile.user_phone}
                    </Text>
                  </View>
                )}

                {/* Schedule (Collapsible) */}
                {profile.availability && Array.isArray(profile.availability) && (
                  <View
                    style={[
                      styles.scheduleAccordion,
                      {backgroundColor: colors.card, borderColor: colors.border},
                    ]}>
                    <TouchableOpacity
                      style={styles.scheduleHeader}
                      onPress={() => setIsScheduleExpanded((v) => !v)}
                      activeOpacity={0.8}>
                      <View style={styles.scheduleHeaderLeft}>
                        <Ionicons name="calendar-outline" color={colors.primary} size={18} />
                        <Text style={[styles.scheduleTitle, {color: colors.foreground}]}>
                          Horarios
                        </Text>
                      </View>
                      <Ionicons
                        name={isScheduleExpanded ? "chevron-up" : "chevron-down"}
                        color={colors.mutedForeground}
                        size={18}
                      />
                    </TouchableOpacity>

                    {isScheduleExpanded && (
                      <View style={styles.scheduleContent}>
                        <AvailabilityDisplay availability={profile.availability} />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

          </View>

          {/* Team Section - Only for Places */}
          {profile.profile_type === "PLACE" && linkedProfessionalsDetails.length > 0 && (
            <View style={styles.teamSection}>
              <Text style={[styles.teamSectionTitle, {color: colors.foreground}]}>Nuestro Equipo</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.teamScrollContainer}>
                {linkedProfessionalsDetails.map((linkDetail) => {
                  const getInitials = (name: string) => {
                    const words = name.split(" ");
                    if (words.length >= 2) {
                      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                  };
                  const borderColor = getAvatarColorFromSubcategory(
                    linkDetail.category,
                    linkDetail.sub_categories
                  );
                  return (
                    <TouchableOpacity
                      key={linkDetail.id}
                      style={styles.teamStoryItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        const profileId = linkDetail.public_profile_id || linkDetail.professional_id;
                        console.log(`Navigating to professional profile: ${profileId}`);
                        router.push(`/profile/${profileId}`);
                      }}>
                      <View style={[styles.teamStoryRing, {borderColor: borderColor}]}>
                        <View style={[styles.teamStoryAvatar, {backgroundColor: borderColor}]}>
                          {linkDetail.user_image ? (
                            <Image
                              source={{uri: linkDetail.user_image}}
                              style={styles.teamStoryAvatarImage}
                            />
                          ) : (
                            <Text style={styles.teamStoryAvatarText}>
                              {getInitials(linkDetail.professional_name)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text style={[styles.teamStoryName, {color: colors.foreground}]} numberOfLines={1}>
                        {linkDetail.professional_name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
                        const profileId = (link as any).public_profile_id || link.place_id;
                        console.log(`Navigating to place profile: ${profileId}`);
                        router.push(`/profile/${profileId}`);
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

          {/* Tabs + content (hide for places; show only basic info + linked users) */}
          {profile.profile_type !== "PLACE" && (
            <>
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
                    <Ionicons
                      name="briefcase-outline"
                      size={24}
                      color={activeTab === "services" ? colors.foreground : colors.mutedForeground}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "posts" && [
                        styles.activeTab,
                        {backgroundColor: colors.background},
                      ],
                    ]}
                    onPress={() => setActiveTab("posts")}>
                    <Ionicons
                      name="images-outline"
                      size={24}
                      color={activeTab === "posts" ? colors.foreground : colors.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tab Content */}
              <View style={styles.tabContent}>
                {activeTab === "services" && renderServices()}
                {activeTab === "posts" && renderPosts()}
              </View>
            </>
          )}

        </Animated.View>
      </ScrollView>


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
          providerId={
            profile.profile_type === 'PLACE'
              ? (profile.place_profile?.id ??
                profile.place_profile_id ??
                profile.place?.id ??
                profile.place_id ??
                profile.user_place_profile_id ??
                profile.user_id ??
                profile.user)
              : (profile.professional_profile?.id ??
                profile.professional_profile_id ??
                profile.professional?.id ??
                profile.professional_id ??
                profile.user_professional_profile_id ??
                profile.user_id ??
                profile.user)
          }
          providerName={
            profile.profile_type === 'PLACE'
              ? (profile.place_profile?.name ?? profile.place?.name ?? profile.name ?? '')
              : (profile.professional_profile
                  ? `${profile.professional_profile.name || ''} ${profile.professional_profile.last_name || ''}`.trim()
                  : profile.name || '')
          }
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
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingHorizontal: 4,
  },
  postGridItem: {
    width: "31.5%",
    aspectRatio: 1,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  postGridImage: {
    width: "100%",
    height: "100%",
  },
  postGridImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  postGridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
    padding: 8,
  },
  postGridStats: {
    flexDirection: "row",
    gap: 12,
  },
  postGridStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postGridStatText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
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
  // ratingBadge/ratingText removed (reseñas/calificaciones no implementadas todavía)
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
  profileAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    resizeMode: "cover",
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
  profileLocation: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 2,
  },
  profileTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  profileTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileTagText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  profilePhoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  profilePhone: {
    fontSize: 14,
    fontWeight: "400",
  },
  scheduleAccordion: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scheduleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  scheduleContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
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
    paddingVertical: 12,
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
    paddingLeft: 20,
    paddingTop: 8,
    paddingBottom: 16,
    marginTop: 8,
  },
  teamSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
    paddingRight: 20,
  },
  teamScrollContainer: {
    paddingRight: 20,
    gap: 8,
  },
  teamStoryItem: {
    alignItems: "center",
    width: 68,
  },
  teamStoryRing: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 3,
    marginBottom: 6,
  },
  teamStoryAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    overflow: "hidden",
  },
  teamStoryAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    resizeMode: "cover",
  },
  teamStoryAvatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  teamStoryName: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
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
