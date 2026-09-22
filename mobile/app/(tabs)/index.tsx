import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useCategory} from "@/contexts/CategoryContext";
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {postApi, tokenUtils} from "@/lib/api";
import {SubCategoryBar} from "@/components/ui/SubCategoryBar";
import {getAvatarColorFromSubcategory} from "@/constants/categories";
import {postFormats} from "@/constants/postFormats";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {TourTarget} from "@/components/onboarding/TourTarget";
import {AppLogo} from "@/components/AppLogo";
import {APP_HEADER_BUTTON_HIT} from "@/components/ui/AppHeader";
import {useAppTheme} from "@/constants/theme";
import {HeaderCategoryDropdown} from "@/components/HeaderCategoryDropdown";

const {width: SCREEN_WIDTH} = Dimensions.get("window");
// Mosaic grid: postsSection padding 20*2 + postCard padding 16*2 + grid padding 10*2 + gap 8
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 20 * 2 - 16 * 2 - 10 * 2 - 8) / 2;

function formatCommentTime(createdAt: string | undefined): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

// Carousel Component with indicators
const CarouselView = ({images, colors, screenWidth}: {images: string[]; colors: any; screenWidth: number}) => {
  const theme = useAppTheme();
  const styles = makeStyles(colors, theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const updateIndex = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    const clamped = Math.max(0, Math.min(index, images.length - 1));
    setCurrentIndex(clamped);
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carouselScrollView}
        contentContainerStyle={styles.carouselContent}
        onScroll={updateIndex}
        onMomentumScrollEnd={updateIndex}
        scrollEventThrottle={16}>
        {images.map((imageUrl: string, index: number) => (
          <View key={index} style={styles.carouselSlide}>
            <Image source={{uri: imageUrl}} style={styles.carouselImage} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>
      {/* Contador tipo "1/5" en la esquina superior derecha */}
      {images.length > 1 && (
        <View style={styles.carouselCounterBadge}>
          <Text style={styles.carouselCounterText}>
            {currentIndex + 1}/{images.length}
          </Text>
        </View>
      )}
      {/* Puntos de paginación abajo, sobre la imagen: activo rosa, inactivos blancos */}
      {images.length > 1 && (
        <View style={styles.carouselDotsOverlay} pointerEvents="none">
          {images.map((_, index: number) => (
            <View
              key={index}
              style={[
                styles.carouselDot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : "rgba(255, 255, 255, 0.9)",
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default function Home() {
  const theme = useAppTheme();
  const {colors} = useThemeVariant();
  const styles = makeStyles(colors, theme);
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  const {
    selectedMainCategory,
    setSelectedMainCategory,
    selectedServiceCategory,
    setSelectedServiceCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    subcategoriesByMainCategory,
  } = useCategory();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [liking, setLiking] = useState<Set<number>>(new Set());
  const [openCommentFor, setOpenCommentFor] = useState<number | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [commenting, setCommenting] = useState<Set<number>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<number, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const [postOptionsPostId, setPostOptionsPostId] = useState<number | null>(null);
  const [postOptionsPosition, setPostOptionsPosition] = useState<{x: number; y: number; w: number; h: number} | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const postOptionButtonRefs = useRef<Record<number, View | null>>({});
  const router = useRouter();

  const availablePostFormats = postFormats.filter((format) => {
    if (!user) return false;
    if (format.id === "video" || format.id === "pet_adoption") return false;
    return format.roles.includes(user.role);
  });


  const getCommentCount = (post: any) =>
    Number.isFinite(post?.comments_count)
      ? post.comments_count
      : Number.isFinite(post?.commentsCount)
        ? post.commentsCount
        : Number.isFinite(post?.stats?.comments)
          ? post.stats.comments
          : 0;

  const likeDbPost = async (postId: number) => {
    const token = await tokenUtils.getToken();
    if (!token) {
      Alert.alert("Inicia sesión", "Necesitas iniciar sesión para dar me gusta.");
      router.push("/login");
      return;
    }
    if (liking.has(postId)) return;
    setLiking(new Set(liking).add(postId));
    try {
      const response = await postApi.likePost(postId);
      const isLiked = response.data?.liked ?? true; // Default to true if not specified
      
      // Update local likedPosts state
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      // Update the post in the posts array
      setPosts((prevPosts) =>
        prevPosts.map((post: any) => {
          if (post.id === postId) {
            return {
              ...post,
              user_has_liked: isLiked,
              likes_count: isLiked
                ? (post.likes_count || 0) + 1
                : Math.max(0, (post.likes_count || 0) - 1),
            };
          }
          return post;
        })
      );
    } catch {
      Alert.alert("Error", "No se pudo actualizar tu me gusta");
    } finally {
      const s = new Set(liking);
      s.delete(postId);
      setLiking(s);
    }
  };

  const handleSavePostEdit = async () => {
    if (editPostId == null) return;
    if (savingPost) return;
    setSavingPost(true);
    try {
      await postApi.updatePost(editPostId, {content: editPostContent});
      setPosts((prev) =>
        prev.map((p) => (p.id === editPostId ? {...p, content: editPostContent} : p))
      );
      setEditPostId(null);
      setEditPostContent("");
    } catch {
      Alert.alert("Error", "No se pudo editar el post");
    } finally {
      setSavingPost(false);
    }
  };

  const submitComment = async (postId: number) => {
    const token = await tokenUtils.getToken();
    if (!token) {
      Alert.alert("Inicia sesión", "Necesitas iniciar sesión para comentar.");
      router.push("/login");
      return;
    }
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    if (commenting.has(postId)) return;
    setCommenting(new Set(commenting).add(postId));
    try {
      await postApi.createComment(postId, text);
      setCommentDrafts((d) => ({...d, [postId]: ""}));
      await loadComments(postId); // refresh comments for this post
      fetchPosts();
    } catch {
      Alert.alert("Error", "No se pudo publicar tu comentario");
    } finally {
      const s = new Set(commenting);
      s.delete(postId);
      setCommenting(s);
    }
  };

  const loadComments = async (postId: number) => {
    if (loadingComments.has(postId)) return;
    setLoadingComments(new Set(loadingComments).add(postId));
    try {
      const res = await postApi.getComments(postId, {page: 1});
      setCommentsByPost((m) => ({...m, [postId]: res.data.results || res.data || []}));
    } catch (e) {
      // silent fail
    } finally {
      const s = new Set(loadingComments);
      s.delete(postId);
      setLoadingComments(s);
    }
  };

  // Mock categories and stories (keep UI)

  const categories = [
    {id: "belleza", name: "Belleza"},
    {id: "bienestar", name: "Bienestar"},
    {id: "mascotas", name: "Mascotas"},
  ] as const;

  const effectiveFeedCategory = selectedServiceCategory || selectedMainCategory;

  // Keep UI selection in sync when service category is changed from other entry points.
  useEffect(() => {
    if (
      selectedServiceCategory &&
      selectedServiceCategory !== selectedMainCategory
    ) {
      setSelectedMainCategory(selectedServiceCategory);
      setSelectedSubCategory("todos");
    }
  }, [
    selectedServiceCategory,
    selectedMainCategory,
    setSelectedMainCategory,
    setSelectedSubCategory,
  ]);

  const getCategoryIcon = (id: string, color: string, size: number = 24) => {
    const iconColor = color ?? "#6b7280";
    switch (id) {
      case "belleza":
        return <MaterialCommunityIcons name="spa-outline" size={size} color={iconColor} />;
      case "bienestar":
        return <MaterialCommunityIcons name="meditation" size={size} color={iconColor} />;
      case "mascotas":
        return <MaterialCommunityIcons name="paw" size={size} color={iconColor} />;
      case "todos":
        return <Ionicons name="apps" size={size} color={iconColor} />;
      default:
        return <Ionicons name="apps" size={size} color={iconColor} />;
    }
  };

  // Get current subcategories based on selected main category
  const currentSubcategories = subcategoriesByMainCategory[selectedMainCategory];
  
  // Filter posts by active category and subcategory
  const filteredPosts = posts.filter((post: any) => {
    // First, filter by main category
    // Handle both list and string formats (for backward compatibility)
    const authorCategory = post.author_category;
    let categoryMatches = false;
    
    // Handle null/undefined cases
    if (authorCategory == null) {
      return false;
    }
    
    if (Array.isArray(authorCategory)) {
      // If category is a list, check if effective category is in the list
      // Also handle case-insensitive comparison
      categoryMatches = authorCategory.some((cat: string) => 
        cat && cat.toLowerCase() === effectiveFeedCategory.toLowerCase()
      );
    } else if (typeof authorCategory === 'string') {
      // If category is a string, do direct comparison (case-insensitive)
      categoryMatches = authorCategory.toLowerCase() === effectiveFeedCategory.toLowerCase();
    }
    
    if (!categoryMatches) {
      return false;
    }

    // If "todos" subcategory is selected, show all posts in the main category
    if (selectedSubCategory === 'todos') {
      return true;
    }
    
    // Otherwise, filter by subcategory - check if author has the selected subcategory
    const authorSubCategories = post.author_sub_categories || [];
    return authorSubCategories.includes(selectedSubCategory);
  });
  
  // Get video posts (stories) filtered by active category and subcategory
  const videoPosts = posts.filter((post: any) => {
    // First, filter by post type
    if (post.post_type !== 'video') {
      return false;
    }
    
    // Filter by main category - handle both list and string formats
    const authorCategory = post.author_category;
    let categoryMatches = false;
    
    // Handle null/undefined cases
    if (authorCategory == null) {
      return false;
    }
    
    if (Array.isArray(authorCategory)) {
      // If category is a list, check if effective category is in the list
      // Also handle case-insensitive comparison
      categoryMatches = authorCategory.some((cat: string) => 
        cat && cat.toLowerCase() === effectiveFeedCategory.toLowerCase()
      );
    } else if (typeof authorCategory === 'string') {
      // If category is a string, do direct comparison (case-insensitive)
      categoryMatches = authorCategory.toLowerCase() === effectiveFeedCategory.toLowerCase();
    }
    
    if (!categoryMatches) {
      return false;
    }
    
    // If "todos" subcategory is selected, show all video posts in the main category
    if (selectedSubCategory === 'todos') {
      return true;
    }
    
    // Otherwise, filter by subcategory
    const authorSubCategories = post.author_sub_categories || [];
    return authorSubCategories.includes(selectedSubCategory);
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await postApi.getPosts({category: effectiveFeedCategory});
      const postsData = res.data.results || [];
      setPosts(postsData);
      
      // Initialize likedPosts from user_has_liked field
      const likedPostIds = new Set<number>();
      postsData.forEach((post: any) => {
        if (post.user_has_liked) {
          likedPostIds.add(post.id);
        }
      });
      setLikedPosts(likedPostIds);
    } catch {
      // silent fail — feed shows empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [effectiveFeedCategory]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await postApi.getPosts({category: effectiveFeedCategory});
      const postsData = res.data.results || [];
      setPosts(postsData);
      
      // Initialize likedPosts from user_has_liked field
      const likedPostIds = new Set<number>();
      postsData.forEach((post: any) => {
        if (post.user_has_liked) {
          likedPostIds.add(post.id);
        }
      });
      setLikedPosts(likedPostIds);
    } finally {
      setRefreshing(false);
    }
  };

  const POST_TYPE_LABELS: Record<string, string> = {
    snapshot: "Foto",
    carousel: "Carrusel",
    mosaic: "Mosaico",
    before_after: "Antes/Después",
    video: "Video",
  };

  const deletePost = async (postId: number) => {
    try {
      await postApi.deletePost(postId);
      setPosts(prev => prev.filter((p: any) => p.id !== postId));
    } catch {
      Alert.alert("Error", "No se pudo eliminar la publicación");
    }
  };

  const renderDbPost = (post: any) => {
    const firstMedia = (post.media || [])[0];
    const imageUrl = firstMedia?.media_url || firstMedia?.media_file;
    const authorName =
      post.author_display_name ||
      post.author?.public_profile?.display_name ||
      post.author?.first_name ||
      post.author?.username ||
      "";
    const allMedia = post.media || [];
    const mediaUrls = allMedia.map((m: any) => m.media_url || m.media_file).filter(Boolean);
    const isMosaic = post.post_type === 'mosaic';
    const isBeforeAfter = post.post_type === 'before_after';
    const isCarousel = post.post_type === 'carousel';
    
    // For before/after posts, get the two images (order 0 = before, order 1 = after)
    const beforeImage = allMedia.find((m: any) => m.order === 0 || m.caption === 'before');
    const afterImage = allMedia.find((m: any) => m.order === 1 || m.caption === 'after');
    const beforeUrl = beforeImage?.media_url || beforeImage?.media_file;
    const afterUrl = afterImage?.media_url || afterImage?.media_file;
    
    // For carousel posts, get all images ordered by order field
    const carouselImages = isCarousel 
      ? allMedia
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((m: any) => m.media_url || m.media_file)
          .filter(Boolean)
      : [];
    
    const borderColor = getAvatarColorFromSubcategory(
      post.author_category,
      post.author_sub_categories
    );
    const authorProfileId = post.author_profile_id;
    const authorProfileType = post.author_profile_type;
    const isOwnPost = user?.id != null && post.author?.id === user.id;

    const handleReservePress = () => {
      if (!authorProfileId) {
        Alert.alert(
          "Reservas",
          "Información del proveedor no está disponible por el momento."
        );
        return;
      }

      const destination =
        authorProfileType === "PLACE"
          ? `/place/${authorProfileId}`
          : `/professional/${authorProfileId}`;

      try {
        router.push(destination as any);
      } catch {
        Alert.alert(
          "Reservas",
          "No pudimos abrir el perfil del proveedor. Intenta de nuevo más tarde."
        );
      }
    };
    
    return (
      <View 
        key={post.id} 
        style={[
          styles.postCard, 
          {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}
        ]}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.postUserInfoContainer}
            onPress={() => {
              const profileId = post.author_public_profile_id || post.author_profile_id;
              if (profileId) {
                router.push(`/profile/${profileId}` as any);
              }
            }}
            activeOpacity={0.7}>
            <View style={[
              styles.postAvatarRing,
              { borderColor: borderColor },
            ]}>
              <View style={[
                styles.postAvatar,
                { backgroundColor: post.author_photo ? "transparent" : colors.muted },
              ]}>
                {post.author_photo ? (
                  <Image source={{uri: post.author_photo}} style={styles.postAvatarImage} />
                ) : (
                  <Text style={styles.postAvatarText}>
                    {authorName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.postUserInfo}>
              <View style={{flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap"}}>
                <Text style={[styles.postUserNameText, {color: colors.foreground}]} numberOfLines={1}>
                  {authorName}
                </Text>
                {POST_TYPE_LABELS[post.post_type] && (
                  <View style={{backgroundColor: colors.primary + "14", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6}}>
                    <Text style={{color: colors.primary, fontSize: 10, fontWeight: "700", letterSpacing: 0.4}}>
                      {POST_TYPE_LABELS[post.post_type]}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.postTime, {color: colors.mutedForeground}]}>{formatCommentTime(post.created_at)}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.postHeaderRight}>
            {/* Solo el dueño del post ve los 3 puntos verticales */}
            {user && post.author?.id === user.id && (
              <View
                ref={(el) => {
                  if (el) postOptionButtonRefs.current[post.id] = el;
                }}
                collapsable={false}>
                <TouchableOpacity
                  style={styles.postMoreButton}
                  onPress={() => {
                    const ref = postOptionButtonRefs.current[post.id];
                    if (ref?.measureInWindow) {
                      ref.measureInWindow((x, y, w, h) => {
                        setPostOptionsPosition({x, y, w, h});
                        setPostOptionsPostId(post.id);
                      });
                    } else {
                      setPostOptionsPostId(post.id);
                      setPostOptionsPosition(null);
                    }
                  }}
                  hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                  <Ionicons name="ellipsis-vertical" color={colors.mutedForeground} size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Carousel */}
        {isCarousel && carouselImages.length > 0 && (
          <CarouselView
            images={carouselImages}
            colors={colors}
            screenWidth={SCREEN_WIDTH - 32}
          />
        )}
        
        {/* Before/After Transformation - estilo split con divisor central y diamante */}
        {!isCarousel && isBeforeAfter && beforeUrl && afterUrl && (
          <View style={styles.transformationContainer}>
            <View style={styles.transformationHalf}>
              <Image source={{uri: beforeUrl}} style={styles.transformationImg} resizeMode="cover" />
              <View style={[styles.transformationLabel, styles.transformationLabelLeft]}>
                <Text style={styles.transformationLabelText}>ANTES</Text>
              </View>
            </View>
            <View style={styles.transformationHalf}>
              <Image source={{uri: afterUrl}} style={styles.transformationImg} resizeMode="cover" />
              <View style={[styles.transformationLabel, styles.transformationLabelRight]}>
                <Text style={styles.transformationLabelText}>DESPUÉS</Text>
              </View>
            </View>
            <View style={styles.transformationDividerLine} />
            <View style={styles.transformationDividerDiamond} />
          </View>
        )}
        
        {/* Mosaic Grid */}
        {!isCarousel && !isBeforeAfter && isMosaic && mediaUrls.length > 0 && (
          <View style={[styles.gridContainer, {backgroundColor: colors.muted}]}>
            {[0, 1].map(row => (
              <View key={row} style={styles.gridRow}>
                {[0, 1].map(col => {
                  const index = row * 2 + col;
                  const url = mediaUrls[index];
                  if (!url) return <View key={col} style={{width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}} />;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[styles.gridItem, {width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}]}
                      activeOpacity={0.9}>
                      <Image source={{uri: url}} style={styles.gridImage} />
                      {index === 3 && mediaUrls.length > 4 && (
                        <View style={styles.gridOverlay}>
                          <Text style={styles.gridOverlayText}>+{mediaUrls.length - 4}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}
        
        {/* Single Image or Pet Adoption */}
        {!isCarousel && !isBeforeAfter && !isMosaic && imageUrl && (
          <Image source={{uri: imageUrl}} style={styles.snapshotImage} />
        )}
        
        {post.content ? (
          <Text style={[styles.postDescription, {color: colors.foreground}]}>{post.content}</Text>
        ) : null}
        <View style={[styles.postActions, {borderTopColor: colors.border}]}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => likeDbPost(post.id)}
            disabled={liking.has(post.id)}>
            <Ionicons
              name={post.user_has_liked || likedPosts.has(post.id) ? "heart" : "heart-outline"}
              color={post.user_has_liked || likedPosts.has(post.id) ? colors.primary : colors.mutedForeground}
              size={22}
            />
            <Text style={[styles.postActionText, {color: colors.foreground}]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => {
              const open = openCommentFor === post.id ? null : post.id;
              setOpenCommentFor(open);
              if (open) {
                loadComments(post.id);
              }
            }}>
            <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={22} />
            <Text style={[styles.postActionText, {color: colors.foreground}]}>
              {getCommentCount(post)}
            </Text>
          </TouchableOpacity>
          {/* Reservar Button - show when post has booking link or when not own post */}
          {(!isOwnPost || post.linked_group_session_id != null || (post.linked_service_id != null && post.linked_provider_id != null)) && (
            <TouchableOpacity
              style={[styles.reserveButton, {backgroundColor: colors.primary}]}
              activeOpacity={0.8}
              onPress={() => {
                const profileId = post.author_public_profile_id || post.author_profile_id;
                if (!user) {
                  Alert.alert(
                    "Inicia sesión",
                    "Necesitas iniciar sesión para reservar.",
                    [{text: "OK", onPress: () => router.push("/login")}]
                  );
                  return;
                }
                if (post.linked_group_session_id != null) {
                  router.push(`/group-sessions/${post.linked_group_session_id}` as any);
                } else if (post.linked_service_id != null && post.linked_provider_id != null && post.linked_service_name) {
                  const normalizedCategory =
                    typeof post?.author_category === "string"
                      ? post.author_category.toLowerCase()
                      : Array.isArray(post?.author_category) && post.author_category[0]
                        ? String(post.author_category[0]).toLowerCase()
                        : effectiveFeedCategory;
                  router.push({
                    pathname: "/booking",
                    params: {
                      serviceInstanceId: String(post.linked_service_id),
                      serviceTypeId: String(post.linked_service_id),
                      serviceName: post.linked_service_name,
                      serviceType: post.linked_service_type || "professional_service",
                      providerId: String(post.linked_provider_id),
                      providerName: post.author_display_name || "",
                      price: post.linked_service_price != null ? String(post.linked_service_price) : "",
                      duration: post.linked_service_duration_minutes != null ? String(post.linked_service_duration_minutes) : "60",
                      category: normalizedCategory,
                    },
                  } as any);
                } else if (profileId) {
                  router.push(`/profile/${profileId}` as any);
                }
              }}>
              <Text style={styles.reserveButtonText}>Reservar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.bg}]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 12, 16),
            paddingBottom: 12,
          },
        ]}>
        <View style={styles.indexHeaderRow}>
          {/* Left — logo */}
          <View style={styles.headerLeft}>
            <AppLogo style={styles.headerLogo} resizeMode="contain" />
          </View>

          {/* Center — anchored category dropdown */}
          <View style={styles.headerCenter}>
            <HeaderCategoryDropdown
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                icon:
                  c.id === "belleza"
                    ? "spa-outline"
                    : c.id === "bienestar"
                    ? "meditation"
                    : c.id === "mascotas"
                    ? "paw"
                    : "apps",
                iconFamily: "material-community" as const,
              }))}
              selectedCategory={selectedMainCategory}
              onSelectCategory={(id) => {
                setSelectedMainCategory(id as any);
                setSelectedServiceCategory(id as any);
              }}
            />
          </View>

          {/* Right — create post */}
          <View style={styles.headerRight}>
            {user && user.role !== "CLIENT" && (
              <TourTarget targetId="create_post">
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => {
                    if (!user) {
                      router.push("/login");
                    } else {
                      setShowCreatePostModal(true);
                    }
                  }}>
                  <Ionicons name="add-circle-outline" color={colors.foreground} size={26} />
                </TouchableOpacity>
              </TourTarget>
            )}
          </View>
        </View>
      </View>

      {/* Sub Category Bar (mock) */}
      <View style={[styles.subCategoryContainer, {backgroundColor: colors.card}]}>
        <SubCategoryBar
          categories={currentSubcategories}
          selectedCategoryId={selectedSubCategory}
          onCategorySelect={setSelectedSubCategory}
          showLabels={true}
        />
      </View>

      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.feedContent}>
        {/* Stories (Video Posts) */}
        {videoPosts.length > 0 ? (
          <View style={styles.storiesSection}>
            <Text style={[styles.storiesTitle, {color: colors.foreground}]}>Historias</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContainer}>
              {videoPosts.map((post: any) => {
                const firstMedia = (post.media || [])[0];
                const videoUrl = firstMedia?.media_url || firstMedia?.media_file;
                const authorName = post.author?.first_name || post.author?.username || "Usuario";
                // Get subcategory badge emoji from category
                const firstSubCategory = post.author_sub_categories?.[0];
                const badgeEmoji = firstSubCategory ? "📹" : "✨";
                
                return (
                  <TouchableOpacity 
                    key={post.id} 
                    style={styles.storyCard} 
                    activeOpacity={0.9}
                    onPress={() => {
                      // Navigate to video post or play video
                      // You can add navigation logic here if needed
                    }}>
                    {videoUrl ? (
                      <View style={[styles.storyPreview, {backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center', position: 'relative'}]}>
                        {/* Video play button overlay */}
                        <Ionicons name="play-circle" size={48} color={theme.white} style={{opacity: 0.9}} />
                      </View>
                    ) : (
                      <View style={[styles.storyPreview, {backgroundColor: colors.muted}]} />
                    )}
                    <View style={styles.storyOverlay}>
                      <View style={styles.storyBadge}>
                        <Text style={styles.storyBadgeText}>{badgeEmoji}</Text>
                      </View>
                      <View style={styles.storyUser}>
                        <View style={[styles.storyAvatar, {backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center'}]}>
                          <Text style={{color: theme.white, fontSize: 14, fontWeight: '700'}}>
                            {authorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.storyUserName} numberOfLines={1}>
                          {authorName}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
        {loading ? (
          <View style={{padding: 24, alignItems: "center"}}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.postsSection}>
            {filteredPosts.filter((p: any) => p.post_type !== 'video').length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={64} color={colors.mutedForeground} />
                <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
                  No hay publicaciones
                </Text>
                <Text style={[styles.emptyStateText, {color: colors.mutedForeground}]}>
                  {selectedMainCategory === 'belleza' && 'No hay publicaciones en la categoría Belleza todavía.'}
                  {selectedMainCategory === 'bienestar' && 'No hay publicaciones en la categoría Bienestar todavía.'}
                  {selectedMainCategory === 'mascotas' && 'No hay publicaciones en la categoría Mascotas todavía.'}
                </Text>
              </View>
            ) : (
              filteredPosts
                .filter((p: any) => p.post_type !== 'video') // Exclude video posts from main feed
                .map((p) => renderDbPost(p))
            )}
          </View>
        )}
      </ScrollView>

      {/* Popup pequeño de opciones del post (justo debajo de los 3 puntos) */}
      <Modal
        visible={postOptionsPostId != null}
        transparent
        animationType="fade"
        onRequestClose={() => { setPostOptionsPostId(null); setPostOptionsPosition(null); }}>
        <Pressable
          style={styles.postOptionsOverlay}
          onPress={() => { setPostOptionsPostId(null); setPostOptionsPosition(null); }}>
          <Pressable
            style={[
              styles.postOptionsPopup,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: postOptionsPosition ? postOptionsPosition.y + postOptionsPosition.h : Math.max(insets.top + 70, 90),
                right: postOptionsPosition ? SCREEN_WIDTH - postOptionsPosition.x - postOptionsPosition.w : 16,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity
              style={[styles.postOptionsButton, {borderBottomColor: colors.border}]}
              onPress={() => {
                const p = posts.find((x) => x.id === postOptionsPostId);
                if (p) {
                  setEditPostId(p.id);
                  setEditPostContent(p.content || "");
                }
                setPostOptionsPostId(null);
                setPostOptionsPosition(null);
              }}>
              <Ionicons name="create-outline" color={colors.foreground} size={18} />
              <Text style={[styles.postOptionsButtonText, {color: colors.foreground}]}>Editar texto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postOptionsButton, {borderBottomWidth: 0}]}
              onPress={() => {
                const postId = postOptionsPostId;
                setPostOptionsPostId(null);
                setPostOptionsPosition(null);
                if (postId == null) return;
                Alert.alert(
                  "¿Eliminar publicación?",
                  "Esta acción no se puede deshacer.",
                  [
                    {text: "Cancelar", style: "cancel"},
                    {text: "Eliminar", style: "destructive", onPress: () => deletePost(postId)},
                  ]
                );
              }}>
              <Ionicons name="trash-outline" color="#ef4444" size={18} />
              <Text style={[styles.postOptionsButtonText, {color: "#ef4444"}]}>Eliminar publicación</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de comentarios (sheet desde abajo) */}
      <Modal
        visible={openCommentFor != null}
        transparent
        animationType="slide"
        onRequestClose={() => setOpenCommentFor(null)}>
        <Pressable style={styles.commentsModalOverlay} onPress={() => setOpenCommentFor(null)}>
          <Pressable style={[styles.commentsSheet, {backgroundColor: colors.card}]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.commentsHandleBar, {backgroundColor: colors.border}]} />
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, {color: colors.foreground}]}>Comentarios</Text>
              <Text style={[styles.commentsCount, {color: colors.mutedForeground}]}>
                {openCommentFor != null
                  ? (() => {
                      const p = posts.find((x: any) => x.id === openCommentFor);
                      return getCommentCount(p || {}) || (commentsByPost[openCommentFor]?.length ?? 0);
                    })()
                  : 0}
              </Text>
              <TouchableOpacity
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                onPress={() => setOpenCommentFor(null)}
                style={styles.commentsCloseBtn}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
              style={styles.commentsBody}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={0}>
              <FlatList
                data={openCommentFor != null ? commentsByPost[openCommentFor] ?? [] : []}
                keyExtractor={(item) => String(item.id)}
                style={styles.commentsList}
                contentContainerStyle={styles.commentsListContent}
                ListEmptyComponent={
                  loadingComments.has(openCommentFor!) ? (
                    <View style={styles.commentsLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : (
                    <Text style={[styles.commentsEmpty, {color: colors.mutedForeground}]}>
                      Sin comentarios aún. ¡Sé el primero!
                    </Text>
                  )
                }
                renderItem={({item: c}: {item: any}) => (
                  <View style={styles.commentRow}>
                    <View style={styles.commentAvatarWrap}>
                      {c.author?.profile_image || c.author?.user_image ? (
                        <Image
                          source={{uri: c.author?.profile_image || c.author?.user_image}}
                          style={styles.commentAvatar}
                        />
                      ) : (
                        <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder, {backgroundColor: colors.muted}]}>
                          <Text style={[styles.commentAvatarLetter, {color: colors.foreground}]}>
                            {(c.author?.username || c.author?.first_name || "U").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.commentContent}>
                      <Text style={[styles.commentUsername, {color: colors.foreground}]}>
                        {c.author?.username || c.author?.first_name || "Usuario"}
                      </Text>
                      <Text style={[styles.commentText, {color: colors.foreground}]}>
                        {c.content || c.text || ""}
                      </Text>
                      <View style={styles.commentMeta}>
                        <Text style={[styles.commentTime, {color: colors.mutedForeground}]}>
                          {formatCommentTime(c.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
              <View style={[styles.commentsInputRow, {borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12)}]}>
                <View style={[styles.commentsInputAvatarRing, {borderColor: colors.primary}]}>
                  <View style={[styles.commentsInputAvatar, {backgroundColor: colors.muted}]}>
                    {user?.image || (user as any)?.profile_image ? (
                      <Image
                        source={{uri: (user?.image || (user as any)?.profile_image) as string}}
                        style={styles.commentsInputAvatarImg}
                      />
                    ) : (
                      <Text style={[styles.commentsInputAvatarLetter, {color: colors.foreground}]}>
                        {(user?.firstName || (user as any)?.first_name || "U").charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>
                <TextInput
                  placeholder="Añade un comentario..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.commentsInput, {color: colors.foreground, backgroundColor: colors.input}]}
                  value={openCommentFor != null ? commentDrafts[openCommentFor] ?? "" : ""}
                  onChangeText={(t) =>
                    openCommentFor != null &&
                    setCommentDrafts((d) => ({...d, [openCommentFor]: t}))
                  }
                  multiline
                  maxLength={2000}
                />
                <TouchableOpacity
                  onPress={() => openCommentFor != null && submitComment(openCommentFor)}
                  disabled={openCommentFor == null || commenting.has(openCommentFor)}
                  style={styles.commentsPublishBtn}>
                  <Text style={[styles.commentsPublishText, {color: colors.primary}]}>Publicar</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Crear Publicación (sheet desde abajo) */}
      <Modal
        visible={showCreatePostModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreatePostModal(false)}>
        <Pressable style={styles.commentsModalOverlay} onPress={() => setShowCreatePostModal(false)}>
          <Pressable
            style={[styles.commentsSheet, styles.createPostSheet, {backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 24)}]}
            onPress={(e) => e.stopPropagation()}>
            <View style={[styles.commentsHandleBar, {backgroundColor: colors.border}]} />
            <View style={styles.createPostHeader}>
              <Text style={[styles.createPostTitle, {color: colors.foreground}]}>Crear Publicación</Text>
              <TouchableOpacity
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                onPress={() => setShowCreatePostModal(false)}
                style={styles.createPostCloseBtn}>
                <View style={[styles.createPostCloseCircle, {backgroundColor: colors.input}]}>
                  <Ionicons name="close" size={20} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.createPostScroll}
              contentContainerStyle={styles.createPostScrollContent}
              showsVerticalScrollIndicator={false}>
              {availablePostFormats.map((format) => (
                <Pressable
                  key={format.id}
                  style={({pressed}) => [
                    styles.createPostOptionRow,
                    {backgroundColor: colors.muted},
                    pressed && {opacity: 0.85},
                  ]}
                  onPress={() => {
                    setShowCreatePostModal(false);
                    router.push(`/posts/create-${format.id}` as any);
                  }}>
                  <View
                    style={[
                      styles.createPostOptionIconWrap,
                      {backgroundColor: format.color + "25", borderColor: format.color + "60"},
                    ]}>
                    <Ionicons name={format.icon as any} size={24} color={format.color} />
                  </View>
                  <View style={styles.createPostOptionTextWrap}>
                    <Text style={[styles.createPostOptionTitle, {color: colors.foreground}]}>
                      {format.title}
                    </Text>
                    <Text style={[styles.createPostOptionSubtitle, {color: colors.mutedForeground}]}>
                      {format.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal para editar texto del post */}
      <Modal
        visible={editPostId != null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditPostId(null)}>
        <Pressable
          style={styles.editModalOverlay}
          onPress={() => setEditPostId(null)}>
          <Pressable style={[styles.editModalContent, {backgroundColor: colors.card}]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.editModalTitle, {color: colors.foreground}]}>Editar texto</Text>
            <TextInput
              style={[styles.editModalInput, {color: colors.foreground, borderColor: colors.border}]}
              placeholder="Escribe el texto del post..."
              placeholderTextColor={colors.mutedForeground}
              value={editPostContent}
              onChangeText={setEditPostContent}
              multiline
              maxLength={2000}
              editable={!savingPost}
            />
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.editModalCancel, {borderColor: colors.border}]}
                onPress={() => setEditPostId(null)}
                disabled={savingPost}>
                <Text style={{color: colors.foreground}}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalSave, {backgroundColor: colors.primary}]}
                onPress={handleSavePostEdit}
                disabled={savingPost}>
                {savingPost ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editModalSaveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors: any, theme: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    top: 0,
  },
  header: {
    position: "relative",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  indexHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: APP_HEADER_BUTTON_HIT,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerCenter: {
    flex: 1,
    maxWidth: "72%",
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogo: {
    height: 36,
    width: 36,
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerButton: {
    position: "relative",
  },

  subCategoryContainer: {
    marginBottom: 12,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 100,
  },

  // Stories - Timeline horizontal novedoso
  storiesSection: {
    paddingVertical: 12,
  },
  storiesTitle: {
    fontSize: 20,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  storiesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  storyCard: {
    width: 140,
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
  },
  storyPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
    justifyContent: "space-between",
  },
  storyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storyBadgeText: {
    fontSize: 16,
  },
  storyUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  storyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.white,
  },
  storyUserName: {
    flex: 1,
    color: theme.white,
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },

  // Posts Section
  postsSection: {
    gap: 16,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  postCard: {
    borderRadius: 24,
    padding: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postUserInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postAvatarRing: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    borderWidth: 2.5,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  postAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 21,
    resizeMode: "cover",
  },
  postAvatarText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "700",
  },
  postUserInfo: {
    flex: 1,
  },
  postHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  postUserName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  postUserNameText: {
    fontSize: 15,
    fontWeight: "700",
  },
  postTime: {
    fontSize: 12,
  },
  postMoreButton: {
    padding: 4,
    minWidth: 28,
    alignItems: "center",
  },
  // ratingBadge/ratingText removed (reseñas no implementadas todavía)
  postTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },

  // Transformation (antes/después) - split vertical, etiquetas en esquinas, divisor con diamante
  transformationContainer: {
    flexDirection: "row",
    position: "relative",
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 16,
  },
  transformationHalf: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  transformationImage: {
    flex: 1,
    position: "relative",
  },
  transformationImg: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  transformationLabel: {
    position: "absolute",
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  transformationLabelLeft: {
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  transformationLabelRight: {
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  transformationLabelText: {
    color: theme.white,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  transformationDividerLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: "#e5e7eb",
  },
  transformationDividerDiamond: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    backgroundColor: "#d1d5db",
    transform: [{ rotate: "45deg" }],
  },
  transformationDivider: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },

  // Carousel
  carouselContainer: {
    position: "relative",
    marginBottom: 12,
  },
  carouselScrollView: {
    height: 400,
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselSlide: {
    width: SCREEN_WIDTH - 32,
    height: 400,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  carouselCounterBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  carouselCounterText: {
    color: theme.white,
    fontSize: 13,
    fontWeight: "600",
  },
  carouselDotsOverlay: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  snapshotImage: {
    width: "100%",
    height: 340,
    borderRadius: 16,
    resizeMode: "cover",
    marginBottom: 12,
  },
  snapshotCaption: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  // Grid (Mosaic) - contenedor redondeado, 2x2. backgroundColor y tamaños se aplican inline según tema
  gridContainer: {
    gap: 8,
    marginBottom: 12,
    padding: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
  },
  gridItem: {
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  gridOverlayText: {
    color: theme.white,
    fontSize: 32,
    fontWeight: "900",
  },

  // Post Actions
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 20,
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  reserveButton: {
    marginLeft: "auto",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reserveButtonText: {
    color: theme.white,
    fontSize: 13,
    fontWeight: "700",
  },
  postActionCta: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  postActionCtaText: {
    color: theme.white,
    fontSize: 13,
    fontWeight: "700",
  },
  postActionBookmark: {
    marginLeft: "auto",
  },

  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  postOptionsOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  postOptionsPopup: {
    position: "absolute",
    right: 16,
    minWidth: 160,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  postOptionsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
  },
  postOptionsButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editModalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  editModalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  editModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  editModalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editModalSave: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  editModalSaveText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },

  // Comments modal (sheet)
  commentsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  commentsSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: 400,
  },
  commentsHandleBar: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    marginTop: 10,
    marginBottom: 8,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  commentsCount: {
    fontSize: 14,
  },
  commentsCloseBtn: {
    marginLeft: "auto",
    padding: 4,
  },
  createPostSheet: {
    minHeight: 320,
    maxHeight: "85%",
  },
  createPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  createPostTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  createPostCloseBtn: {
    padding: 4,
  },
  createPostCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  createPostScroll: {
    maxHeight: 380,
  },
  createPostScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  createPostOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  createPostOptionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  createPostOptionTextWrap: {
    flex: 1,
  },
  createPostOptionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  createPostOptionSubtitle: {
    fontSize: 14,
  },
  commentsBody: {
    flex: 1,
    minHeight: 300,
  },
  commentsList: {
    flex: 1,
    maxHeight: 360,
  },
  commentsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  commentsLoading: {
    paddingVertical: 32,
    alignItems: "center",
  },
  commentsEmpty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  commentAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarLetter: {
    fontSize: 16,
    fontWeight: "700",
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commentTime: {
    fontSize: 12,
  },
  commentsInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  commentsInputAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  commentsInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  commentsInputAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    resizeMode: "cover",
  },
  commentsInputAvatarLetter: {
    fontSize: 14,
    fontWeight: "700",
  },
  commentsInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  commentsPublishBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  commentsPublishText: {
    fontSize: 15,
    fontWeight: "700",
  },
  });
}
