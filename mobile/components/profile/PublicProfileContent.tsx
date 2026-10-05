/**
 * Reusable public profile content (scroll body only, no header).
 * Used by: profile/[id] (visitor view), ProfessionalProfileTab (owner view).
 */
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
  Platform,
  Linking,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle} from "react";
import {useRouter} from "expo-router";
import {
  providerApi,
  postApi,
  linkApi,
  profileCustomizationApi,
  serviceApi,
  groupSessionApi,
  reviewApi,
  PlaceProfessionalLink,
  api,
} from "@/lib/api";
import {formatPrice} from "@/lib/priceUtils";
import {errorUtils} from "@/lib/api";
import {ContentActionsButton} from "@/components/moderation/ContentActionsButton";
import {
  getSubCategoryById,
  MAIN_CATEGORIES,
  getAvatarColorFromSubcategory,
} from "@/constants/categories";
import {AvailabilityDisplay} from "@/components/profile/AvailabilityDisplay";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useCategory} from "@/contexts/CategoryContext";

export interface PublicProfileContentProps {
  profileId: number;
  ownerMode?: boolean;
  emptyServiceOverride?: React.ReactNode;
  emptyGroupSessionOverride?: React.ReactNode;
  emptyPostsOverride?: React.ReactNode;
  heroOverlay?: React.ReactNode;
  gallerySection?: React.ReactNode;
  sectionHeaderExtra?: (sectionKey: string) => React.ReactNode;
  onProfileLoad?: (profile: any) => void;
  onReload?: () => void;
}

export interface PublicProfileContentRef {
  reload: () => void;
}

