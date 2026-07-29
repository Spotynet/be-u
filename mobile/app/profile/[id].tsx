import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Platform,
  Linking,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef, useCallback} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {useNavigation} from "@/hooks/useNavigation";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {
  api,
  providerApi,
  postApi,
  serviceApi,
  linkApi,
  profileCustomizationApi,
  groupSessionApi,
  reviewApi,
  PlaceProfessionalLink,
  errorUtils,
} from "@/lib/api";
import {formatPrice} from "@/lib/priceUtils";
import {getSubCategoryById, MAIN_CATEGORIES, getAvatarColorFromSubcategory} from "@/constants/categories";
import {AvailabilityDisplay} from "@/components/profile/AvailabilityDisplay";
import {useFavorites} from "@/features/favorites";
import {useAuth} from "@/features/auth/hooks/useAuth";

import * as Haptics from "expo-haptics";

const SKELETON_ITEMS = [1, 2, 3];

function SkeletonBlock({width, height, style}: {width?: number | string; height?: number; style?: any}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const {colors} = useThemeVariant();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {toValue: 1, duration: 1000, useNativeDriver: true}),
        Animated.timing(shimmerAnim, {toValue: 0, duration: 1000, useNativeDriver: true}),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({inputRange: [0, 1], outputRange: [0.15, 0.35]});

  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height: height ?? 16,
          borderRadius: 8,
          backgroundColor: colors.mutedForeground,
          opacity,
        },
        style,
      ]}
    />
  );
}

