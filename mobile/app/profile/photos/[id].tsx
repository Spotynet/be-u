import {View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useEffect, useMemo, useState} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {providerApi, postApi} from "@/lib/api";

const {width: SCREEN_WIDTH} = Dimensions.get("window");
const GUTTER = 0;
const COLS = 2;

type MasonryItem = {
  uri: string;
  height: number;
};

export default function ProfilePhotosScreen() {
  const {colors} = useThemeVariant();
  const {id} = useLocalSearchParams<{id: string}>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gallery" | "posts">("gallery");
  const [images, setImages] = useState<string[]>([]);
  const [columns, setColumns] = useState<MasonryItem[][]>([[], []]);
  const [posts, setPosts] = useState<any[]>([]);

  const columnWidth = useMemo(() => {
    const padding = 0;
    const totalGutters = 0;
    return Math.floor((SCREEN_WIDTH - padding - totalGutters) / COLS);
  }, []);

  const tileBorderColor = useMemo(() => {
    // Try to apply 30% opacity to theme border if it's hex, otherwise fallback.
    const b = colors.border as unknown as string;
    if (typeof b === "string" && b.startsWith("#") && (b.length === 7 || b.length === 4)) {
      // #RRGGBB -> append alpha (0.3 ~= 4D)
      if (b.length === 7) return `${b}4D`;
      // #RGB -> expand + alpha
      const r = b[1];
      const g = b[2];
      const bl = b[3];
      return `#${r}${r}${g}${g}${bl}${bl}4D`;
    }
    return "rgba(0,0,0,0.3)";
  }, [colors.border]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const res = await providerApi.getPublicProfile(Number(id));
        const profileData = res.data;
        const imgs: string[] = Array.isArray(profileData?.images) ? profileData.images : [];
        if (!mounted) return;
        setImages(imgs);

        // Posts for this profile (by author=user id)
        try {
          const userId = profileData?.user_id ?? profileData?.user;
          if (userId) {
            const postsRes = await postApi.getPosts({author: Number(userId)});
            const list = postsRes.data?.results || [];
            if (mounted) setPosts(list);
          } else {
            if (mounted) setPosts([]);
          }
        } catch {
          if (mounted) setPosts([]);
        }

        // Build masonry columns by measuring image sizes and balancing heights.
        const colHeights = [0, 0];
        const cols: MasonryItem[][] = [[], []];

        await Promise.all(
          imgs.map(
            (uri) =>
              new Promise<void>((resolve) => {
                Image.getSize(
                  uri,
                  (w, h) => {
                    const scaledHeight = Math.max(80, Math.round((columnWidth * h) / w));
                    const next = colHeights[0] <= colHeights[1] ? 0 : 1;
                    cols[next].push({uri, height: scaledHeight});
                    colHeights[next] += scaledHeight + GUTTER;
                    resolve();
                  },
                  () => {
                    const next = colHeights[0] <= colHeights[1] ? 0 : 1;
                    cols[next].push({uri, height: Math.round(columnWidth * 0.8)});
                    colHeights[next] += Math.round(columnWidth * 0.8) + GUTTER;
                    resolve();
                  },
                );
              }),
          ),
        );

        if (!mounted) return;
        setColumns(cols);
      } catch (e) {
        if (!mounted) return;
        setImages([]);
        setColumns([[], []]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id, columnWidth]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 12, 16),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          <Text style={[styles.backText, {color: colors.foreground}]}>Atrás</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Fotos</Text>
        <View style={{width: 60}} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={[styles.tabsBar, {borderBottomColor: colors.border}]}>
            <TouchableOpacity
              onPress={() => setActiveTab("gallery")}
              activeOpacity={0.8}
              style={[
                styles.tab,
                activeTab === "gallery"
                  ? {borderBottomColor: colors.primary}
                  : {borderBottomColor: "transparent"},
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {color: activeTab === "gallery" ? colors.foreground : colors.mutedForeground},
                ]}>
                Galería
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("posts")}
              activeOpacity={0.8}
              style={[
                styles.tab,
                activeTab === "posts"
                  ? {borderBottomColor: colors.primary}
                  : {borderBottomColor: "transparent"},
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {color: activeTab === "posts" ? colors.foreground : colors.mutedForeground},
                ]}>
                Posts
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "gallery" ? (
            images.length === 0 ? (
              <View style={styles.loading}>
                <Ionicons name="images-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>No hay fotos</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.gridWrap} showsVerticalScrollIndicator={false}>
                <View style={styles.gridRow}>
                  {columns.map((col, colIdx) => (
                    <View key={colIdx} style={[styles.column, {width: columnWidth}]}>
                      {col.map((item, idx) => (
                        <Image
                          key={`${colIdx}-${idx}-${item.uri}`}
                          source={{uri: item.uri}}
                          style={[
                            styles.image,
                            {
                              width: columnWidth,
                              height: item.height,
                              backgroundColor: colors.muted + "40",
                              borderColor: tileBorderColor,
                            },
                          ]}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )
          ) : posts.length === 0 ? (
            <View style={styles.loading}>
              <Ionicons name="images-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>No hay posts</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.postsGrid} showsVerticalScrollIndicator={false}>
              {posts
                .map((post, idx) => {
                  const mediaUrl =
                    post.media && post.media.length > 0
                      ? typeof post.media[0] === "string"
                        ? post.media[0]
                        : post.media[0]?.media_file
                      : post.image_url;
                  return {post, idx, mediaUrl};
                })
                .filter((x) => !!x.mediaUrl)
                .map(({post, idx, mediaUrl}) => (
                  <TouchableOpacity
                    key={post.id || idx}
                    style={styles.postGridItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (post.id) router.push(`/post/${post.id}`);
                    }}>
                    <Image
                      source={{uri: mediaUrl}}
                      style={[
                        styles.postGridImage,
                        {
                          backgroundColor: colors.muted + "40",
                          borderColor: tileBorderColor,
                        },
                      ]}
                      resizeMode="cover"
                    />
                    <View style={styles.postGridMeta}>
                      <Ionicons name="heart" size={12} color="#ffffff" />
                      <Text style={styles.postGridMetaText}>{post.likes_count || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    minWidth: 60,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  gridWrap: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabsBar: {
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  gridRow: {
    flexDirection: "row",
    gap: 0,
  },
  column: {
    gap: 0,
  },
  image: {
    borderRadius: 0,
    borderWidth: 0.5,
  },
  postsGrid: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  postGridItem: {
    width: "33.3333%",
    aspectRatio: 1,
    borderRadius: 0,
    overflow: "hidden",
  },
  postGridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    borderWidth: 0.5,
  },
  postGridMeta: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  postGridMetaText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
});


