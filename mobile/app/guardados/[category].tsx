import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {useFavorites} from "@/features/favorites";
import {useState, useEffect, useMemo} from "react";
import {postApi} from "@/lib/api";
import {
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

export default function GuardadosCategoryScreen() {
  const {category} = useLocalSearchParams<{category: string}>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();

  const {favorites, isLoading: loadingFavs, removeFavorite} = useFavorites();
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const categoryId = category || "belleza";
  const categoryLabel = CATEGORY_LABELS[categoryId] ?? categoryId;

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const response = await postApi.getLikedPosts();
        setLikedPosts(response.data.results || []);
      } catch (err) {
        setLikedPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    })();
  }, [isAuthenticated]);

  const categoryFavorites = useMemo(() => {
    return favorites.filter((fav) => getFavoriteMainCategoryId(fav) === categoryId);
  }, [favorites, categoryId]);

  const categoryPosts = useMemo(() => {
    return likedPosts.filter((post) => getPostMainCategoryId(post) === categoryId);
  }, [likedPosts, categoryId]);

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      await removeFavorite(favoriteId);
    } catch {}
  };

  const handleUnlikePost = async (postId: number) => {
    try {
      await postApi.likePost(postId);
      const res = await postApi.getLikedPosts();
      setLikedPosts(res.data.results || []);
    } catch {}
  };

  const getAvatarColor = (index: number) => {
    const c = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
    return c[index % c.length];
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const isLoading = loadingFavs || loadingPosts;
  const hasContent = categoryFavorites.length > 0 || categoryPosts.length > 0;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {paddingTop: insets.top + 12, borderBottomColor: colors.border}]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>{categoryLabel}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
            Inicia sesión para ver tus guardados
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {paddingTop: insets.top + 12, borderBottomColor: colors.border, backgroundColor: colors.background}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>{categoryLabel}</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !hasContent ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
            No hay guardados en {categoryLabel}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Perfiles en grid 2 columnas */}
          {categoryFavorites.length > 0 && (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, {color: colors.foreground}]}>Perfiles</Text>
              <View style={styles.profilesGrid}>
                {categoryFavorites.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.profileCard, {backgroundColor: colors.card, borderColor: colors.border}]}
                    onPress={() =>
                      router.push(`/profile/${item.public_profile_id || item.content_object_id}` as any)
                    }
                    activeOpacity={0.7}>
                    <View style={[styles.avatar, {backgroundColor: getAvatarColor(index)}]}>
                      <Text style={styles.avatarText}>{getInitials(item.favorite_name)}</Text>
                    </View>
                    <Text style={[styles.profileName, {color: colors.foreground}]} numberOfLines={1}>
                      {item.favorite_name}
                    </Text>
                    <Text style={[styles.profileSpecialty, {color: colors.mutedForeground}]} numberOfLines={1}>
                      {item.favorite_specialty}
                    </Text>
                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(item.id);
                      }}>
                      <Ionicons name="heart" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Publicaciones en mosaico 3 columnas */}
          {categoryPosts.length > 0 && (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, {color: colors.foreground}]}>Publicaciones</Text>
              <View style={styles.mosaicGrid}>
                {categoryPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.mosaicItem}
                    onPress={() =>
                      router.push({pathname: `/post/${post.id}`, params: {liked: "true"}} as any)
                    }
                    activeOpacity={0.7}>
                    {post.media && post.media.length > 0 ? (
                      <Image
                        source={{uri: post.media[0].media_file}}
                        style={styles.mosaicImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.mosaicPlaceholder, {backgroundColor: colors.muted}]}>
                        <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
                      </View>
                    )}
                    <View style={styles.mosaicOverlay}>
                      <View style={styles.mosaicStats}>
                        <Ionicons name="heart" size={14} color="#ffffff" />
                        <Text style={styles.mosaicStatText}>{post.likes_count || 0}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.mosaicHeartBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleUnlikePost(post.id);
                        }}>
                        <Ionicons name="heart" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={{height: 40}} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {padding: 8},
  headerTitle: {fontSize: 18, fontWeight: "800"},
  placeholder: {width: 40},
  centered: {flex: 1, justifyContent: "center", alignItems: "center", padding: 24},
  emptyText: {fontSize: 15, textAlign: "center"},
  scroll: {flex: 1},
  scrollContent: {padding: 16, paddingTop: 20},
  block: {marginBottom: 24},
  blockTitle: {fontSize: 16, fontWeight: "700", marginBottom: 12},
  profilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  profileCard: {
    width: "47%",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: {fontSize: 18, fontWeight: "800", color: "#ffffff"},
  profileName: {fontSize: 14, fontWeight: "700", textAlign: "center"},
  profileSpecialty: {fontSize: 12, textAlign: "center"},
  heartBtn: {position: "absolute", top: 8, right: 8, padding: 6},
  mosaicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  mosaicItem: {
    width: "32.5%",
    aspectRatio: 1,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  mosaicImage: {width: "100%", height: "100%"},
  mosaicPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mosaicOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "space-between",
    padding: 6,
  },
  mosaicStats: {flexDirection: "row", alignItems: "center", gap: 4},
  mosaicStatText: {color: "#fff", fontSize: 11, fontWeight: "700"},
  mosaicHeartBtn: {alignSelf: "flex-end"},
});
