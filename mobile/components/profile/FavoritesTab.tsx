import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth";
import {useFavorites} from "@/features/favorites";
import {useState, useEffect, useCallback, useMemo} from "react";
import {postApi} from "@/lib/api";
import {
  MAIN_CATEGORIES,
  getMainCategoryIdForSubcategory,
} from "@/constants/categories";
import type {Favorite} from "@/features/favorites";

const MAIN_CATEGORY_IDS = ["belleza", "bienestar", "mascotas"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  belleza: "Belleza",
  bienestar: "Bienestar",
  mascotas: "Mascotas",
  otros: "Otros",
};

function getPostMainCategoryId(post: any): string {
  const raw = post.author_category;
  if (!raw) return "otros";
  const value = Array.isArray(raw) ? raw[0] : raw;
  const str = String(value || "").toLowerCase().trim();
  if (MAIN_CATEGORY_IDS.includes(str as any)) return str;
  const fromSub = getMainCategoryIdForSubcategory(str);
  return fromSub || "otros";
}

function getFavoriteMainCategoryId(fav: Favorite): string {
  const fromSub = getMainCategoryIdForSubcategory(fav.favorite_specialty || "");
  return fromSub || "otros";
}

export function FavoritesTab() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const {favorites, isLoading, error, removeFavorite, refreshFavorites} = useFavorites({
    onUnauthorized: () => router.replace("/login"),
  });
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLikedPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const response = await postApi.getLikedPosts();
      setLikedPosts(response.data.results || []);
    } catch (err) {
      console.error("Error fetching liked posts:", err);
      setLikedPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    fetchLikedPosts();
  }, [isAuthenticated, fetchLikedPosts, router]);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshFavorites(), fetchLikedPosts()]);
    setRefreshing(false);
  }, [refreshFavorites, fetchLikedPosts]);

  const handleUnlikePost = async (postId: number) => {
    try {
      await postApi.likePost(postId);
      fetchLikedPosts();
    } catch (err) {
      console.error("Error unliking post:", err);
    }
  };

  const favoritesByCategory = useMemo(() => {
    const map: Record<string, Favorite[]> = {};
    for (const id of MAIN_CATEGORY_IDS) map[id] = [];
    map.otros = [];
    for (const fav of favorites) {
      const catId = getFavoriteMainCategoryId(fav);
      if (!map[catId]) map[catId] = [];
      map[catId].push(fav);
    }
    return map;
  }, [favorites]);

  const postsByCategory = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const id of MAIN_CATEGORY_IDS) map[id] = [];
    map.otros = [];
    for (const post of likedPosts) {
      const catId = getPostMainCategoryId(post);
      if (!map[catId]) map[catId] = [];
      map[catId].push(post);
    }
    return map;
  }, [likedPosts]);

  const categoryOrder = useMemo(
    () => [...MAIN_CATEGORY_IDS, "otros"],
    []
  );

  const hasContent = favorites.length > 0 || likedPosts.length > 0;
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" color={colors.mutedForeground} size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay favoritos</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
        Guarda tus profesionales, lugares y publicaciones favoritas para acceder a ellos rápidamente.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle-outline" color="#ef4444" size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>Error al cargar favoritos</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, {backgroundColor: colors.primary}]}
        onPress={refreshFavorites}
        activeOpacity={0.9}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.emptyState}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>Cargando favoritos...</Text>
    </View>
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="heart-outline" color={colors.mutedForeground} size={64} />
        <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
          Inicia sesión para ver tus favoritos
        </Text>
        <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
          Guarda tus profesionales y lugares favoritos para acceder a ellos rápidamente.
        </Text>
        <TouchableOpacity
          style={[styles.exploreButton, {backgroundColor: colors.primary}]}
          onPress={() => router.push("/login")}
          activeOpacity={0.9}>
          <Text style={styles.exploreButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state
  if (isLoading || loadingPosts) {
    return renderLoadingState();
  }

  // Show error state
  if (error) {
    return renderErrorState();
  }

  // Show empty state
  if (!hasContent) {
    return renderEmptyState();
  }

  const getAvatarColor = (index: number) => {
    const colors = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
    return colors[index % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      await removeFavorite(favoriteId);
    } catch (err) {
      // Error already handled in hook
    }
  };

  const MAX_PER_CATEGORY = 3;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {categoryOrder.map((catId) => {
        const allFavorites = favoritesByCategory[catId] || [];
        const allPosts = postsByCategory[catId] || [];
        const categoryFavorites = allFavorites.slice(0, MAX_PER_CATEGORY);
        const categoryPosts = allPosts.slice(0, MAX_PER_CATEGORY);
        const hasSection = allFavorites.length > 0 || allPosts.length > 0;
        if (!hasSection) return null;

        const categoryLabel = CATEGORY_LABELS[catId] ?? catId;
        const showVerTodas = allFavorites.length > MAX_PER_CATEGORY || allPosts.length > MAX_PER_CATEGORY;

        return (
          <View key={catId} style={styles.section}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, {color: colors.foreground}]}>
                {categoryLabel}
              </Text>
              {showVerTodas && (
                <TouchableOpacity
                  onPress={() => router.push(`/guardados/${catId}` as any)}
                  activeOpacity={0.7}
                  style={styles.verTodasButton}>
                  <Text style={[styles.verTodasText, {color: colors.primary}]}>Ver todas</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {categoryFavorites.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, {color: colors.mutedForeground}]}>
                  Perfiles Guardados
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.profileScroll}
                  contentContainerStyle={styles.profileRow}>
                  {categoryFavorites.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.card, {backgroundColor: colors.card}]}
                      onPress={() => {
                        const profileId = item.public_profile_id || item.content_object_id;
                        router.push(`/profile/${profileId}` as any);
                      }}
                      activeOpacity={0.7}>
                      <View style={[styles.avatar, {backgroundColor: getAvatarColor(index)}]}>
                        <Text style={styles.avatarText}>{getInitials(item.favorite_name)}</Text>
                      </View>
                      <Text style={[styles.name, {color: colors.foreground}]} numberOfLines={1}>
                        {item.favorite_name}
                      </Text>
                      <Text style={[styles.specialty, {color: colors.mutedForeground}]} numberOfLines={1}>
                        {item.favorite_specialty}
                      </Text>
                      <TouchableOpacity
                        style={styles.heartButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(item.id);
                        }}>
                        <Ionicons name="heart" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {categoryPosts.length > 0 && (
              <>
                <View style={[styles.postsGrid, {marginTop: 8}]}>
                  {categoryPosts.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      style={styles.postCard}
                      onPress={() =>
                        router.push({
                          pathname: `/post/${post.id}`,
                          params: {liked: "true"},
                        } as any)
                      }
                      activeOpacity={0.7}>
                      {post.media && post.media.length > 0 ? (
                        <Image
                          source={{uri: post.media[0].media_file}}
                          style={styles.postImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.postImagePlaceholder, {backgroundColor: colors.muted}]}>
                          <Ionicons name="image-outline" size={40} color={colors.mutedForeground} />
                        </View>
                      )}
                      <View style={styles.postOverlay}>
                        <View style={styles.postStats}>
                          <View style={styles.postStat}>
                            <Ionicons name="heart" size={16} color="#ffffff" />
                            <Text style={styles.postStatText}>{post.likes_count || 0}</Text>
                          </View>
                          {post.comments_count > 0 && (
                            <View style={styles.postStat}>
                              <Ionicons name="chatbubble" size={16} color="#ffffff" />
                              <Text style={styles.postStatText}>{post.comments_count}</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.postHeartButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleUnlikePost(post.id);
                          }}>
                          <Ionicons name="heart" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        );
      })}
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    marginTop: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  verTodasButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  verTodasText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  profileScroll: {
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  profileRow: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 4,
    paddingRight: 16,
  },
  card: {
    width: 160,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  specialty: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 4,
  },
  postCard: {
    width: "31.5%",
    aspectRatio: 1,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
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
  postOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
    padding: 8,
  },
  postStats: {
    flexDirection: "row",
    gap: 12,
  },
  postStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postStatText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  postHeartButton: {
    alignSelf: "flex-end",
    padding: 4,
  },
});