function ProfileSkeleton() {
  const {colors} = useThemeVariant();
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.skeletonHeader, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <SkeletonBlock width={40} height={40} style={{borderRadius: 20}} />
        <SkeletonBlock width={120} height={16} />
        <SkeletonBlock width={40} height={40} style={{borderRadius: 20}} />
      </View>
      <SkeletonBlock width="100%" height={200} style={{borderRadius: 0}} />
      <View style={styles.skeletonTabs}>
        {SKELETON_ITEMS.map((i) => (
          <SkeletonBlock key={i} width={80} height={14} />
        ))}
      </View>
      <View style={styles.skeletonContent}>
        <SkeletonBlock width="60%" height={18} />
        <View style={{gap: 12, marginTop: 16}}>
          {SKELETON_ITEMS.map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBlock height={60} style={{borderRadius: 12}} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

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
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"team" | "services" | "group_sessions" | "details" | "hours" | "reviews" | "posts">("services");
  const [scrollScrolled, setScrollScrolled] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const stickyHeightRef = useRef<number>(44);
  const sectionOffsetsRef = useRef<Record<string, number>>({});

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
    return {contentType, objectId: resolvedId} as const;
  };

  useEffect(() => {
    const target = getFavoriteTarget();
    if (target) {
      setIsFavorite(isFavorited(target.contentType, target.objectId));
    }
  }, [profile, id, isFavorited]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        "Inicia sesion",
        "Necesitas iniciar sesion para guardar favoritos.",
        [{text: "OK", onPress: () => router.push("/login")}]
      );
      return;
    }
    const target = getFavoriteTarget();
    if (!target) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    try {
      const result = await toggleFavorite(target.contentType, target.objectId);
      if (typeof result?.is_favorited === "boolean") {
        setIsFavorite(result.is_favorited);
      } else {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {}
  };

  const handleShare = async () => {
    if (!profile) return;
    try {
      const url = `https://be-u.ai/profile/${id}`;
      const message = `Mira el perfil de ${profile.name || "este proveedor"} en nabbi`;
      if (Platform.OS === "ios") {
        await Linking.openURL(`sms:&body=${encodeURIComponent(message + " " + url)}`);
      } else {
        await Linking.openURL(`smsto:?body=${encodeURIComponent(message + " " + url)}`);
      }
    } catch {}
  };

  const fetchReviews = useCallback(async (profileId: number, profileType: string) => {
    try {
      setReviewsLoading(true);
      const response = await reviewApi.getReviews({public_profile: profileId});
      const data = response.data;
      setReviews(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileResponse = await providerApi.getPublicProfile(Number(id));
      const profileData = profileResponse.data;
      setProfile(profileData);

      // Fetch reviews
      fetchReviews(Number(id), profileData.profile_type);

      // Fetch services
      let servicesData: any[] = [];
      const userId = typeof profileData.user === "object" ? profileData.user?.id : profileData.user;

      try {
        const servicesResponse = await profileCustomizationApi.getCustomServices({
          user: userId,
        });
        servicesData = servicesResponse.data || [];
      } catch {
        servicesData = [];
      }

      if (servicesData.length === 0 && userId != null) {
        try {
          if (profileData.profile_type === "PROFESSIONAL") {
            const profId = profileData.professional_profile_id;
            const res = await serviceApi.getProfessionalServices({
              ...(profId ? {professional: profId} : {user: userId}),
              is_active: true,
            });
            const results = res.data?.results || res.data || [];
            servicesData = results.map((s: any) => ({
              id: s.id,
              name: s.name || s.service_name || s.service?.name,
              description: s.description || "",
              price: s.price,
              duration_minutes: s.duration_minutes ?? 60,
              category: s.service?.category?.name || s.service_details?.category?.name || "General",
            }));
          } else if (profileData.profile_type === "PLACE") {
            const placeId = profileData.place_profile_id;
            const res = await serviceApi.getPlaceServices({
              ...(placeId ? {place: placeId} : {user: userId}),
              is_active: true,
            });
            const results = res.data?.results || res.data || [];
            servicesData = results.map((s: any) => ({
              id: s.id,
              name: s.name || s.service_name || s.service?.name,
              description: s.description || "",
              price: s.price,
              duration_minutes: s.duration_minutes ?? 60,
              category: s.service?.category?.name || s.service_details?.category?.name || "General",
            }));
          }
        } catch {}
      }

      setServices(servicesData);

      // Group sessions
      if (profileData.profile_type === "PROFESSIONAL") {
        const profId =
          profileData.professional_profile_id ??
          profileData.professional_profile?.id ??
          profileData.professional?.id;
        if (profId) {
          try {
            const today = new Date().toISOString().slice(0, 10);
            const gsRes = await groupSessionApi.list({
              provider_type: "professional",
              provider_id: Number(profId),
              date_from: today,
            });
            const results = gsRes.data?.results || [];
            setGroupSessions(
              results.filter(
                (s: any) =>
                  s.status === "ACTIVE" && (s.remaining_slots ?? s.capacity - (s.booked_slots || 0)) > 0
              )
            );
          } catch {
            setGroupSessions([]);
          }
        } else {
          setGroupSessions([]);
        }
      } else if (profileData.profile_type === "PLACE") {
        const placeId =
          profileData.place_profile_id ??
          profileData.place_profile?.id ??
          profileData.place?.id;
        if (placeId) {
          try {
            const today = new Date().toISOString().slice(0, 10);
            const gsRes = await groupSessionApi.list({
              provider_type: "place",
              provider_id: Number(placeId),
              date_from: today,
            });
            const results = gsRes.data?.results || [];
            setGroupSessions(
              results.filter(
                (s: any) =>
                  s.status === "ACTIVE" && (s.remaining_slots ?? s.capacity - (s.booked_slots || 0)) > 0
              )
            );
          } catch {
            setGroupSessions([]);
          }
        } else {
          setGroupSessions([]);
        }
      } else {
        setGroupSessions([]);
      }

      // Posts
      if (profileData.profile_type === "PLACE") {
        const placeUserId = profileData.user;
        const publicProfileId = Number(id);

        let linkedPros: any[] = [];
        try {
          let linksResponse;
          try {
            linksResponse = await linkApi.listPlaceLinksPublic(publicProfileId, "ACCEPTED");
          } catch {
            try {
              const placesResponse = await api.get<any>(`/places/`, {
                params: {search: profileData.name},
              });
              const places = Array.isArray(placesResponse.data?.results)
                ? placesResponse.data.results
                : Array.isArray(placesResponse.data)
                  ? placesResponse.data
                  : [];
              const matchingPlace = places.find((place: any) => place.user_id === placeUserId);
              if (matchingPlace?.id) {
                linksResponse = await linkApi.listPlaceLinks(matchingPlace.id, "ACCEPTED");
              } else {
                linksResponse = {data: []};
              }
            } catch {
              linksResponse = {data: []};
            }
          }
          linkedPros = Array.isArray(linksResponse.data) ? linksResponse.data : [];
          setLinkedProfessionals(linkedPros);
        } catch {
          linkedPros = [];
          setLinkedProfessionals([]);
        }

        if (linkedPros.length > 0) {
          try {
            const professionalDetails = await Promise.all(
              linkedPros.map(async (link: any) => {
                const publicProfileId = link.professional_public_profile_id || link.professional_id;
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
                } catch {
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
            const professionalUserIds = professionalDetails.map((p) => p.user_id).filter((uid): uid is number => uid !== null);

            const allPostPromises = [
              postApi.getPosts({author: placeUserId}).catch(() => ({data: {results: []}})),
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
          } catch {
            if (placeUserId) {
              const postsResponse = await postApi.getPosts({author: placeUserId}).catch(() => ({data: {results: []}}));
              setPosts(postsResponse.data?.results || postsResponse.data || []);
            } else {
              setPosts([]);
            }
          }
        } else {
          if (placeUserId) {
            const postsResponse = await postApi.getPosts({author: placeUserId}).catch(() => ({data: {results: []}}));
            setPosts(postsResponse.data?.results || postsResponse.data || []);
          } else {
            setPosts([]);
          }
        }
      } else if (profileData.profile_type === "PROFESSIONAL") {
        const proUserId = profileData.user;
        try {
          const res = await postApi.getPosts();
          const allPosts = res.data?.results || res.data || [];
          const profilePosts = allPosts.filter((post: any) => {
            return post.author && post.author.id === proUserId;
          });
          setPosts(profilePosts);
        } catch {
          setPosts([]);
        }
      }

      // Linked places (professional only)
      if (profileData.profile_type === "PROFESSIONAL") {
        try {
          const professionalPublicProfileId = Number(id);
          let linksResponse;
          try {
            linksResponse = await linkApi.listProfessionalLinksPublic(professionalPublicProfileId, "ACCEPTED");
          } catch {
            const professionalUserId = profileData.user_id || profileData.user;
            linksResponse = await linkApi.listProfessionalLinks(professionalUserId, "ACCEPTED");
          }
          const rawLinks = Array.isArray(linksResponse.data) ? linksResponse.data : [];

          const profEmail = (profileData.user_email || "").toLowerCase();
          const profName = (profileData.name || "").toLowerCase().trim();

          const filtered = rawLinks.filter((link: any) => {
            const linkEmail = (link.professional_email || "").toLowerCase();
            const linkName = (link.professional_name || "").toLowerCase().trim();
            if (profEmail && linkEmail && linkEmail === profEmail) return true;
            if (profName && linkName && linkName.includes(profName)) return true;
            return false;
          });

          const placesWithDetails = filtered.map((link: any) => ({
            ...link,
            public_profile_id: link.place_public_profile_id || link.place_id,
          }));

          setLinkedPlaces(placesWithDetails);
        } catch {
          setLinkedPlaces([]);
        }
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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
      stars.push(<Ionicons key={i} name="star" color="#F6C531" size={14} />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" color="#F6C531" size={14} />);
    }
    const emptyStars = 5 - Math.ceil(numericRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" color="#F6C531" size={14} />);
    }
    return stars;
  };

  const navigateToBooking = (service: any) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        "Inicia sesion",
        "Necesitas iniciar sesion para reservar.",
        [{text: "OK", onPress: () => router.push("/login")}]
      );
      return;
    }
    if (profile?.user && Number(profile.user) === Number(user.id)) {
      Alert.alert(
        "No puedes reservarte a ti mism@",
        "Para evitar reservas duplicadas, no es posible hacer una reserva en tu propio perfil."
      );
      return;
    }

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
        ? (profile?.place_profile?.name ??
          profile?.place?.name ??
          profile?.name ??
          "")
        : (profile?.professional_profile
            ? `${profile?.professional_profile?.name || ""} ${profile?.professional_profile?.last_name || ""}`.trim()
            : profile?.name || "");

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
        category: String(service?.category || ""),
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

  const hasGroupSessionsSection =
    profile?.profile_type === "PROFESSIONAL" || profile?.profile_type === "PLACE";

  const hasReviewsSection = reviews.length > 0 || reviewsLoading;

  const hasPostsSection = posts.length > 0;

  const sections: Array<{
    key: "team" | "services" | "group_sessions" | "details" | "hours" | "reviews" | "posts";
    label: string;
  }> = [
    {key: "services", label: "Servicios"},
    ...(hasGroupSessionsSection ? [{key: "group_sessions" as const, label: "Sesiones grupales"}] : []),
    ...(hasPostsSection ? [{key: "posts" as const, label: "Publicaciones"}] : []),
    ...(hasReviewsSection ? [{key: "reviews" as const, label: "Resenas"}] : []),
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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const y = sectionOffsetsRef.current[key];
    if (typeof y !== "number") return;
    const topInset = stickyHeightRef.current + 8;
    scrollRef.current?.scrollTo?.({y: Math.max(0, y - topInset), animated: true});
  };

  const renderServices = () => {
    if (services.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="briefcase-outline" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
            No hay servicios disponibles
          </Text>
          <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
            Este proveedor aun no ha publicado servicios.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={service.id || index}
            style={[styles.serviceCard, {backgroundColor: colors.card, borderColor: colors.border}]}
            activeOpacity={0.7}
            onPress={() => navigateToBooking(service)}>
            <View style={styles.serviceContent}>
              <Text
                style={[styles.serviceName, {color: colors.foreground}]}
                numberOfLines={1}>
                {service.name}
              </Text>

              {!!service.description && (
                <Text
                  style={[styles.serviceDescription, {color: colors.mutedForeground}]}
                  numberOfLines={2}>
                  {service.description}
                </Text>
              )}

              <View style={styles.serviceMetaLine}>
                <View style={styles.serviceMetaItem}>
                  <Ionicons name="time-outline" color={colors.mutedForeground} size={13} />
                  <Text style={[styles.serviceMetaText, {color: colors.mutedForeground}]}>
                    {service.duration_minutes || service.duration} min
                  </Text>
                </View>
                <View style={[styles.metaDot, {backgroundColor: colors.mutedForeground}]} />
                <Text style={[styles.servicePrice, {color: colors.primary}]}>
                  {formatPrice(service.price, {suffix: " MXN"})}
                </Text>
                {service.availability_summary && service.availability_summary.length > 0 && (
                  <>
                    <View style={[styles.metaDot, {backgroundColor: colors.mutedForeground}]} />
                    <View style={styles.serviceMetaItem}>
                      <Ionicons name="calendar-outline" color={colors.mutedForeground} size={13} />
                      <Text style={[styles.serviceMetaText, {color: colors.mutedForeground}]}>
                        {service.availability_summary.length} dias/sem
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            <View style={[styles.serviceCta, {backgroundColor: colors.accent}]}>
              <Text style={styles.serviceCtaText}>Reservar</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderGroupSessions = () => {
    const activeSessions = groupSessions.filter(
      (s: any) =>
        s.status === "ACTIVE" && (s.remaining_slots ?? s.capacity - (s.booked_slots || 0)) > 0
    );
    if (activeSessions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="people-outline" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
            No hay sesiones grupales
          </Text>
          <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
            No hay sesiones activas con cupos disponibles.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.servicesContainer}>
        {activeSessions.map((session: any) => {
          const remaining = session.remaining_slots ?? session.capacity - (session.booked_slots || 0);
          return (
            <TouchableOpacity
              key={session.id}
              style={[styles.serviceCard, {backgroundColor: colors.card, borderColor: colors.border}]}
              activeOpacity={0.7}
              onPress={() => router.push(`/group-sessions/${session.id}` as any)}>
              <View style={styles.serviceContent}>
                <Text style={[styles.serviceName, {color: colors.foreground}]} numberOfLines={1}>
                  {session.service_name || "Sesion grupal"}
                </Text>
                <View style={styles.serviceMetaLine}>
                  <View style={styles.serviceMetaItem}>
                    <Ionicons name="calendar-outline" color={colors.mutedForeground} size={13} />
                    <Text style={[styles.serviceMetaText, {color: colors.mutedForeground}]}>
                      {session.date}
                    </Text>
                  </View>
                  <View style={[styles.metaDot, {backgroundColor: colors.mutedForeground}]} />
                  <View style={styles.serviceMetaItem}>
                    <Ionicons name="time-outline" color={colors.mutedForeground} size={13} />
                    <Text style={[styles.serviceMetaText, {color: colors.mutedForeground}]}>
                      {String(session.time).slice(0, 5)}
                    </Text>
                  </View>
                  <View style={[styles.metaDot, {backgroundColor: colors.mutedForeground}]} />
                  <View style={[styles.sessionSlotsBadge, {backgroundColor: colors.successBg}]}>
                    <Text style={[styles.sessionSlotsText, {color: colors.success}]}>
                      {remaining} cupos
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const POSTS_PREVIEW_LIMIT = 6;

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="images-outline" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
            No hay publicaciones
          </Text>
          <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
            Este proveedor aun no ha publicado contenido.
          </Text>
        </View>
      );
    }

    const visiblePosts = posts.slice(0, POSTS_PREVIEW_LIMIT);
    const hasMore = posts.length > POSTS_PREVIEW_LIMIT;

    return (
      <View>
        <View style={styles.postsGrid}>
          {visiblePosts.map((post, index) => {
            const mediaUrl =
              post.media && post.media.length > 0
                ? typeof post.media[0] === "string"
                  ? post.media[0]
                  : post.media[0]?.media_file
                : post.image_url;

            return (
              <TouchableOpacity
                key={post.id || index}
                style={styles.postGridItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (post.id) router.push(`/post/${post.id}`);
                }}>
                {mediaUrl ? (
                  <Image source={{uri: mediaUrl}} style={styles.postGridImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.postGridImagePlaceholder, {backgroundColor: colors.muted}]}>
                    <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.postGridOverlay}>
                  <View style={styles.postGridStats}>
                    <View style={styles.postGridStat}>
                      <Ionicons name="heart" size={13} color="#fff" />
                      <Text style={styles.postGridStatText}>{post.likes_count || 0}</Text>
                    </View>
                    {post.comments_count > 0 && (
                      <View style={styles.postGridStat}>
                        <Ionicons name="chatbubble" size={13} color="#fff" />
                        <Text style={styles.postGridStatText}>{post.comments_count}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {hasMore && (
          <TouchableOpacity
            style={[styles.seeAllButton, {backgroundColor: colors.chipBg}]}
            activeOpacity={0.7}
            onPress={() => router.push(`/profile/posts/${Number(id)}` as any)}>
            <Text style={[styles.seeAllButtonText, {color: colors.primary}]}>
              Ver todas las publicaciones
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderReviews = () => {
    if (reviewsLoading) {
      return (
        <View style={styles.reviewsLoadingContainer}>
          <SkeletonBlock height={80} style={{borderRadius: 12}} />
          <SkeletonBlock height={80} style={{borderRadius: 12}} />
        </View>
      );
    }

    if (reviews.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="star-outline" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
            No hay resenas
          </Text>
          <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
            Las resenas de los clientes apareceran aqui.
          </Text>
        </View>
      );
    }

    const avgRating =
      reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length;

    return (
      <View style={styles.reviewsContainer}>
        <View style={[styles.reviewsSummary, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.reviewsSummaryLeft}>
            <Text style={[styles.reviewsAvgRating, {color: colors.foreground}]}>
              {avgRating.toFixed(1)}
            </Text>
            <View style={styles.reviewsStarsRow}>{renderStars(avgRating)}</View>
            <Text style={[styles.reviewsCount, {color: colors.mutedForeground}]}>
              {reviews.length} {reviews.length === 1 ? "resena" : "resenas"}
            </Text>
          </View>
        </View>

        {reviews.slice(0, 5).map((review: any) => (
          <View
            key={review.id}
            style={[styles.reviewCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewHeaderLeft}>
                <Text style={[styles.reviewAuthorName, {color: colors.foreground}]} numberOfLines={1}>
                  {review.client_name || "Cliente"}
                </Text>
                <Text style={[styles.reviewServiceName, {color: colors.mutedForeground}]}>
                  {review.service_name || ""}
                </Text>
              </View>
              <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}>
                {new Date(review.created_at).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
            <View style={styles.reviewRatingRow}>{renderStars(review.rating)}</View>
            {!!review.comment && (
              <Text style={[styles.reviewComment, {color: colors.foreground}]} numberOfLines={3}>
                {review.comment}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={[styles.errorIconContainer, {backgroundColor: colors.errorBg}]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        </View>
        <Text style={[styles.errorTitle, {color: colors.foreground}]}>
          Error al cargar el perfil
        </Text>
        <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
          {error || "No se pudo cargar la informacion del perfil"}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: colors.primary}]}
          activeOpacity={0.8}
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
            backgroundColor: scrollScrolled ? colors.card : colors.background,
            borderBottomColor: scrollScrolled ? colors.border : "transparent",
            paddingTop: Math.max(insets.top + 12, 20),
          },
        ]}>
        <TouchableOpacity
          onPress={() => goBack("/(tabs)/explore")}
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <View style={[styles.headerIconChip, {backgroundColor: colors.chipBg}]}>
            <Ionicons name="arrow-back" color={colors.foreground} size={20} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerNameRow}>
            {profile.user_image ? (
              <Image source={{uri: profile.user_image}} style={styles.headerAvatar} />
            ) : null}
            <View style={styles.headerNameCol}>
              <Text style={[styles.headerName, {color: colors.foreground}]} numberOfLines={1}>
                {profile?.name || "Perfil"}
              </Text>
              {categoryNames.length > 0 && (
                <View style={[styles.headerCategoryTag, {backgroundColor: colors.chipBg}]}>
                  <Text style={[styles.headerCategoryTagText, {color: colors.primary}]} numberOfLines={1}>
                    {categoryNames[0]}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleShare}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <View style={[styles.headerIconChip, {backgroundColor: colors.chipBg}]}>
              <Ionicons name="share-outline" color={colors.foreground} size={18} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleToggleFavorite}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <View
              style={[
                styles.headerIconChip,
                {backgroundColor: isFavorite ? "#FEE2E2" : colors.chipBg},
              ]}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                color={isFavorite ? "#EF4444" : colors.foreground}
                size={18}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: Math.max(insets.bottom + 220, 260)},
        ]}
        stickyHeaderIndices={[1]}
        onScroll={(e) => {
          const y = e?.nativeEvent?.contentOffset?.y ?? 0;
          setScrollScrolled(y > 10);
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
          {/* Hero Section */}
          <View style={styles.heroSection}>
            {profile.images && profile.images.length > 0 ? (
              <View style={styles.heroImageContainer}>
                <Image
                  source={{uri: profile.images[0]}}
                  style={styles.heroImageSingle}
                  resizeMode="cover"
                />
                {/* Bottom gradient overlay */}
                <View style={styles.heroGradientOverlay} />

                {profile.images.length > 1 && (
                  <TouchableOpacity
                    style={styles.viewAllPhotosButton}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/profile/photos/${Number(id)}` as any)}>
                    <Ionicons name="images-outline" size={14} color="#fff" />
                    <Text style={styles.viewAllPhotosText}>
                      Ver las {profile.images.length} fotos
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[styles.heroImagePlaceholder, {backgroundColor: colors.muted}]}>
                <Ionicons name="image-outline" color={colors.mutedForeground} size={48} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Sticky section tabs */}
        <View
          style={[
            styles.stickyTabs,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
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
                  activeOpacity={0.7}
                  style={[
                    styles.stickyTab,
                    isActive && [styles.stickyTabActive, {borderBottomColor: colors.primary}],
                  ]}>
                  <Text
                    style={[
                      styles.stickyTabText,
                      {color: isActive ? colors.foreground : colors.mutedForeground},
                    ]}>
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
            <View style={[styles.sectionDivider, {backgroundColor: colors.divider}]} />
          </View>

          {hasGroupSessionsSection && (
            <View onLayout={onSectionLayout("group_sessions")} style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Sesiones grupales</Text>
              {renderGroupSessions()}
              <View style={[styles.sectionDivider, {backgroundColor: colors.divider}]} />
            </View>
          )}

          {/* Publicaciones */}
          {hasPostsSection && (
            <View onLayout={onSectionLayout("posts")} style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Publicaciones</Text>
              {renderPosts()}
              <View style={[styles.sectionDivider, {backgroundColor: colors.divider}]} />
            </View>
          )}

          {/* Reviews */}
          {hasReviewsSection && (
            <View onLayout={onSectionLayout("reviews")} style={styles.section}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Resenas</Text>
              {renderReviews()}
              <View style={[styles.sectionDivider, {backgroundColor: colors.divider}]} />
            </View>
          )}

          {/* Detalles */}
          <View onLayout={onSectionLayout("details")} style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Detalles</Text>

            <View style={[styles.detailsCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              {(profile.bio || profile.description) && (
                <Text style={[styles.detailBio, {color: colors.mutedForeground}]}>
                  {profile.bio || profile.description}
                </Text>
              )}

              {subCategoryNames.length > 0 && (
                <View style={styles.subcategoryChips}>
                  {subCategoryNames.map((name, idx) => (
                    <View
                      key={idx}
                      style={[styles.subcategoryChip, {backgroundColor: colors.chipBg}]}>
                      <Text style={[styles.subcategoryChipText, {color: colors.primary}]}>
                        {name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {profile.user_phone && (
                <TouchableOpacity
                  style={styles.detailActionRow}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`tel:${profile.user_phone}`)}>
                  <View style={[styles.detailActionIcon, {backgroundColor: colors.chipBg}]}>
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailActionText, {color: colors.foreground}]}>
                    {profile.user_phone}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}

              {(profile.city || profile.street) && (
                <TouchableOpacity
                  style={styles.detailActionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    const address = `${profile.street || ""} ${profile.city || ""} ${profile.country || ""}`.trim();
                    const query = encodeURIComponent(address);
                    const url = Platform.OS === "ios"
                      ? `maps:0,0?q=${query}`
                      : `geo:0,0?q=${query}`;
                    Linking.openURL(url).catch(() => {
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                    });
                  }}>
                  <View style={[styles.detailActionIcon, {backgroundColor: colors.chipBg}]}>
                    <Ionicons name="location-outline" size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailActionText, {color: colors.foreground}]} numberOfLines={1}>
                    {profile.street && `${profile.street}, `}
                    {profile.city}
                    {profile.country && `, ${profile.country}`}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.sectionDivider, {backgroundColor: colors.divider}]} />
          </View>

          {/* Horario */}
          <View onLayout={onSectionLayout("hours")} style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Horario</Text>
            <View style={[styles.hoursCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              {profile.availability && Array.isArray(profile.availability) ? (
                <AvailabilityDisplay availability={profile.availability} showHeader={false} variant="textOnly" />
              ) : (
                <View style={styles.hoursEmptyState}>
                  <Ionicons name="time-outline" size={24} color={colors.mutedForeground} />
                  <Text style={[styles.hoursEmptyText, {color: colors.mutedForeground}]}>
                    No hay horarios disponibles
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.sectionDivider, {backgroundColor: colors.divider}]} />
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
                          router.push(`/profile/${profileId}`);
                        }}>
                        <View style={[styles.teamStoryRing, {borderColor}]}>
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
                        <Text
                          style={[styles.teamStoryName, {color: colors.foreground}]}
                          numberOfLines={1}>
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
                        style={[styles.teamCard, {backgroundColor: colors.card, borderColor: colors.border}]}
                        activeOpacity={0.7}
                        onPress={() => {
                          const profileId = (link as any).public_profile_id || link.place_id;
                          router.push(`/profile/${profileId}`);
                        }}>
                        <View style={[styles.teamAvatar, {backgroundColor: colors.primary}]}>
                          <Ionicons name="business" color="#fff" size={16} />
                        </View>
                        <View style={styles.teamLine}>
                          <Text
                            style={[styles.teamLineName, {color: colors.foreground}]}
                            numberOfLines={1}>
                            {link.place_name}
                          </Text>
                          <View style={styles.teamLineStatus}>
                            <View style={[styles.teamStatusDot, {backgroundColor: colors.success}]} />
                            <Text style={[styles.teamStatusText, {color: colors.mutedForeground}]}>
                              Vinculado
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View
                    style={[styles.emptyTeamCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                    <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
                      <Ionicons name="business-outline" color={colors.mutedForeground} size={24} />
                    </View>
                    <Text style={[styles.emptyTeamTitle, {color: colors.foreground}]}>
                      No esta vinculado a ningun lugar
                    </Text>
                    <Text style={[styles.emptyTeamText, {color: colors.mutedForeground}]}>
                      Este profesional aun no esta vinculado a ningun establecimiento
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
      paddingVertical: 10,
      paddingTop: 50,
      borderBottomWidth: 1,
    },
    backButton: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    headerIconChip: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    headerNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    headerNameCol: {
      alignItems: "center",
      gap: 1,
    },
    headerName: {
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    headerCategoryTag: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
      maxWidth: 180,
    },
    headerCategoryTagText: {
      fontSize: 11,
      fontWeight: "700",
    },
    headerActions: {
      flexDirection: "row",
      gap: 6,
    },
    headerActionButton: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
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
    heroSection: {
      position: "relative",
      height: 220,
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
    heroGradientOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      backgroundColor: "transparent",
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
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
      bottom: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(10px)",
    },
    viewAllPhotosText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: -0.1,
    },
    postsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 3,
    },
    postGridItem: {
      width: "32.5%",
      aspectRatio: 1,
      position: "relative",
      borderRadius: 6,
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
      backgroundColor: "rgba(0, 0, 0, 0.25)",
      justifyContent: "flex-start",
      padding: 6,
    },
    postGridStats: {
      flexDirection: "row",
      gap: 8,
    },
    postGridStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    postGridStatText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
      textShadowColor: "rgba(0, 0, 0, 0.6)",
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 2,
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 999,
      marginTop: 12,
    },
    seeAllButtonText: {
      fontSize: 13,
      fontWeight: "700",
    },
    stickyTabs: {
      borderBottomWidth: 1,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 0,
    },
    stickyTabsContent: {
      gap: 28,
      paddingRight: 24,
    },
    stickyTab: {
      paddingBottom: 10,
      borderBottomWidth: 2.5,
      borderBottomColor: "transparent",
    },
    stickyTabActive: {},
    stickyTabText: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: -0.1,
    },
    sectionsWrap: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 56,
      gap: 24,
    },
    section: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    sectionDivider: {
      height: 1,
      marginTop: 8,
    },
    servicesContainer: {
      gap: 8,
    },
    serviceCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {elevation: 1},
      }),
    },
    serviceContent: {
      flex: 1,
      gap: 6,
    },
    serviceName: {
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    serviceDescription: {
      fontSize: 12,
      lineHeight: 16,
    },
    serviceMetaLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 2,
      flexWrap: "wrap",
    },
    serviceMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    serviceMetaText: {
      fontSize: 11,
      fontWeight: "600",
    },
    metaDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      opacity: 0.4,
    },
    servicePrice: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    serviceCta: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    serviceCtaText: {
      color: "#12211A",
      fontSize: 12,
      fontWeight: "700",
    },
    sessionSlotsBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    sessionSlotsText: {
      fontSize: 11,
      fontWeight: "700",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 8,
    },
    emptyStateIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
    },
    emptyStateTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    emptyStateDescription: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
    },
    reviewsContainer: {
      gap: 10,
    },
    reviewsSummary: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {elevation: 1},
      }),
    },
    reviewsSummaryLeft: {
      alignItems: "center",
      gap: 4,
    },
    reviewsAvgRating: {
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -1,
    },
    reviewsStarsRow: {
      flexDirection: "row",
      gap: 2,
    },
    reviewsCount: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    reviewsLoadingContainer: {
      gap: 10,
    },
    reviewCard: {
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {elevation: 1},
      }),
    },
    reviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    reviewHeaderLeft: {
      flex: 1,
      gap: 2,
    },
    reviewAuthorName: {
      fontSize: 14,
      fontWeight: "700",
    },
    reviewServiceName: {
      fontSize: 12,
      fontWeight: "500",
    },
    reviewDate: {
      fontSize: 12,
      fontWeight: "500",
    },
    reviewRatingRow: {
      flexDirection: "row",
      gap: 2,
    },
    reviewComment: {
      fontSize: 13,
      lineHeight: 18,
    },
    detailsCard: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      gap: 14,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {elevation: 1},
      }),
    },
    detailBio: {
      fontSize: 14,
      lineHeight: 20,
    },
    subcategoryChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    subcategoryChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    subcategoryChipText: {
      fontSize: 12,
      fontWeight: "600",
    },
    detailActionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 4,
    },
    detailActionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    detailActionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
    },
    hoursCard: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {elevation: 1},
      }),
    },
    hoursEmptyState: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      justifyContent: "center",
      paddingVertical: 8,
    },
    hoursEmptyText: {
      fontSize: 13,
      fontWeight: "500",
    },
    teamScrollContainer: {
      paddingRight: 20,
      gap: 12,
    },
    teamStoryItem: {
      alignItems: "center",
      width: 72,
    },
    teamStoryRing: {
      padding: 2.5,
      borderRadius: 40,
      borderWidth: 2.5,
      marginBottom: 6,
    },
    teamStoryAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2.5,
      overflow: "hidden",
    },
    teamStoryAvatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 30,
      resizeMode: "cover",
    },
    teamStoryAvatarText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
    },
    teamStoryName: {
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
    teamContainer: {
      gap: 8,
    },
    teamCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {elevation: 1},
      }),
    },
    teamAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    teamLine: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    teamLineName: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    teamLineStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexShrink: 0,
    },
    teamStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    teamStatusText: {
      fontSize: 11,
      fontWeight: "600",
    },
    emptyTeamCard: {
      padding: 28,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      borderStyle: "dashed",
      gap: 8,
    },
    emptyTeamTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    emptyTeamText: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    errorContainer: {
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 12,
    },
    errorIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    errorText: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
    retryButton: {
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 999,
      marginTop: 8,
    },
    retryButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    skeletonHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingTop: 50,
      borderBottomWidth: 1,
    },
    skeletonTabs: {
      flexDirection: "row",
      gap: 24,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    skeletonContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    skeletonCard: {
      gap: 8,
    },
});