export const PublicProfileContent = forwardRef<PublicProfileContentRef, PublicProfileContentProps>(function PublicProfileContent(
  {
    profileId,
    ownerMode = false,
    emptyServiceOverride,
    emptyGroupSessionOverride,
    emptyPostsOverride,
    heroOverlay,
    gallerySection,
    sectionHeaderExtra,
    onProfileLoad,
    onReload,
  },
  ref,
) {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const {selectedMainCategory} = useCategory();

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
  const [activeSection, setActiveSection] = useState<
    "team" | "services" | "group_sessions" | "posts" | "reviews" | "details" | "hours"
  >("services");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const stickyHeightRef = useRef<number>(44);
  const sectionOffsetsRef = useRef<Record<string, number>>({});

  useImperativeHandle(ref, () => ({
    reload: () => fetchProfile(),
  }));

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileResponse = await providerApi.getPublicProfile(Number(profileId));
      const profileData = profileResponse.data;
      setProfile(profileData);
      onProfileLoad?.(profileData);

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
      // Fallback: fetch ProfessionalServices or PlaceServices when CustomServices is empty
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
        } catch {
          // Keep servicesData as []
        }
      }
      setServices(servicesData);

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

      // Fetch reviews
      try {
        setReviewsLoading(true);
        const reviewsRes = await reviewApi.getReviews({public_profile: Number(profileId)});
        setReviews(reviewsRes.data?.results || []);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }

      if (profileData.profile_type === "PLACE") {
        const userId = profileData.user;
        const publicProfileId = Number(profileId);
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
              const matchingPlace = places.find((p: any) => p.user_id === userId);
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
        }

        if (linkedPros.length > 0) {
          try {
            const professionalDetails = await Promise.all(
              linkedPros.map(async (link: any) => {
                const pid = link.professional_public_profile_id || link.professional_id;
                try {
                  const profResponse = await providerApi.getPublicProfile(pid);
                  return {
                    ...link,
                    public_profile_id: pid,
                    user_id: profResponse.data?.user || profResponse.data?.user_id || null,
                    user_image: profResponse.data?.user_image || null,
                    category: profResponse.data?.category,
                    sub_categories: profResponse.data?.sub_categories || [],
                  };
                } catch {
                  return {
                    ...link,
                    public_profile_id: pid,
                    user_id: null,
                    user_image: null,
                    category: null,
                    sub_categories: [],
                  };
                }
              })
            );
            setLinkedProfessionalsDetails(professionalDetails);
            const professionalUserIds = professionalDetails
              .map((p) => p.user_id)
              .filter((id): id is number => id !== null);
            const allPostPromises = [
              postApi.getPosts({author: userId}).catch(() => ({data: {results: []}})),
              ...professionalUserIds.map((uid: number) =>
                postApi.getPosts({author: uid}).catch(() => ({data: {results: []}}))
              ),
            ];
            const allPostsResponses = await Promise.all(allPostPromises);
            const allPosts = allPostsResponses
              .flatMap((r) => r.data?.results || [])
              .sort((a: any, b: any) => {
                const tA = new Date(a.created_at || a.created || 0).getTime();
                const tB = new Date(b.created_at || b.created || 0).getTime();
                return tB - tA;
              });
            setPosts(allPosts);
          } catch {
            if (userId) {
              const r = await postApi.getPosts({author: userId}).catch(() => ({
                data: {results: []},
              }));
              setPosts(r.data?.results || r.data || []);
            }
          }
        } else if (userId) {
          const r = await postApi.getPosts({author: userId}).catch(() => ({
            data: {results: []},
          }));
          setPosts(r.data?.results || r.data || []);
        }
      } else if (profileData.profile_type === "PROFESSIONAL") {
        const userId = profileData.user;
        try {
          const res = await postApi.getPosts();
          const allPosts = res.data?.results || res.data || [];
          const profilePosts = allPosts.filter(
            (post: any) => post.author && post.author.id === userId
          );
          setPosts(profilePosts);
        } catch {
          setPosts([]);
        }
      }

      if (profileData.profile_type === "PROFESSIONAL") {
        const professionalPublicProfileId = Number(profileId);
        try {
          let linksResponse;
          try {
            linksResponse = await linkApi.listProfessionalLinksPublic(
              professionalPublicProfileId,
              "ACCEPTED"
            );
          } catch {
            const profUserId = profileData.user_id || profileData.user;
            linksResponse = await linkApi.listProfessionalLinks(profUserId, "ACCEPTED");
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
    if (profileId) fetchProfile();
  }, [profileId]);

  const navigateToBooking = (service: any) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        "Inicia sesión",
        "Necesitas iniciar sesión para reservar.",
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
    const providerType =
      profile?.profile_type === "PLACE" ? "place_service" : "professional_service";
    const providerId =
      profile?.profile_type === "PLACE"
        ? profile?.place_profile?.id ??
          profile?.place_profile_id ??
          profile?.place?.id ??
          profile?.place_id ??
          profile?.user_place_profile_id ??
          profile?.user_id ??
          profile?.user ??
          0
        : profile?.professional_profile?.id ??
          profile?.professional_profile_id ??
          profile?.professional?.id ??
          profile?.professional_id ??
          profile?.user_professional_profile_id ??
          profile?.user_id ??
          profile?.user ??
          0;
    const providerName =
      profile?.profile_type === "PLACE"
        ? profile?.place_profile?.name ??
          profile?.place?.name ??
          profile?.name ??
          ""
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
    profile?.sub_categories &&
    Array.isArray(profile.sub_categories) &&
    profile.sub_categories.length > 0
      ? profile.sub_categories
          .map((subId: string) => {
            const categories = Array.isArray(profile.category)
              ? profile.category
              : profile.category
                ? [profile.category]
                : [];
            for (const catId of categories) {
              const sub = getSubCategoryById(catId, subId);
              if (sub) return sub.name;
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

  const sections: Array<{key: "team" | "services" | "group_sessions" | "posts" | "reviews" | "details" | "hours"; label: string}> = [
    {key: "services", label: "Servicios"},
    ...(hasGroupSessionsSection ? [{key: "group_sessions" as const, label: "Sesiones grupales"}] : []),
    ...(posts.length > 0 ? [{key: "posts" as const, label: "Publicaciones"}] : []),
    ...(reviews.length > 0 ? [{key: "reviews" as const, label: "Reseñas"}] : []),
    {key: "details", label: "Detalles"},
    {key: "hours", label: "Horario"},
    ...(hasTeamSection
      ? [
          {
            key: "team" as const,
            label: profile?.profile_type === "PLACE" ? "Equipo" : "Trabaja en",
          },
        ]
      : []),
  ];

  const onSectionLayout = (key: string) => (e: any) => {
    sectionOffsetsRef.current[key] = e?.nativeEvent?.layout?.y ?? 0;
  };

  const scrollToSection = (key: typeof activeSection) => {
    const y = sectionOffsetsRef.current[key];
    if (typeof y !== "number") return;
    scrollRef.current?.scrollTo?.({
      y: Math.max(0, y - stickyHeightRef.current - 8),
      animated: true,
    });
  };

  const renderServices = () => {
    const filteredServices = services.filter((service) => {
      if (selectedMainCategory === "todos" || !selectedMainCategory) return true;
      if (!service?.category) return true;
      const normalizedServiceCategory = String(service.category).toLowerCase().trim();
      return normalizedServiceCategory === selectedMainCategory.toLowerCase().trim();
    });

    if (filteredServices.length === 0) {
      if (ownerMode && emptyServiceOverride) return emptyServiceOverride;
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="briefcase-outline" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
            No hay servicios disponibles
          </Text>
          <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
            {ownerMode ? "Agrega servicios para que tus clientes puedan reservar" : "Este proveedor aun no ha publicado servicios."}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.servicesContainer}>
        {filteredServices.map((service, index) => (
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
      if (ownerMode && emptyGroupSessionOverride) return emptyGroupSessionOverride;
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="people-outline" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
            No hay sesiones grupales
          </Text>
          <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
            {ownerMode ? "Crea sesiones grupales para ofrecer experiencias colectivas" : "No hay sesiones activas con cupos disponibles."}
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
                  <View style={[styles.sessionSlotsBadge, {backgroundColor: colors.accent + "22"}]}>
                    <Text style={[styles.sessionSlotsText, {color: colors.accent}]}>
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

  const renderPosts = () => {
    if (posts.length === 0) {
      if (ownerMode && emptyPostsOverride) return emptyPostsOverride;
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="images-outline" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
            No hay publicaciones
          </Text>
          <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
            {ownerMode ? "Comparte fotos y novedades de tu trabajo" : "Este proveedor aun no ha publicado contenido."}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.postsGrid}>
        {posts.map((post, index) => {
          const mediaUrl =
            post.media?.length > 0
              ? typeof post.media[0] === "string"
                ? post.media[0]
                : post.media[0]?.media_file
              : post.image_url;
          return (
            <TouchableOpacity
              key={post.id || index}
              style={styles.postGridItem}
              activeOpacity={0.7}
              onPress={() => post.id && router.push(`/post/${post.id}`)}>
              {mediaUrl ? (
                <Image source={{uri: mediaUrl}} style={styles.postGridImage} resizeMode="cover" />
              ) : (
                <View
                  style={[styles.postGridImagePlaceholder, {backgroundColor: colors.muted}]}>
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
    <ScrollView
      ref={scrollRef}
      style={styles.content}
      showsVerticalScrollIndicator
      contentContainerStyle={styles.scrollContent}
      stickyHeaderIndices={gallerySection ? [2] : [1]}
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
        <View style={styles.heroSection}>
          {profile.images?.length > 0 ? (
            <View style={styles.heroImageContainer}>
              <Image
                source={{uri: profile.images[0]}}
                style={styles.heroImageSingle}
                resizeMode="cover"
              />
              <View style={styles.heroGradient} pointerEvents="none" />
              {heroOverlay}
              {profile.images.length > 1 && (
                <TouchableOpacity
                  style={styles.viewAllPhotosButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/profile/photos/${Number(profileId)}` as any)
                  }>
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
              {heroOverlay}
            </View>
          )}
        </View>
      </Animated.View>

      {gallerySection}

      <View
        style={[
          styles.stickyTabs,
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}
        onLayout={(e) => {
          stickyHeightRef.current = e?.nativeEvent?.layout?.height ?? 44;
        }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stickyTabsContent}>
          {sections.map((s) => {
            const isActive = activeSection === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => scrollToSection(s.key)}
                activeOpacity={0.8}
                style={[
                  styles.stickyTab,
                  isActive
                    ? {borderBottomColor: colors.primary}
                    : {borderBottomColor: "transparent"},
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

      <View style={styles.sectionsWrap}>
        <View onLayout={onSectionLayout("services")} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Servicios</Text>
            {sectionHeaderExtra?.("services")}
          </View>
          {renderServices()}
          <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
        </View>

        {hasGroupSessionsSection && (
          <View onLayout={onSectionLayout("group_sessions")} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Sesiones grupales</Text>
              {sectionHeaderExtra?.("group_sessions")}
            </View>
            {renderGroupSessions()}
            <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
          </View>
        )}

        {posts.length > 0 && (
          <View onLayout={onSectionLayout("posts")} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Publicaciones</Text>
              <View style={{flexDirection: "row", alignItems: "center", gap: 12}}>
                {sectionHeaderExtra?.("posts")}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`/profile/posts/${Number(profileId)}` as any)}>
                  <Text style={[styles.seeAllText, {color: colors.primary}]}>Ver todas</Text>
                </TouchableOpacity>
              </View>
            </View>
            {renderPosts()}
            <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
          </View>
        )}

        {reviews.length > 0 && (
          <View onLayout={onSectionLayout("reviews")} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Reseñas</Text>
              {sectionHeaderExtra?.("reviews")}
            </View>
            {reviews.map((review: any) => (
              <View key={review.id} style={[styles.reviewCard, {borderColor: colors.border, backgroundColor: colors.card}]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, {backgroundColor: colors.primary + "20"}]}>
                    <Text style={[styles.reviewAvatarText, {color: colors.primary}]}>
                      {(review.reviewer_name || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={[styles.reviewName, {color: colors.foreground}]} numberOfLines={1}>
                      {review.reviewer_name || "Usuario"}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? "star" : "star-outline"}
                          size={14}
                          color={star <= review.rating ? "#F6C531" : colors.mutedForeground}
                        />
                      ))}
                    </View>
                  </View>
                  <ContentActionsButton
                    targetType="review"
                    targetId={review.id}
                    authorUserId={review.from_user}
                    color={colors.mutedForeground}
                    size={18}
                    onBlocked={(userId) =>
                      setReviews((prev) => prev.filter((item) => item.from_user !== userId))
                    }
                  />
                </View>
                {review.comment && (
                  <Text style={[styles.reviewComment, {color: colors.mutedForeground}]} numberOfLines={3}>
                    {review.comment}
                  </Text>
                )}
              </View>
            ))}
            <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
          </View>
        )}

        <View onLayout={onSectionLayout("details")} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Detalles</Text>
            {sectionHeaderExtra?.("details")}
          </View>
          {(profile.bio || profile.description) && (
            <Text style={[styles.detailText, {color: colors.mutedForeground}]}>
              {profile.bio || profile.description}
            </Text>
          )}
          <View style={[styles.detailCard, {borderColor: colors.border, backgroundColor: colors.card}]}>
            {subCategoryNames.length > 0 && (
              <View style={styles.detailChipsRow}>
                {subCategoryNames.map((name, i) => (
                  <View
                    key={i}
                    style={[styles.subcategoryChip, {backgroundColor: colors.primary + "12"}]}>
                    <Text style={[styles.subcategoryChipText, {color: colors.primary}]}>{name}</Text>
                  </View>
                ))}
              </View>
            )}
            {profile.user_phone && (
              <TouchableOpacity
                style={styles.detailActionRow}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`tel:${profile.user_phone}`)}>
                <View style={[styles.detailActionIcon, {backgroundColor: colors.primary + "15"}]}>
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
                  if (address) {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
                  }
                }}>
                <View style={[styles.detailActionIcon, {backgroundColor: colors.primary + "15"}]}>
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
          <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
        </View>

        <View onLayout={onSectionLayout("hours")} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Horario</Text>
            {sectionHeaderExtra?.("hours")}
          </View>
          {profile.availability?.length ? (
            <View style={[styles.hoursCard, {borderColor: colors.border, backgroundColor: colors.card}]}>
              <AvailabilityDisplay
                availability={profile.availability}
                showHeader={false}
                variant="textOnly"
              />
            </View>
          ) : (
            <View style={[styles.hoursEmptyState, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Ionicons name="time-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.hoursEmptyText, {color: colors.mutedForeground}]}>
                Sin horarios configurados
              </Text>
            </View>
          )}
          <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
        </View>

        {hasTeamSection && (
          <View onLayout={onSectionLayout("team")} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                {profile.profile_type === "PLACE" ? "Nuestro Equipo" : "Trabaja en"}
              </Text>
              {sectionHeaderExtra?.("team")}
            </View>
            {profile.profile_type === "PLACE" && linkedProfessionalsDetails.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.teamScrollContainer}>
                {linkedProfessionalsDetails.map((linkDetail) => {
                  const getInitials = (name: string) => {
                    const words = name.split(" ");
                    return words.length >= 2
                      ? `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
                      : name.substring(0, 2).toUpperCase();
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
                      onPress={() =>
                        router.push(
                          `/profile/${linkDetail.public_profile_id || linkDetail.professional_id}`
                        )
                      }>
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
                      style={styles.teamCard}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push(
                          `/profile/${(link as any).public_profile_id || link.place_id}`
                        )
                      }>
                      <View style={[styles.teamAvatar, {backgroundColor: colors.primary}]}>
                        <Ionicons name="business" color="#ffffff" size={18} />
                      </View>
                      <View style={styles.teamLine}>
                        <Text
                          style={[styles.teamLineName, {color: colors.foreground}]}
                          numberOfLines={1}>
                          {link.place_name}
                        </Text>
                        <View style={styles.teamLineStatus}>
                          <View style={styles.teamStatusDot} />
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
                  style={[
                    styles.emptyTeamCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}>
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
  );
});

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flex: 1},
  scrollContent: {paddingBottom: 100},
  profileSection: {paddingBottom: 0},
  heroSection: {position: "relative", height: 220},
  heroImageContainer: {position: "relative", width: "100%", height: "100%"},
  heroImageSingle: {width: "100%", height: "100%"},
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {elevation: 8},
    }),
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  viewAllPhotosText: {color: "#ffffff", fontSize: 12, fontWeight: "800"},
  stickyTabs: {borderBottomWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6},
  stickyTabsContent: {gap: 32, paddingRight: 24},
  stickyTab: {paddingBottom: 12, borderBottomWidth: 2},
  stickyTabText: {fontSize: 13, fontWeight: "800"},
  sectionsWrap: {paddingHorizontal: 20, paddingTop: 22, paddingBottom: 56, gap: 26},
  section: {gap: 12},
  sectionHeaderRow: {flexDirection: "row", alignItems: "center", justifyContent: "space-between"},
  sectionTitle: {fontSize: 18, fontWeight: "800", letterSpacing: -0.3},
  sectionDivider: {height: 1, marginTop: 18},
  seeAllText: {fontSize: 13, fontWeight: "700"},
  detailText: {fontSize: 14, lineHeight: 20},
  detailRow: {flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6},
  detailRowText: {flex: 1, fontSize: 14, fontWeight: "600"},
  detailCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 6},
      android: {elevation: 1},
    }),
  },
  detailChipsRow: {flexDirection: "row", flexWrap: "wrap", gap: 8},
  subcategoryChip: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999},
  subcategoryChipText: {fontSize: 12, fontWeight: "600"},
  detailActionRow: {flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4},
  detailActionIcon: {width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center"},
  detailActionText: {flex: 1, fontSize: 14, fontWeight: "600"},
  hoursCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 6},
      android: {elevation: 1},
    }),
  },
  hoursEmptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  hoursEmptyText: {fontSize: 13, fontWeight: "500"},
  servicesContainer: {gap: 8},
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 6},
      android: {elevation: 1},
    }),
  },
  serviceContent: {flex: 1, gap: 6},
  serviceName: {fontSize: 14, fontWeight: "700", letterSpacing: -0.2},
  serviceDescription: {fontSize: 12, lineHeight: 16},
  servicePrice: {fontSize: 12, fontWeight: "700", letterSpacing: -0.2},
  serviceMetaLine: {flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap"},
  serviceMetaItem: {flexDirection: "row", alignItems: "center", gap: 4},
  serviceMetaText: {fontSize: 11, fontWeight: "600"},
  metaDot: {width: 3, height: 3, borderRadius: 1.5, opacity: 0.4},
  serviceCta: {paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999},
  serviceCtaText: {color: "#12211A", fontSize: 12, fontWeight: "700"},
  sessionSlotsBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999},
  sessionSlotsText: {fontSize: 11, fontWeight: "700"},
  emptyState: {alignItems: "center", paddingVertical: 28, gap: 8},
  emptyStateIcon: {width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: 4},
  emptyStateTitle: {fontSize: 15, fontWeight: "700"},
  emptyStateDescription: {fontSize: 13, textAlign: "center", lineHeight: 18},
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
  postGridImage: {width: "100%", height: "100%"},
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
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    padding: 8,
  },
  postGridStats: {flexDirection: "row", gap: 12},
  postGridStat: {flexDirection: "row", alignItems: "center", gap: 4},
  postGridStatText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  reviewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 6},
      android: {elevation: 1},
    }),
  },
  reviewHeader: {flexDirection: "row", alignItems: "center", gap: 10},
  reviewAvatar: {width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center"},
  reviewAvatarText: {fontSize: 14, fontWeight: "800"},
  reviewInfo: {flex: 1, gap: 2},
  reviewName: {fontSize: 14, fontWeight: "700"},
  reviewStars: {flexDirection: "row", gap: 2},
  reviewComment: {fontSize: 13, lineHeight: 18},
  teamScrollContainer: {paddingRight: 20, gap: 12},
  teamStoryItem: {alignItems: "center", width: 72},
  teamStoryRing: {padding: 2.5, borderRadius: 40, borderWidth: 2.5, marginBottom: 6},
  teamStoryAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    overflow: "hidden",
  },
  teamStoryAvatarImage: {width: "100%", height: "100%", borderRadius: 30, resizeMode: "cover"},
  teamStoryAvatarText: {color: "#ffffff", fontSize: 18, fontWeight: "700"},
  teamStoryName: {fontSize: 11, fontWeight: "600", textAlign: "center"},
  teamContainer: {gap: 8},
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 6},
      android: {elevation: 1},
    }),
  },
  teamAvatar: {width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center"},
  teamLine: {flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8},
  teamLineName: {flex: 1, fontSize: 14, fontWeight: "700", letterSpacing: -0.2},
  teamLineStatus: {flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0},
  teamStatusDot: {width: 6, height: 6, borderRadius: 3},
  teamStatusText: {fontSize: 11, fontWeight: "600"},
  emptyTeamCard: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    borderStyle: "dashed",
    gap: 8,
  },
  emptyTeamTitle: {fontSize: 15, fontWeight: "700"},
  emptyTeamText: {fontSize: 13, textAlign: "center", lineHeight: 18},
  noContentContainer: {alignItems: "center", paddingVertical: 40},
  noContentText: {fontSize: 16, marginTop: 12},
  emptyText: {fontSize: 14, fontWeight: "600"},
  loadingContainer: {justifyContent: "center", alignItems: "center", gap: 16},
  loadingText: {fontSize: 16},
  errorContainer: {justifyContent: "center", alignItems: "center", padding: 32, gap: 12},
  errorIconContainer: {width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8},
  errorTitle: {fontSize: 18, fontWeight: "700"},
  errorText: {fontSize: 14, textAlign: "center", lineHeight: 20},
  retryButton: {paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, marginTop: 8},
  retryButtonText: {color: "#ffffff", fontSize: 15, fontWeight: "600"},
});
