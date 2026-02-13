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
  Alert,
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
import {formatPrice} from "@/lib/priceUtils";
import {errorUtils} from "@/lib/api";
import {getSubCategoryById, MAIN_CATEGORIES, getAvatarColorFromSubcategory} from "@/constants/categories";
import {AvailabilityDisplay} from "@/components/profile/AvailabilityDisplay";
import {useFavorites} from "@/features/favorites";
import {useAuth} from "@/features/auth/hooks/useAuth";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function ProfileDetailScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {goBack} = useNavigation();
  const {id} = useLocalSearchParams<{id: string}>();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [linkedProfessionals, setLinkedProfessionals] = useState<PlaceProfessionalLink[]>([]);
  const [linkedProfessionalsDetails, setLinkedProfessionalsDetails] = useState<any[]>([]);
  const [linkedPlaces, setLinkedPlaces] = useState<PlaceProfessionalLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"team" | "services" | "details" | "hours">("services");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const stickyHeightRef = useRef<number>(44);
  const sectionOffsetsRef = useRef<Record<string, number>>({});
  
  // Favorites functionality (redirect to login on 401)
  const {toggleFavorite, isFavorited} = useFavorites({
    onUnauthorized: () => router.push("/login"),
  });
  const [isFavorite, setIsFavorite] = useState(false);

  const getFavoriteTarget = () => {
    if (!profile) return null;
    const contentType =
      profile.profile_type === "PROFESSIONAL" ? "professionalprofile" : "placeprofile";
    const rawId =
      contentType === "professionalprofile"
        ? profile.professional_profile_id
        : profile.place_profile_id;
    const resolvedId = Number(rawId ?? id);
    if (!resolvedId) return null;
    return {contentType, objectId: resolvedId};
  };
  
  // Check if profile is favorited
  useEffect(() => {
    const target = getFavoriteTarget();
    if (target) {
      setIsFavorite(isFavorited(target.contentType, target.objectId));
    }
  }, [profile, id, isFavorited]);
  
  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        "Inicia sesión",
        "Necesitas iniciar sesión para guardar favoritos.",
        [{text: "OK", onPress: () => router.push("/login")}]
      );
      return;
    }
    const target = getFavoriteTarget();
    if (!target) return;
    
    try {
      const result = await toggleFavorite(target.contentType, target.objectId);
      if (typeof result?.is_favorited === "boolean") {
        setIsFavorite(result.is_favorited);
      } else {
        setIsFavorite(!isFavorite);
      }
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

  const navigateToBooking = (service: any) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        "Inicia sesión",
        "Necesitas iniciar sesión para reservar.",
        [{text: "OK", onPress: () => router.push("/login")}]
      );
      return;
    }
    // Prevent booking your own profile
    if (profile?.user && Number(profile.user) === Number(user.id)) {
      Alert.alert(
        "No puedes reservarte a ti mism@",
        "Para evitar reservas duplicadas, no es posible hacer una reserva en tu propio perfil."
      );
      return;
    }

    // Match the behavior of the "Solicitar reserva" / "Reservar" button (ServiceDetailModal.handleBookNow)
    const serviceInstanceId = service?.id;
    const serviceTypeId =
      service?.service_type_id || service?.service || service?.service_details?.id || service?.id;
    const serviceName = service?.name || service?.service_details?.name || "Servicio";
    const durationMinutes = service?.duration_minutes || service?.duration || service?.time || 60;

    const providerType = profile?.profile_type === "PLACE" ? "place_service" : "professional_service";
    const providerId =
      profile?.profile_type === "PLACE"
        ? (profile?.place_profile?.id ??
          profile?.place_profile_id ??
          profile?.place?.id ??
          profile?.place_id ??
          profile?.user_place_profile_id ??
          profile?.user_id ??
          profile?.user ??
          0)
        : (profile?.professional_profile?.id ??
          profile?.professional_profile_id ??
          profile?.professional?.id ??
          profile?.professional_id ??
          profile?.user_professional_profile_id ??
          profile?.user_id ??
          profile?.user ??
          0);

    const providerName =
      profile?.profile_type === "PLACE"
        ? (profile?.place_profile?.display_name ??
          profile?.place_profile?.name ??
          profile?.place?.name ??
          profile?.display_name ??
          profile?.name ??
          "")
        : (profile?.professional_profile?.display_name ??
          profile?.display_name ??
          (profile?.professional_profile
            ? `${profile?.professional_profile?.name || ""} ${profile?.professional_profile?.last_name || ""}`.trim()
            : profile?.name || ""));

    if (!serviceInstanceId) return;

    router.push({
      pathname: "/booking",
      params: {
        serviceInstanceId: String(serviceInstanceId),
        serviceTypeId: String(serviceTypeId),
        serviceName,
        serviceType: providerType,
        providerId: String(providerId || 0),
        providerName,
        price: String(service?.price ?? 0),
        duration: String(durationMinutes),
      },
    });
  };

  const categoryNames: string[] =
    profile?.category && (Array.isArray(profile.category) ? profile.category.length > 0 : profile.category)
      ? (Array.isArray(profile.category) ? profile.category : [profile.category])
          .map((catId: string) => MAIN_CATEGORIES.find((c) => c.id === catId)?.name)
          .filter(Boolean)
      : [];

  const subCategoryNames: string[] =
    profile?.sub_categories && Array.isArray(profile.sub_categories) && profile.sub_categories.length > 0
      ? profile.sub_categories
          .map((subId: string) => {
            const categories = Array.isArray(profile.category)
              ? profile.category
              : profile.category
                ? [profile.category]
                : [];
            for (const catId of categories) {
              const subCategory = getSubCategoryById(catId, subId);
              if (subCategory) return subCategory.name;
            }
            return null;
          })
          .filter(Boolean)
      : [];

  const hasTeamSection =
    (profile?.profile_type === "PLACE" && linkedProfessionalsDetails.length > 0) ||
    (profile?.profile_type === "PROFESSIONAL" && linkedPlaces.length > 0);

  const sections: Array<{
    key: "team" | "services" | "details" | "hours";
    label: string;
  }> = [
    {key: "services", label: "Servicios"},
    {key: "details", label: "Detalles"},
    {key: "hours", label: "Horario"},
    ...(hasTeamSection
      ? ([
          {
            key: "team",
            label: profile?.profile_type === "PLACE" ? "Equipo" : "Trabaja en",
          },
        ] as any)
      : []),
  ];

  const onSectionLayout = (key: string) => (e: any) => {
    sectionOffsetsRef.current[key] = e?.nativeEvent?.layout?.y ?? 0;
  };

  const scrollToSection = (key: typeof activeSection) => {
    const y = sectionOffsetsRef.current[key];
    if (typeof y !== "number") return;
    const topInset = stickyHeightRef.current + 8;
    scrollRef.current?.scrollTo?.({y: Math.max(0, y - topInset), animated: true});
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
          <TouchableOpacity
            key={service.id || index}
            style={styles.serviceCard}
            activeOpacity={0.7}
            onPress={() => {
              navigateToBooking(service);
            }}>
            <View style={styles.serviceContent}>
              <View style={styles.serviceTopLine}>
                <Text
                  style={[styles.serviceName, {color: colors.foreground}]}
                  numberOfLines={1}>
                  {service.name}
                </Text>
                <Text style={[styles.servicePrice, {color: colors.primary}]} numberOfLines={1}>
                  {formatPrice(service.price, {suffix: " MXN"})}
                </Text>
                </View>

              {!!service.description && (
                <Text
                  style={[styles.serviceDescription, {color: colors.mutedForeground}]}
                  numberOfLines={1}>
                {service.description}
              </Text>
              )}

              <View style={styles.serviceMetaLine}>
                <View style={styles.serviceMetaItem}>
                  <Ionicons name="time-outline" color={colors.mutedForeground} size={14} />
                  <Text style={[styles.serviceMetaText, {color: colors.mutedForeground}]}>
                    {service.duration_minutes || service.duration} min
                  </Text>
                </View>
              {service.availability_summary && service.availability_summary.length > 0 && (
                  <View style={styles.serviceMetaItem}>
                    <Ionicons name="calendar-outline" color={colors.mutedForeground} size={14} />
                    <Text style={[styles.serviceMetaText, {color: colors.mutedForeground}]}>
                      {service.availability_summary.length} días/sem
                  </Text>
                </View>
              )}
              </View>
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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerName, {color: colors.foreground}]} numberOfLines={1}>
            {profile?.display_name || profile?.name || "Perfil"}
        </Text>
          {categoryNames.length > 0 && (
            <View style={[styles.headerCategoryTag, {backgroundColor: colors.primary + "15"}]}>
              <Text style={[styles.headerCategoryTagText, {color: colors.primary}]} numberOfLines={1}>
                {categoryNames[0]}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleToggleFavorite}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              color={isFavorite ? "#EF4444" : colors.foreground} 
              size={24} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]}
        onScroll={(e) => {
          const y = e?.nativeEvent?.contentOffset?.y ?? 0;
          const top = y + stickyHeightRef.current + 12;
          const keys = sections.map((s) => s.key);
          let current: any = keys[0];
          for (const k of keys) {
            const off = sectionOffsetsRef.current[k];
            if (typeof off === "number" && off <= top) current = k;
          }
          if (current && current !== activeSection) setActiveSection(current);
        }}
        scrollEventThrottle={16}>
        <Animated.View style={[styles.profileSection, {opacity: fadeAnim}]}>
          {/* Hero Section with Image Slider */}
          <View style={styles.heroSection}>
            {profile.images && profile.images.length > 0 ? (
              <View style={styles.heroImageContainer}>
                    <Image
                  source={{uri: profile.images[0]}}
                  style={styles.heroImageSingle}
                      resizeMode="cover"
                    />

                {/* Overlay button: view all photos */}
                {profile.images.length > 1 && (
                  <TouchableOpacity
                    style={styles.viewAllPhotosButton}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/profile/photos/${Number(id)}` as any)}>
                    <Ionicons name="images-outline" size={14} color="#ffffff" />
                    <Text style={styles.viewAllPhotosText}>
                      Ver las {profile.images.length} fotos
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.heroImagePlaceholder}>
                <Ionicons name="image-outline" color={colors.mutedForeground} size={60} />
              </View>
            )}

            {/* Rating badge hidden (reseñas/calificaciones no implementadas todavía) */}
            </View>
        </Animated.View>

        {/* Sticky section tabs */}
              <View
          style={[styles.stickyTabs, {backgroundColor: colors.background, borderBottomColor: colors.border}]}
          onLayout={(e) => {
            stickyHeightRef.current = e?.nativeEvent?.layout?.height ?? 44;
          }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickyTabsContent}>
            {sections.map((s) => {
              const isActive = activeSection === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => scrollToSection(s.key)}
                  activeOpacity={0.8}
                style={[
                    styles.stickyTab,
                    isActive ? {borderBottomColor: colors.primary} : {borderBottomColor: "transparent"},
                  ]}>
                  <Text style={[styles.stickyTabText, {color: isActive ? colors.foreground : colors.mutedForeground}]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
              </View>

        {/* Sections */}
        <View style={styles.sectionsWrap}>
          {/* Servicios */}
          <View onLayout={onSectionLayout("services")} style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Servicios</Text>
            {renderServices()}
            <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
          </View>

          {/* Detalles */}
          <View onLayout={onSectionLayout("details")} style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Detalles</Text>

            {(profile.bio || profile.description) && (
              <Text style={[styles.detailText, {color: colors.mutedForeground}]}>
                {profile.bio || profile.description}
                  </Text>
                )}
                
            {subCategoryNames.length > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.detailRowText, {color: colors.foreground}]} numberOfLines={2}>
                  {subCategoryNames.join(" · ")}
                          </Text>
                        </View>
            )}

            {profile.user_phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.detailRowText, {color: colors.foreground}]}>{profile.user_phone}</Text>
                        </View>
            )}

            {(profile.city || profile.street) && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.detailRowText, {color: colors.foreground}]} numberOfLines={2}>
                  {profile.street && `${profile.street}, `}
                  {profile.city}
                  {profile.country && `, ${profile.country}`}
                    </Text>
                  </View>
                )}
            <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
            </View>

          {/* Horario */}
          <View onLayout={onSectionLayout("hours")} style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Horario</Text>
            {profile.availability && Array.isArray(profile.availability) ? (
              <AvailabilityDisplay availability={profile.availability} showHeader={false} variant="textOnly" />
            ) : (
              <Text style={[styles.detailText, {color: colors.mutedForeground}]}>No hay horarios disponibles</Text>
            )}
            <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
          </View>

          {/* Trabaja en / Equipo */}
          {hasTeamSection && (
            <View onLayout={onSectionLayout("team")} style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                {profile.profile_type === "PLACE" ? "Nuestro Equipo" : "Trabaja en"}
              </Text>

          {profile.profile_type === "PLACE" && linkedProfessionalsDetails.length > 0 && (
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
                    const borderColor = getAvatarColorFromSubcategory(linkDetail.category, linkDetail.sub_categories);
                  return (
                    <TouchableOpacity
                      key={linkDetail.id}
                      style={styles.teamStoryItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        const profileId = linkDetail.public_profile_id || linkDetail.professional_id;
                        router.push(`/profile/${profileId}`);
                      }}>
                        <View style={[styles.teamStoryRing, {borderColor}]}>
                        <View style={[styles.teamStoryAvatar, {backgroundColor: borderColor}]}>
                            {linkDetail.user_image ? (
                              <Image source={{uri: linkDetail.user_image}} style={styles.teamStoryAvatarImage} />
                            ) : (
                              <Text style={styles.teamStoryAvatarText}>{getInitials(linkDetail.professional_name)}</Text>
                            )}
                        </View>
                      </View>
                      <Text style={[styles.teamStoryName, {color: colors.foreground}]} numberOfLines={1}>
                          {linkDetail.professional_name.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              )}

              {profile.profile_type === "PROFESSIONAL" &&
                (linkedPlaces.length > 0 ? (
                <View style={styles.teamContainer}>
                  {linkedPlaces.map((link) => (
                    <TouchableOpacity
                      key={link.id}
                        style={styles.teamCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        const profileId = (link as any).public_profile_id || link.place_id;
                        router.push(`/profile/${profileId}`);
                      }}>
                      <View style={[styles.teamAvatar, {backgroundColor: colors.primary}]}>
                          <Ionicons name="business" color="#ffffff" size={18} />
                      </View>
                        <View style={styles.teamLine}>
                          <Text style={[styles.teamLineName, {color: colors.foreground}]} numberOfLines={1}>
                          {link.place_name}
                        </Text>
                          <View style={styles.teamLineStatus}>
                            <View style={styles.teamStatusDot} />
                            <Text style={[styles.teamStatusText, {color: colors.mutedForeground}]}>Vinculado</Text>
                          </View>
                          </View>
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
                ))}
            </View>
          )}
            </View>
      </ScrollView>


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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerCategoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 180,
  },
  headerCategoryTagText: {
    fontSize: 12,
    fontWeight: "700",
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
  heroImageContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  heroImageSingle: {
    width: "100%",
    height: "100%",
  },
  heroImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllPhotosButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  viewAllPhotosText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  // ratingBadge/ratingText removed (reseñas/calificaciones no implementadas todavía)
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
  profileHeaderText: {
    flex: 1,
  },
  profileCategoryOnly: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
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
  profileTagsBlock: {
    marginTop: 8,
    marginBottom: 8,
    gap: 4,
  },
  profileTagsText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  profileSubtagsText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.1,
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
    paddingBottom: 10,
    paddingTop: 6,
  },
  stickyTabs: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  stickyTabsContent: {
    gap: 32,
    paddingRight: 24,
  },
  stickyTab: {
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
  stickyTabText: {
    fontSize: 13,
    fontWeight: "800",
  },
  sectionsWrap: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 56,
    gap: 26,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionDivider: {
    height: 1,
    marginTop: 18,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  detailRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
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
    gap: 0,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    gap: 0,
  },
  serviceContent: {
    flex: 1,
    gap: 4,
  },
  serviceTopLine: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  serviceDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: "800",
  },
  serviceMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
    flexWrap: "wrap",
  },
  serviceMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  serviceMetaText: {
    fontSize: 12,
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
    gap: 0,
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    gap: 12,
  },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  teamAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  teamLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  teamLineName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  teamLineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  teamStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  teamStatusText: {
    fontSize: 12,
    fontWeight: "700",
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
