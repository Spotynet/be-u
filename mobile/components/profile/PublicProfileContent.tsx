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
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef} from "react";
import {useRouter} from "expo-router";
import {
  providerApi,
  postApi,
  linkApi,
  profileCustomizationApi,
  PlaceProfessionalLink,
  api,
} from "@/lib/api";
import {formatPrice} from "@/lib/priceUtils";
import {errorUtils} from "@/lib/api";
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
}

export function PublicProfileContent({profileId}: PublicProfileContentProps) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"team" | "services" | "details" | "hours">(
    "services"
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const stickyHeightRef = useRef<number>(44);
  const sectionOffsetsRef = useRef<Record<string, number>>({});

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileResponse = await providerApi.getPublicProfile(Number(profileId));
      const profileData = profileResponse.data;
      setProfile(profileData);

      let servicesData: any[] = [];
      try {
        const servicesResponse = await profileCustomizationApi.getCustomServices({
          user: profileData.user,
        });
        servicesData = servicesResponse.data || [];
      } catch {
        servicesData = [];
      }
      setServices(servicesData);

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
        ? profile?.place_profile?.display_name ??
          profile?.place_profile?.name ??
          profile?.place?.name ??
          profile?.display_name ??
          profile?.name ??
          ""
        : profile?.professional_profile?.display_name ??
          profile?.display_name ??
          (profile?.professional_profile
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

  const sections: Array<{key: "team" | "services" | "details" | "hours"; label: string}> = [
    {key: "services", label: "Servicios"},
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
      if (!service?.category) return true;
      const normalizedServiceCategory = String(service.category).toLowerCase().trim();
      return normalizedServiceCategory === selectedMainCategory.toLowerCase().trim();
    });

    if (filteredServices.length === 0) {
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
        {filteredServices.map((service, index) => (
          <TouchableOpacity
            key={service.id || index}
            style={styles.serviceCard}
            activeOpacity={0.7}
            onPress={() => navigateToBooking(service)}>
            <View style={styles.serviceContent}>
              <View style={styles.serviceTopLine}>
                <Text style={[styles.serviceName, {color: colors.foreground}]} numberOfLines={1}>
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
                {service.availability_summary?.length > 0 && (
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
    <ScrollView
      ref={scrollRef}
      style={styles.content}
      showsVerticalScrollIndicator
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
        <View style={styles.heroSection}>
          {profile.images?.length > 0 ? (
            <View style={styles.heroImageContainer}>
              <Image
                source={{uri: profile.images[0]}}
                style={styles.heroImageSingle}
                resizeMode="cover"
              />
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
            </View>
          )}
        </View>
      </Animated.View>

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
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Servicios</Text>
          {renderServices()}
          <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
        </View>

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
              <Text style={[styles.detailRowText, {color: colors.foreground}]}>
                {profile.user_phone}
              </Text>
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

        <View onLayout={onSectionLayout("hours")} style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Horario</Text>
          {profile.availability?.length ? (
            <AvailabilityDisplay
              availability={profile.availability}
              showHeader={false}
              variant="textOnly"
            />
          ) : (
            <Text style={[styles.detailText, {color: colors.mutedForeground}]}>
              No hay horarios disponibles
            </Text>
          )}
          <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />
        </View>

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
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flex: 1},
  scrollContent: {paddingBottom: 100},
  profileSection: {paddingBottom: 0},
  heroSection: {position: "relative", height: 200},
  heroImageContainer: {position: "relative", width: "100%", height: "100%"},
  heroImageSingle: {width: "100%", height: "100%"},
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
  viewAllPhotosText: {color: "#ffffff", fontSize: 12, fontWeight: "800"},
  stickyTabs: {borderBottomWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6},
  stickyTabsContent: {gap: 32, paddingRight: 24},
  stickyTab: {paddingBottom: 12, borderBottomWidth: 2},
  stickyTabText: {fontSize: 13, fontWeight: "800"},
  sectionsWrap: {paddingHorizontal: 20, paddingTop: 22, paddingBottom: 56, gap: 26},
  section: {gap: 12},
  sectionTitle: {fontSize: 18, fontWeight: "800", letterSpacing: -0.3},
  sectionDivider: {height: 1, marginTop: 18},
  detailText: {fontSize: 14, lineHeight: 20},
  detailRow: {flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6},
  detailRowText: {flex: 1, fontSize: 14, fontWeight: "600"},
  servicesContainer: {gap: 0},
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    gap: 0,
  },
  serviceContent: {flex: 1, gap: 4},
  serviceTopLine: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  serviceName: {flex: 1, fontSize: 15, fontWeight: "800"},
  serviceDescription: {fontSize: 13, lineHeight: 18, marginTop: 1},
  servicePrice: {fontSize: 15, fontWeight: "800"},
  serviceMetaLine: {flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2, flexWrap: "wrap"},
  serviceMetaItem: {flexDirection: "row", alignItems: "center", gap: 5},
  serviceMetaText: {fontSize: 12, fontWeight: "600"},
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
  teamScrollContainer: {paddingRight: 20, gap: 8},
  teamStoryItem: {alignItems: "center", width: 68},
  teamStoryRing: {padding: 2, borderRadius: 40, borderWidth: 3, marginBottom: 6},
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
  teamStoryAvatarImage: {width: "100%", height: "100%", borderRadius: 32, resizeMode: "cover"},
  teamStoryAvatarText: {color: "#ffffff", fontSize: 20, fontWeight: "700"},
  teamStoryName: {fontSize: 12, fontWeight: "500", textAlign: "center"},
  teamContainer: {gap: 0},
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    gap: 12,
  },
  teamAvatar: {width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center"},
  teamLine: {flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12},
  teamLineName: {flex: 1, fontSize: 15, fontWeight: "800"},
  teamLineStatus: {flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0},
  teamStatusDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981"},
  teamStatusText: {fontSize: 12, fontWeight: "700"},
  emptyTeamCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    borderStyle: "dashed",
  },
  emptyTeamTitle: {fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8},
  emptyTeamText: {fontSize: 14, textAlign: "center", lineHeight: 20},
  noContentContainer: {alignItems: "center", paddingVertical: 40},
  noContentText: {fontSize: 16, marginTop: 12},
  loadingContainer: {justifyContent: "center", alignItems: "center", gap: 16},
  loadingText: {fontSize: 16},
  errorContainer: {justifyContent: "center", alignItems: "center", padding: 32, gap: 16},
  errorTitle: {fontSize: 20, fontWeight: "600"},
  errorText: {fontSize: 16, textAlign: "center", lineHeight: 24},
  retryButton: {paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16},
  retryButtonText: {color: "#ffffff", fontSize: 16, fontWeight: "600"},
});
