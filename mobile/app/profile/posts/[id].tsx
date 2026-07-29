import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useCallback} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {AppHeader} from "@/components/ui/AppHeader";
import {providerApi, postApi} from "@/lib/api";

const PAGE_SIZE = 12;

export default function ProfilePostsScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();

  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileName, setProfileName] = useState("");

  const fetchPosts = useCallback(
    async (pageNum: number, refresh = false) => {
      try {
        if (refresh) setIsRefreshing(true);
        else if (pageNum > 1) setIsLoadingMore(true);

        const profileRes = await providerApi.getPublicProfile(Number(id));
        const profileData = profileRes.data;
        setProfileName(profileData.name || "Publicaciones");

        const userId =
          typeof profileData.user === "object"
            ? profileData.user?.id
            : profileData.user;

        if (!userId) {
          setPosts([]);
          setHasMore(false);
          return;
        }

        const res = await postApi.getPosts({author: userId, page: pageNum});
        const results = res.data?.results || [];

        if (pageNum === 1) {
          setPosts(results);
        } else {
          setPosts((prev) => [...prev, ...results]);
        }

        setHasMore(results.length >= PAGE_SIZE);
        setPage(pageNum);
      } catch {
        if (pageNum === 1) setPosts([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (id) fetchPosts(1);
  }, [id, fetchPosts]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchPosts(page + 1);
    }
  };

  const handleRefresh = () => {
    fetchPosts(1, true);
  };

  const renderPostItem = ({item: post}: {item: any}) => {
    const mediaUrl =
      post.media && post.media.length > 0
        ? typeof post.media[0] === "string"
          ? post.media[0]
          : post.media[0]?.media_file
        : post.image_url;

    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.7}
        onPress={() => {
          if (post.id) router.push(`/post/${post.id}`);
        }}>
        {mediaUrl ? (
          <Image source={{uri: mediaUrl}} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <View style={[styles.gridPlaceholder, {backgroundColor: colors.muted}]}>
            <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.gridOverlay}>
          <View style={styles.gridStats}>
            <View style={styles.gridStat}>
              <Ionicons name="heart" size={13} color="#fff" />
              <Text style={styles.gridStatText}>{post.likes_count || 0}</Text>
            </View>
            {post.comments_count > 0 && (
              <View style={styles.gridStat}>
                <Ionicons name="chatbubble" size={13} color="#fff" />
                <Text style={styles.gridStatText}>{post.comments_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, {backgroundColor: colors.muted}]}>
          <Ionicons name="images-outline" size={32} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
          No hay publicaciones
        </Text>
        <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
          Este proveedor aun no ha publicado contenido.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title={profileName || "Publicaciones"}
        showBackButton
        backFallbackRoute={`/profile/${id}`}
      />
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: 3,
    paddingHorizontal: 3,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: 1.5,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "flex-start",
    padding: 6,
  },
  gridStats: {
    flexDirection: "row",
    gap: 8,
  },
  gridStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  gridStatText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
