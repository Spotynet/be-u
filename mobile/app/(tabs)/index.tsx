import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useCategory} from "@/contexts/CategoryContext";
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {postApi, tokenUtils} from "@/lib/api";
import {SubCategoryBar} from "@/components/ui/SubCategoryBar";
import {getAvatarColorFromSubcategory} from "@/constants/categories";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

// Carousel Component with indicators
const CarouselView = ({images, colors, screenWidth}: {images: string[]; colors: any; screenWidth: number}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
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
        onMomentumScrollEnd={handleScroll}>
        {images.map((imageUrl: string, index: number) => (
          <View key={index} style={styles.carouselSlide}>
            <Image source={{uri: imageUrl}} style={styles.carouselImage} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View style={styles.carouselIndicators}>
          {images.map((_, index: number) => (
            <View
              key={index}
              style={[
                styles.carouselDot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.mutedForeground + "50",
                  width: index === currentIndex ? 24 : 8,
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
  const colorScheme = useColorScheme();
  const {colors, setVariant} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {
    selectedMainCategory,
    setSelectedMainCategory,
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
  const router = useRouter();

  // Helper function to get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "belleza":
        return "#8B5CF6";
      case "bienestar":
        return "#C4B5FD";
      case "mascotas":
        return "#B026FF";
      default:
        return colors.primary;
    }
  };

  // Toggle like function
  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

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
    } catch (e: any) {
      console.error("like error", e?.message || e);
      Alert.alert("Error", "No se pudo actualizar tu me gusta");
    } finally {
      const s = new Set(liking);
      s.delete(postId);
      setLiking(s);
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
      setOpenCommentFor(null);
      await loadComments(postId); // refresh comments for this post
      fetchPosts();
    } catch (e: any) {
      console.error("comment error", e?.message || e);
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
  ];

  const getCategoryIcon = (id: string, color: string, size: number = 24) => {
    switch (id) {
      case "belleza":
        return <MaterialCommunityIcons name="spa-outline" size={size} color={color} />;
      case "bienestar":
        return <MaterialCommunityIcons name="meditation" size={size} color={color} />;
      case "mascotas":
        return <MaterialCommunityIcons name="paw" size={size} color={color} />;
      case "todos":
        return <Ionicons name="apps" size={size} color={color} />;
      default:
        return <Ionicons name="apps" size={size} color={color} />;
    }
  };

  // Get current subcategories based on selected main category
  const currentSubcategories = subcategoriesByMainCategory[selectedMainCategory];
  
  // Filter posts by active category and subcategory
  const filteredPosts = posts.filter((post: any) => {
    // First, filter by main category
    if (post.author_category !== selectedMainCategory) {
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
    // First, filter by main category and post type
    if (post.post_type !== 'video' || post.author_category !== selectedMainCategory) {
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
      const res = await postApi.getPosts();
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
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await postApi.getPosts();
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

  // Feed posts - Mix dinámico de formatos
  const feedPosts = [
    {
      id: 1,
      type: "reel",
      user: {
        name: "Ana López",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
        verified: true,
      },
      thumbnail:
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=700&fit=crop",
      title: "Tutorial: Corte Bob Moderno ✂️",
      duration: "0:45",
      stats: {likes: 1234, comments: 234, shares: 89, views: "45.2K"},
      timeAgo: "3h",
      category: "belleza",
      isPinned: false,
    },
    {
      id: 2,
      type: "snapshot",
      user: {
        name: "Be-U Spa",
        avatar: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
        verified: true,
      },
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=500&fit=crop",
      caption: "Momento de relajación 🌸✨ #SelfCare",
      stats: {likes: 892, comments: 56},
      timeAgo: "5h",
      category: "belleza",
    },
    {
      id: 3,
      type: "transformation",
      user: {
        name: "Be-U Hair Studio",
        avatar: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop",
        verified: true,
      },
      title: "Transformación Completa ✨",
      description: "De cabello dañado a un look increíble 💖",
      beforeImage:
        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=400&fit=crop",
      afterImage:
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
      stats: {likes: 234, comments: 45, shares: 12},
      timeAgo: "2h",
      category: "belleza",
    },
    {
      id: 4,
      type: "tip",
      user: {
        name: "Be-U Community",
        avatar: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
        verified: true,
      },
      title: "Tip del Día 💡",
      tip: "Aplica protector solar todos los días, incluso en interiores. La luz azul de pantallas también afecta tu piel.",
      icon: "sunny",
      color: "#FFB347",
      stats: {likes: 456, saves: 234},
      timeAgo: "1h",
      category: "belleza",
    },
    {
      id: 5,
      type: "reel",
      user: {
        name: "Flow Yoga",
        avatar: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop",
        verified: true,
      },
      thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=700&fit=crop",
      title: "Rutina de 5 min para despertar 🧘‍♀️",
      duration: "5:12",
      stats: {likes: 2341, comments: 167, shares: 234, views: "78.5K"},
      timeAgo: "12h",
      category: "bienestar",
      isPinned: false,
    },
    {
      id: 6,
      type: "review",
      user: {
        name: "Sofía Martínez",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
        verified: false,
      },
      rating: 5,
      title: "¡La mejor experiencia! 💝",
      text: "El facial LED cambió completamente mi piel. El equipo es súper profesional y el ambiente es relajante. 100% recomendado 🌟",
      salon: "Be-U Spa Premium",
      images: ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop"],
      stats: {likes: 124, comments: 28},
      timeAgo: "1d",
      category: "belleza",
    },
    {
      id: 7,
      type: "grid",
      user: {
        name: "Pet Spa",
        avatar: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100&h=100&fit=crop",
        verified: true,
      },
      title: "Looks de la semana 🐾",
      images: [
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1630438994394-3deff7a591bf?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop",
      ],
      stats: {likes: 678, comments: 89},
      timeAgo: "8h",
      category: "mascotas",
    },
    {
      id: 8,
      type: "poll",
      user: {
        name: "Be-U Community",
        avatar: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
        verified: true,
      },
      question: "¿Cuál es tu tratamiento favorito?",
      options: [
        {id: 1, text: "Facial 💆‍♀️", votes: 45, percentage: 35},
        {id: 2, text: "Masaje 💆", votes: 52, percentage: 40},
        {id: 3, text: "Manicure 💅", votes: 32, percentage: 25},
      ],
      totalVotes: 129,
      stats: {votes: 129, comments: 15},
      timeAgo: "3h",
    },
    {
      id: 9,
      type: "video",
      user: {
        name: "Zen Studio",
        avatar: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop",
        verified: true,
      },
      title: "Meditación guiada para reducir estrés 🌙",
      thumbnail:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
      duration: "15:24",
      stats: {likes: 1456, comments: 234, views: "34.8K"},
      timeAgo: "2d",
      category: "bienestar",
    },
  ];

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
    
    // Get border color from author's first subcategory
    // Debug: Log the data to see what we're getting
    if (__DEV__) {
      console.log('Post border color debug:', {
        postId: post.id,
        author_category: post.author_category,
        author_sub_categories: post.author_sub_categories,
      });
    }
    const borderColor = getAvatarColorFromSubcategory(
      post.author_category,
      post.author_sub_categories
    );
    const authorRating =
      post.author_rating !== null && post.author_rating !== undefined
        ? Number(post.author_rating)
        : null;
    const authorProfileId = post.author_profile_id;
    const authorProfileType = post.author_profile_type;

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
      } catch (error) {
        console.warn("Error navigating to provider profile", error);
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
          {
            backgroundColor: colors.card,
            borderWidth: 2,
            borderColor: borderColor,
          }
        ]}>
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={[styles.postTime, {color: colors.mutedForeground}]}>#{post.post_type}</Text>
          </View>
          <View style={styles.postHeaderRight}>
            {authorRating !== null && !Number.isNaN(authorRating) ? (
              <View style={[styles.ratingBadge, {backgroundColor: `${colors.primary}15`}]}>
                <Ionicons name="star" color={colors.primary} size={14} />
                <Text style={[styles.ratingText, {color: colors.primary}]}>
                  {authorRating.toFixed(1)}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.postMoreButton}>
              <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
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
        
        {/* Before/After Transformation */}
        {!isCarousel && isBeforeAfter && beforeUrl && afterUrl && (
          <View style={styles.transformationContainer}>
            <View style={styles.transformationImage}>
              <Image source={{uri: beforeUrl}} style={styles.transformationImg} />
              <View style={[styles.transformationLabel, {backgroundColor: "rgba(0, 0, 0, 0.7)"}]}>
                <Text style={styles.transformationLabelText}>Antes</Text>
              </View>
            </View>
            <View style={[styles.transformationDivider, {backgroundColor: colors.primary}]}>
              <Ionicons name="arrow-forward" color="#ffffff" size={16} />
            </View>
            <View style={styles.transformationImage}>
              <Image source={{uri: afterUrl}} style={styles.transformationImg} />
              <View style={[styles.transformationLabel, {backgroundColor: colors.primary}]}>
                <Text style={styles.transformationLabelText}>Después</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Mosaic Grid */}
        {!isCarousel && !isBeforeAfter && isMosaic && mediaUrls.length > 0 && (
          <View style={styles.gridContainer}>
            {mediaUrls.slice(0, 4).map((url: string, index: number) => (
              <TouchableOpacity key={index} style={styles.gridItem} activeOpacity={0.9}>
                <Image source={{uri: url}} style={styles.gridImage} />
                {index === 3 && mediaUrls.length > 4 && (
                  <View style={styles.gridOverlay}>
                    <Text style={styles.gridOverlayText}>+{mediaUrls.length - 4}</Text>
                  </View>
                )}
              </TouchableOpacity>
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
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => likeDbPost(post.id)}
            disabled={liking.has(post.id)}>
            <Ionicons
              name={post.user_has_liked || likedPosts.has(post.id) ? "heart" : "heart-outline"}
              color={post.user_has_liked || likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
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
              {post.comments_count || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postActionCta, {backgroundColor: colors.primary}]}
            activeOpacity={0.9}
            onPress={handleReservePress}>
            <Ionicons name="calendar-outline" color="#ffffff" size={16} />
            <Text style={styles.postActionCtaText}>Reservar</Text>
          </TouchableOpacity>
        </View>
        {openCommentFor === post.id && (
          <View style={{flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8}}>
            <TextInput
              placeholder="Escribe un comentario"
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: colors.foreground,
              }}
              value={commentDrafts[post.id] || ""}
              onChangeText={(t) => setCommentDrafts((d) => ({...d, [post.id]: t}))}
            />
            <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: colors.primary,
              }}
              onPress={() => submitComment(post.id)}
              disabled={commenting.has(post.id)}>
              <Text style={{color: "#fff", fontWeight: "700"}}>Enviar</Text>
            </TouchableOpacity>
          </View>
        )}
        {Array.isArray(commentsByPost[post.id]) && commentsByPost[post.id].length > 0 && (
          <View style={{paddingTop: 8, gap: 6}}>
            {commentsByPost[post.id].slice(0, 3).map((c: any) => (
              <View key={c.id} style={{flexDirection: "row", gap: 8, alignItems: "flex-start"}}>
                <Ionicons name="chatbubble-ellipses" size={14} color={colors.mutedForeground} />
                <Text style={{flex: 1, color: colors.foreground}}>
                  <Text style={{fontWeight: "700"}}>
                    {c.author?.first_name || c.author?.username || "Usuario"}:
                  </Text>
                  {c.content || c.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTransformation = (post: any) => (
    <View key={post.id} style={[styles.postCard, {backgroundColor: colors.card}]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <View style={styles.postUserName}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]}>
              {post.user.name}
            </Text>
            {post.user.verified && (
              <Ionicons name="checkmark-circle" color={getCategoryColor(post.category)} size={16} />
            )}
          </View>
          <Text style={[styles.postTime, {color: colors.mutedForeground}]}>{post.timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.postMoreButton}>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={[styles.postTitle, {color: colors.foreground}]}>{post.title}</Text>
      <Text style={[styles.postDescription, {color: colors.mutedForeground}]}>
        {post.description}
      </Text>

      {/* Before/After Images */}
      <View style={styles.transformationContainer}>
        <View style={styles.transformationImage}>
          <Image source={{uri: post.beforeImage}} style={styles.transformationImg} />
          <View style={[styles.transformationLabel, {backgroundColor: "rgba(0, 0, 0, 0.7)"}]}>
            <Text style={styles.transformationLabelText}>Antes</Text>
          </View>
        </View>
        <View style={[styles.transformationDivider, {backgroundColor: colors.primary}]}>
          <Ionicons name="arrow-forward" color="#ffffff" size={16} />
        </View>
        <View style={styles.transformationImage}>
          <Image source={{uri: post.afterImage}} style={styles.transformationImg} />
          <View
            style={[
              styles.transformationLabel,
              {backgroundColor: getCategoryColor(post.category)},
            ]}>
            <Text style={styles.transformationLabelText}>Después</Text>
          </View>
        </View>
      </View>

      {/* Interactions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
            size={24}
          />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.shares}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBookmark} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVideo = (post: any) => (
    <View key={post.id} style={[styles.postCard, {backgroundColor: colors.card}]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <View style={styles.postUserName}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]}>
              {post.user.name}
            </Text>
            {post.user.verified && (
              <Ionicons name="checkmark-circle" color={getCategoryColor(post.category)} size={16} />
            )}
          </View>
          <Text style={[styles.postTime, {color: colors.mutedForeground}]}>{post.timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.postMoreButton}>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Video Thumbnail */}
      <View style={styles.videoContainer}>
        <Image source={{uri: post.thumbnail}} style={styles.videoThumbnail} />
        <View style={styles.videoOverlay}>
          <View style={[styles.playButton, {backgroundColor: colors.primary}]}>
            <Ionicons name="play" color="#ffffff" size={32} />
          </View>
          <View style={styles.videoDuration}>
            <Text style={styles.videoDurationText}>{post.duration}</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, {color: colors.foreground}]}>{post.title}</Text>
        <Text style={[styles.videoViews, {color: colors.mutedForeground}]}>
          {post.stats.views} vistas
        </Text>
      </View>

      {/* Interactions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
            size={24}
          />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBookmark} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReview = (post: any) => (
    <View key={post.id} style={[styles.postCard, {backgroundColor: colors.card}]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <View style={styles.postUserName}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]}>
              {post.user.name}
            </Text>
          </View>
          <View style={styles.reviewRating}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                color={i < post.rating ? "#FFD700" : colors.mutedForeground}
                size={14}
              />
            ))}
            <Text style={[styles.postTime, {color: colors.mutedForeground}]}>· {post.timeAgo}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.postMoreButton}>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Review Content */}
      <Text style={[styles.reviewTitle, {color: colors.foreground}]}>{post.title}</Text>
      <Text style={[styles.reviewText, {color: colors.foreground}]}>{post.text}</Text>

      {/* Salon Tag */}
      <View style={[styles.reviewSalon, {backgroundColor: colors.muted}]}>
        <Ionicons name="location" color={colors.primary} size={14} />
        <Text style={[styles.reviewSalonText, {color: colors.foreground}]}>{post.salon}</Text>
      </View>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <Image source={{uri: post.images[0]}} style={styles.reviewImage} />
      )}

      {/* Interactions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
            size={24}
          />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBookmark} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPoll = (post: any) => (
    <View key={post.id} style={[styles.postCard, {backgroundColor: colors.card}]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <View style={styles.postUserName}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]}>
              {post.user.name}
            </Text>
            {post.user.verified && (
              <Ionicons name="checkmark-circle" color={colors.primary} size={16} />
            )}
          </View>
          <Text style={[styles.postTime, {color: colors.mutedForeground}]}>{post.timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.postMoreButton}>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Poll */}
      <Text style={[styles.pollQuestion, {color: colors.foreground}]}>{post.question}</Text>
      <View style={styles.pollOptions}>
        {post.options.map((option: any) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.pollOption, {borderColor: colors.border}]}
            activeOpacity={0.7}>
            <View
              style={[styles.pollBar, {width: `${option.percentage}%`, backgroundColor: "#FFB6C1"}]}
            />
            <View style={styles.pollOptionContent}>
              <Text style={[styles.pollOptionText, {color: colors.foreground}]}>{option.text}</Text>
              <Text style={[styles.pollPercentage, {color: colors.foreground}]}>
                {option.percentage}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.pollVotes, {color: colors.mutedForeground}]}>
        {post.totalVotes} votos
      </Text>

      {/* Interactions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBookmark} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReel = (post: any) => (
    <View key={post.id} style={[styles.reelCard, {backgroundColor: colors.card}]}>
      {/* Reel Thumbnail */}
      <TouchableOpacity style={styles.reelThumbnail} activeOpacity={0.95}>
        <Image source={{uri: post.thumbnail}} style={styles.reelImage} />
        <View style={styles.reelOverlay}>
          {/* Play button */}
          <View style={styles.reelPlayButton}>
            <Ionicons name="play" color="#ffffff" size={40} />
          </View>
          {/* Duration badge */}
          <View style={styles.reelDuration}>
            <Ionicons name="videocam" color="#ffffff" size={12} />
            <Text style={styles.reelDurationText}>{post.duration}</Text>
          </View>
          {/* Views badge */}
          <View style={styles.reelViews}>
            <Ionicons name="eye" color="#ffffff" size={12} />
            <Text style={styles.reelViewsText}>{post.stats.views}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Reel Info */}
      <View style={styles.reelInfo}>
        <View style={styles.reelHeader}>
          <Image source={{uri: post.user.avatar}} style={styles.reelAvatar} />
          <View style={styles.reelUserInfo}>
            <View style={styles.reelUserName}>
              <Text style={[styles.reelUserNameText, {color: colors.foreground}]}>
                {post.user.name}
              </Text>
              {post.user.verified && (
                <Ionicons
                  name="checkmark-circle"
                  color={getCategoryColor(post.category)}
                  size={14}
                />
              )}
            </View>
            <Text style={[styles.reelTime, {color: colors.mutedForeground}]}>{post.timeAgo}</Text>
          </View>
        </View>
        <Text style={[styles.reelTitle, {color: colors.foreground}]} numberOfLines={2}>
          {post.title}
        </Text>

        {/* Quick Actions */}
        <View style={styles.reelActions}>
          <TouchableOpacity
            style={styles.reelAction}
            onPress={() => toggleLike(post.id)}
            activeOpacity={0.7}>
            <Ionicons
              name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
              color={likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
              size={20}
            />
            <Text style={[styles.reelActionText, {color: colors.foreground}]}>
              {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reelAction} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={20} />
            <Text style={[styles.reelActionText, {color: colors.foreground}]}>
              {post.stats.comments}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reelAction} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" color={colors.mutedForeground} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reelActionBookmark} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSnapshot = (post: any) => (
    <View key={post.id} style={[styles.snapshotCard, {backgroundColor: colors.card}]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <View style={styles.postUserName}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]}>
              {post.user.name}
            </Text>
            {post.user.verified && (
              <Ionicons name="checkmark-circle" color={getCategoryColor(post.category)} size={16} />
            )}
          </View>
          <Text style={[styles.postTime, {color: colors.mutedForeground}]}>{post.timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.postMoreButton}>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <TouchableOpacity activeOpacity={0.98}>
        <Image source={{uri: post.image}} style={styles.snapshotImage} />
      </TouchableOpacity>

      {/* Caption */}
      {post.caption && (
        <Text style={[styles.snapshotCaption, {color: colors.foreground}]}>{post.caption}</Text>
      )}

      {/* Interactions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
            size={24}
          />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBookmark} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTip = (post: any) => (
    <View
      key={post.id}
      style={[styles.tipCard, {backgroundColor: post.color || colors.primary, opacity: 0.95}]}>
      {/* User Header */}
      <View style={styles.tipHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.tipAvatar} />
        <View style={{flex: 1}}>
          <Text style={styles.tipUserName}>{post.user.name}</Text>
          <Text style={styles.tipTime}>{post.timeAgo}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Tip Content */}
      <View style={styles.tipContent}>
        <View style={styles.tipIconContainer}>
          <Ionicons name={post.icon as any} color="#ffffff" size={48} />
        </View>
        <Text style={styles.tipTitle}>{post.title}</Text>
        <Text style={styles.tipText}>{post.tip}</Text>
      </View>

      {/* Tip Actions */}
      <View style={styles.tipActions}>
        <TouchableOpacity
          style={styles.tipAction}
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
            color="#ffffff"
            size={22}
          />
          <Text style={styles.tipActionText}>
            {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tipAction} activeOpacity={0.7}>
          <Ionicons name="bookmark" color="#ffffff" size={22} />
          <Text style={styles.tipActionText}>{post.stats.saves}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tipAction} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" color="#ffffff" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGrid = (post: any) => (
    <View key={post.id} style={[styles.postCard, {backgroundColor: colors.card}]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <View style={styles.postUserName}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]}>
              {post.user.name}
            </Text>
            {post.user.verified && (
              <Ionicons name="checkmark-circle" color={getCategoryColor(post.category)} size={16} />
            )}
          </View>
          <Text style={[styles.postTime, {color: colors.mutedForeground}]}>{post.timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.postMoreButton}>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={[styles.postTitle, {color: colors.foreground}]}>{post.title}</Text>

      {/* Grid of Images */}
      <View style={styles.gridContainer}>
        {post.images.slice(0, 4).map((image: string, index: number) => (
          <TouchableOpacity key={index} style={styles.gridItem} activeOpacity={0.9}>
            <Image source={{uri: image}} style={styles.gridImage} />
            {index === 3 && post.images.length > 4 && (
              <View style={styles.gridOverlay}>
                <Text style={styles.gridOverlayText}>+{post.images.length - 4}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Interactions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
            size={24}
          />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBookmark} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCarousel = (post: any) => (
    <View key={post.id} style={[styles.postCard, {backgroundColor: colors.card}]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image source={{uri: post.user.avatar}} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <View style={styles.postUserName}>
            <Text style={[styles.postUserNameText, {color: colors.foreground}]}>
              {post.user.name}
            </Text>
            {post.user.verified && (
              <Ionicons name="checkmark-circle" color={getCategoryColor(post.category)} size={16} />
            )}
          </View>
          <Text style={[styles.postTime, {color: colors.mutedForeground}]}>{post.timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.postMoreButton}>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={[styles.postTitle, {color: colors.foreground}]}>{post.title}</Text>

      {/* Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}>
        {post.images.map((image: string, index: number) => (
          <Image key={index} source={{uri: image}} style={styles.carouselImage} />
        ))}
      </ScrollView>

      {/* Interactions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => toggleLike(post.id)}
          activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(post.id) ? "#FF69B4" : colors.mutedForeground}
            size={24}
          />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" color={colors.mutedForeground} size={24} />
          <Text style={[styles.postActionText, {color: colors.foreground}]}>
            {post.stats.shares}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBookmark} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPost = (post: any) => {
    switch (post.type) {
      case "reel":
        return renderReel(post);
      case "snapshot":
        return renderSnapshot(post);
      case "transformation":
        return renderTransformation(post);
      case "tip":
        return renderTip(post);
      case "video":
        return renderVideo(post);
      case "review":
        return renderReview(post);
      case "grid":
        return renderGrid(post);
      case "poll":
        return renderPoll(post);
      case "carousel":
        return renderCarousel(post);
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 44,
          },
        ]}>
        <Image
          source={require("@/assets/images/be-u.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.headerActions}>
          <View style={styles.categorySelector}>
            {/* Always Expanded - Horizontal Options */}
            <View style={[styles.expandedCategoryOptions, {backgroundColor: colors.card}]}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.expandedCategoryOption,
                    selectedMainCategory === category.id && styles.selectedCategoryOption,
                  ]}
                  onPress={() => {
                    setSelectedMainCategory(category.id as any);
                    setVariant(category.id as any);
                  }}>
                  {getCategoryIcon(
                    category.id,
                    selectedMainCategory === category.id ? colors.primary : colors.mutedForeground,
                    24
                  )}
                  {selectedMainCategory === category.id && (
                    <Text style={[styles.expandedCategoryText, {color: colors.primary}]}>
                      {category.name}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/create-post")}>
            <Ionicons name="add-circle-outline" color={colors.foreground} size={26} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub Category Bar (mock) */}
      <View style={styles.subCategoryContainer}>
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
                        <Ionicons name="play-circle" size={48} color="#ffffff" style={{opacity: 0.9}} />
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
                          <Text style={{color: '#ffffff', fontSize: 14, fontWeight: '700'}}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
    height: 50,
    width: 50,
    marginLeft: 16,
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 20,
  },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonText: {
    fontSize: 18,
  },
  expandedCategoryOptions: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  expandedCategoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    justifyContent: "center",
  },
  selectedCategoryOption: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  expandedCategoryEmoji: {
    fontSize: 16,
  },
  expandedCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  headerButton: {
    position: "relative",
  },
  subCategoryContainer: {
    marginBottom: 20,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 100,
  },

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Stories - Timeline horizontal novedoso
  storiesSection: {
    paddingVertical: 16,
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
    borderColor: "#ffffff",
  },
  storyUserName: {
    flex: 1,
    color: "#ffffff",
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
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
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

  // Transformation
  transformationContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  transformationImage: {
    flex: 1,
    position: "relative",
  },
  transformationImg: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    resizeMode: "cover",
  },
  transformationLabel: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  transformationLabelText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  transformationDivider: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },

  // Video
  videoContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  videoThumbnail: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  videoDuration: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoDurationText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  videoInfo: {
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  videoViews: {
    fontSize: 13,
  },

  // Review
  reviewTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewSalon: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  reviewSalonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    resizeMode: "cover",
    marginBottom: 12,
  },

  // Poll
  pollQuestion: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  pollOptions: {
    gap: 10,
    marginBottom: 8,
  },
  pollOption: {
    position: "relative",
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  pollBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  pollOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pollOptionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  pollPercentage: {
    fontSize: 15,
    fontWeight: "800",
  },
  pollVotes: {
    fontSize: 12,
    marginBottom: 12,
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
  carouselIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    paddingBottom: 4,
  },
  carouselDot: {
    height: 8,
    borderRadius: 4,
  },

  // Reel (Vertical Video)
  reelCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  reelThumbnail: {
    position: "relative",
  },
  reelImage: {
    width: "100%",
    height: 480,
    resizeMode: "cover",
  },
  reelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  reelPlayButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  reelDuration: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  reelDurationText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  reelViews: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  reelViewsText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  reelInfo: {
    padding: 16,
  },
  reelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  reelUserInfo: {
    flex: 1,
  },
  reelUserName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  reelUserNameText: {
    fontSize: 14,
    fontWeight: "700",
  },
  reelTime: {
    fontSize: 11,
  },
  reelTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    lineHeight: 20,
  },
  reelActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  reelAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reelActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  reelActionBookmark: {
    marginLeft: "auto",
  },

  // Snapshot (Single Image Post)
  snapshotCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  // Tip Card
  tipCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  tipAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  tipUserName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  tipTime: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
  },
  tipContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  tipIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  tipTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
  tipText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    opacity: 0.95,
  },
  tipActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  tipAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tipActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Grid (Multiple Images)
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 12,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 80) / 2,
    height: (SCREEN_WIDTH - 80) / 2,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    resizeMode: "cover",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  gridOverlayText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
  },

  // Post Actions
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
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
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  postActionBookmark: {
    marginLeft: "auto",
  },

  // Featured Section
  featuredSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
  },
  featuredScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featuredCard: {
    width: 140,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featuredInitials: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
  },
  featuredName: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  featuredRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredRatingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  featuredLocation: {
    fontSize: 12,
    textAlign: "center",
  },

  // Feed Label
  feedLabelSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  feedLabel: {
    fontSize: 22,
    fontWeight: "800",
  },

  // Polaroid Style Carousels
  polaroidSection: {
    marginBottom: 32,
  },
  polaroidScroll: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
  },
  polaroidCard: {
    width: SCREEN_WIDTH * 0.7,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  polaroidImageWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  polaroidImagePlaceholder: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  polaroidInitials: {
    fontSize: 72,
    fontWeight: "900",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },
  polaroidLikeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  polaroidBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  polaroidBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  polaroidInfo: {
    gap: 6,
  },
  polaroidProvider: {
    fontSize: 13,
    fontWeight: "600",
  },
  polaroidTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  polaroidBio: {
    fontSize: 13,
    marginTop: 4,
  },
  polaroidAddress: {
    fontSize: 13,
    marginTop: 4,
  },
  polaroidFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  polaroidRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  polaroidRatingText: {
    fontSize: 14,
    fontWeight: "700",
  },
  polaroidServicesCount: {
    fontSize: 14,
    fontWeight: "700",
  },
});
