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
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {getCategoryEmoji} from "@/constants/categories";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth";
import {providerApi} from "@/lib/api";
import {ProfessionalProfile, PlaceProfile} from "@/types/global";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function Home() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<"belleza" | "cuidado" | "mascotas">(
    "belleza"
  );
  const [isCategoryPickerExpanded, setIsCategoryPickerExpanded] = useState(false);
  const router = useRouter();
  const {user, isAuthenticated, logout} = useAuth();

  // Featured providers state
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [places, setPlaces] = useState<PlaceProfile[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedProviders();
  }, []);

  const fetchFeaturedProviders = async () => {
    try {
      setIsFeaturedLoading(true);
      const [professionalsRes, placesRes] = await Promise.all([
        providerApi.getProfessionalProfiles({page: 1}),
        providerApi.getPlaceProfiles({page: 1}),
      ]);
      // Get only first 3 of each
      setProfessionals((professionalsRes.data.results || []).slice(0, 3));
      setPlaces((placesRes.data.results || []).slice(0, 3));
    } catch (err) {
      console.error("Error fetching featured:", err);
    } finally {
      setIsFeaturedLoading(false);
    }
  };

  // Historias - Formato horizontal tipo timeline novedoso
  const stories = [
    {
      id: 1,
      user: "Be-U Spa",
      avatar: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
      preview: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=300&fit=crop",
      type: "featured",
      badge: "✨",
    },
    {
      id: 2,
      user: "Ana López",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
      preview: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=300&fit=crop",
      type: "user",
      badge: "💇‍♀️",
    },
    {
      id: 3,
      user: "Zen Studio",
      avatar: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop",
      preview: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=300&fit=crop",
      type: "business",
      badge: "🧘",
    },
    {
      id: 4,
      user: "María G.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      preview: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=300&fit=crop",
      type: "user",
      badge: "💅",
    },
  ];

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
      category: "wellness",
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
      category: "wellness",
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "belleza":
        return "#FF69B4";
      case "wellness":
        return "#DDA0DD";
      case "mascotas":
        return "#FFB347";
      default:
        return colors.primary;
    }
  };

  const toggleLike = (id: number) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedPosts(newLiked);
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
          <View style={[styles.transformationLabel, {backgroundColor: colors.muted}]}>
            <Text style={[styles.transformationLabelText, {color: colors.foreground}]}>Antes</Text>
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
      {/* Header */}
      <View
        style={[
          styles.header,
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Be-U</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/create-post")}>
          <Ionicons name="add-circle-outline" color={colors.foreground} size={26} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}>
        {/* Welcome Message for Authenticated Users */}
        {isAuthenticated && user && (
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeText, {color: colors.foreground}]}>
              ¡Hola, {user.first_name || user.email}! 👋
            </Text>
          </View>
        )}

        {/* Stories - Horizontal Timeline Format (Novedoso) */}
        <View style={styles.storiesSection}>
          <Text style={[styles.storiesTitle, {color: colors.foreground}]}>Historias</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}>
            {stories.map((story) => (
              <TouchableOpacity key={story.id} style={styles.storyCard} activeOpacity={0.9}>
                <Image source={{uri: story.preview}} style={styles.storyPreview} />
                <View style={styles.storyOverlay}>
                  <View style={styles.storyBadge}>
                    <Text style={styles.storyBadgeText}>{story.badge}</Text>
                  </View>
                  <View style={styles.storyUser}>
                    <Image source={{uri: story.avatar}} style={styles.storyAvatar} />
                    <Text style={styles.storyUserName} numberOfLines={1}>
                      {story.user}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Destacados Section */}
        {!isFeaturedLoading && (professionals.length > 0 || places.length > 0) && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>✨ Destacados</Text>
              <TouchableOpacity onPress={() => router.push("/explore")}>
                <Text style={[styles.seeAllText, {color: colors.primary}]}>Ver todo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}>
              {professionals.map((professional, index) => (
                <TouchableOpacity
                  key={`prof-${professional.id}`}
                  style={[
                    styles.featuredCard,
                    {backgroundColor: colors.card},
                    index % 2 === 0
                      ? {transform: [{rotate: "2deg"}]}
                      : {transform: [{rotate: "-2deg"}]},
                  ]}
                  onPress={() => router.push(`/professional/${professional.id}`)}
                  activeOpacity={0.95}>
                  <View style={[styles.featuredAvatar, {backgroundColor: "#FFB6C1"}]}>
                    <Text style={styles.featuredInitials}>
                      {professional.name[0]}
                      {professional.last_name[0]}
                    </Text>
                  </View>
                  <Text style={[styles.featuredName, {color: colors.foreground}]} numberOfLines={1}>
                    {professional.name} {professional.last_name}
                  </Text>
                  <View style={styles.featuredRating}>
                    <Ionicons name="star" color="#FFD700" size={14} />
                    <Text style={[styles.featuredRatingText, {color: colors.foreground}]}>
                      {professional.rating.toFixed(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {places.map((place, index) => (
                <TouchableOpacity
                  key={`place-${place.id}`}
                  style={[
                    styles.featuredCard,
                    {backgroundColor: colors.card},
                    index % 2 === 0
                      ? {transform: [{rotate: "-2deg"}]}
                      : {transform: [{rotate: "2deg"}]},
                  ]}
                  onPress={() => router.push(`/place/${place.id}`)}
                  activeOpacity={0.95}>
                  <View style={[styles.featuredAvatar, {backgroundColor: "#DDA0DD"}]}>
                    <Text style={styles.featuredInitials}>
                      {place.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.featuredName, {color: colors.foreground}]} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <Text
                    style={[styles.featuredLocation, {color: colors.mutedForeground}]}
                    numberOfLines={1}>
                    {place.city || place.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Professionals Carousel */}
        {!isFeaturedLoading && professionals.length > 0 && (
          <View style={styles.polaroidSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                💅 Profesionales ({professionals.length})
              </Text>
              <TouchableOpacity onPress={() => router.push("/profesionales")}>
                <Text style={[styles.seeAllText, {color: colors.primary}]}>Ver todo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.polaroidScroll}
              snapToInterval={SCREEN_WIDTH * 0.7 + 16}
              decelerationRate="fast">
              {professionals.map((professional, index) => (
                <TouchableOpacity
                  key={professional.id}
                  style={[
                    styles.polaroidCard,
                    {backgroundColor: colors.card},
                    index % 2 === 0
                      ? {transform: [{rotate: "2deg"}]}
                      : {transform: [{rotate: "-2deg"}]},
                  ]}
                  onPress={() => router.push(`/professional/${professional.id}`)}
                  activeOpacity={0.95}>
                  <View style={styles.polaroidImageWrapper}>
                    <View style={[styles.polaroidImagePlaceholder, {backgroundColor: "#FFB6C1"}]}>
                      <Text style={styles.polaroidInitials}>
                        {professional.name[0]}
                        {professional.last_name[0]}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.polaroidLikeButton, {backgroundColor: "#ffffff"}]}>
                      <Ionicons name="heart-outline" color="#FF69B4" size={20} />
                    </TouchableOpacity>
                    {professional.rating >= 4.5 && (
                      <View style={[styles.polaroidBadge, {backgroundColor: "#FFD700"}]}>
                        <Text style={styles.polaroidBadgeText}>⭐ Top</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.polaroidInfo}>
                    <Text style={[styles.polaroidProvider, {color: colors.mutedForeground}]}>
                      {professional.city || "Profesional"}
                    </Text>
                    <Text
                      style={[styles.polaroidTitle, {color: colors.foreground}]}
                      numberOfLines={1}>
                      {professional.name} {professional.last_name}
                    </Text>
                    {professional.bio && (
                      <Text
                        style={[styles.polaroidBio, {color: colors.mutedForeground}]}
                        numberOfLines={2}>
                        {professional.bio}
                      </Text>
                    )}
                    <View style={styles.polaroidFooter}>
                      <View style={styles.polaroidRating}>
                        <Ionicons name="star" color="#FFD700" size={14} />
                        <Text style={[styles.polaroidRatingText, {color: colors.foreground}]}>
                          {professional.rating.toFixed(1)}
                        </Text>
                      </View>
                      <Text style={[styles.polaroidServicesCount, {color: "#FF69B4"}]}>
                        {professional.services_count} servicios
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Places Carousel */}
        {!isFeaturedLoading && places.length > 0 && (
          <View style={styles.polaroidSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                🏢 Establecimientos ({places.length})
              </Text>
              <TouchableOpacity onPress={() => router.push("/lugares")}>
                <Text style={[styles.seeAllText, {color: colors.primary}]}>Ver todo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.polaroidScroll}
              snapToInterval={SCREEN_WIDTH * 0.7 + 16}
              decelerationRate="fast">
              {places.map((place, index) => (
                <TouchableOpacity
                  key={place.id}
                  style={[
                    styles.polaroidCard,
                    {backgroundColor: colors.card},
                    index % 2 === 0
                      ? {transform: [{rotate: "-2deg"}]}
                      : {transform: [{rotate: "2deg"}]},
                  ]}
                  onPress={() => router.push(`/place/${place.id}`)}
                  activeOpacity={0.95}>
                  <View style={styles.polaroidImageWrapper}>
                    <View style={[styles.polaroidImagePlaceholder, {backgroundColor: "#DDA0DD"}]}>
                      <Text style={styles.polaroidInitials}>
                        {place.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.polaroidLikeButton, {backgroundColor: "#ffffff"}]}>
                      <Ionicons name="heart-outline" color="#FF69B4" size={20} />
                    </TouchableOpacity>
                    {place.services_count > 5 && (
                      <View style={[styles.polaroidBadge, {backgroundColor: "#FF69B4"}]}>
                        <Text style={styles.polaroidBadgeText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.polaroidInfo}>
                    <Text style={[styles.polaroidProvider, {color: colors.mutedForeground}]}>
                      {place.city || place.country || "Establecimiento"}
                    </Text>
                    <Text
                      style={[styles.polaroidTitle, {color: colors.foreground}]}
                      numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text
                      style={[styles.polaroidAddress, {color: colors.mutedForeground}]}
                      numberOfLines={1}>
                      <Ionicons name="location" size={12} color={colors.mutedForeground} />
                      {"  "}
                      {place.address}
                    </Text>
                    <View style={styles.polaroidFooter}>
                      <View style={styles.polaroidRating}>
                        <Ionicons name="briefcase" color="#DDA0DD" size={14} />
                        <Text style={[styles.polaroidRatingText, {color: colors.foreground}]}>
                          {place.services_count} servicios
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Feed Label */}
        <View style={styles.feedLabelSection}>
          <Text style={[styles.feedLabel, {color: colors.foreground}]}>Feed</Text>
        </View>

        {/* Feed Posts */}
        <View style={styles.postsSection}>{feedPosts.map((post) => renderPost(post))}</View>
      </ScrollView>

      {/* Floating Category Picker */}
      <View style={styles.floatingCategoryPicker}>
        {/* Collapsed State - Single Button */}
        {!isCategoryPickerExpanded && (
          <TouchableOpacity
            style={[styles.categoryToggleButton, {backgroundColor: colors.primary}]}
            onPress={() => setIsCategoryPickerExpanded(true)}
            activeOpacity={0.8}>
            <Ionicons
              name={
                selectedCategory === "belleza"
                  ? "sparkles"
                  : selectedCategory === "cuidado"
                  ? "heart"
                  : "paw"
              }
              color="#ffffff"
              size={18}
            />
          </TouchableOpacity>
        )}

        {/* Expanded State - All Categories */}
        {isCategoryPickerExpanded && (
          <View
            style={[styles.categoryIconsContainer, {backgroundColor: "rgba(255, 255, 255, 0.95)"}]}>
            <TouchableOpacity
              style={[
                styles.categoryIcon,
                selectedCategory === "belleza" && [
                  styles.activeCategoryIcon,
                  {backgroundColor: colors.primary},
                ],
              ]}
              onPress={() => {
                setSelectedCategory("belleza");
                setIsCategoryPickerExpanded(false);
              }}
              activeOpacity={0.8}>
              <Ionicons
                name="sparkles"
                color={selectedCategory === "belleza" ? "#ffffff" : colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryIcon,
                selectedCategory === "cuidado" && [
                  styles.activeCategoryIcon,
                  {backgroundColor: colors.primary},
                ],
              ]}
              onPress={() => {
                setSelectedCategory("cuidado");
                setIsCategoryPickerExpanded(false);
              }}
              activeOpacity={0.8}>
              <Ionicons
                name="heart"
                color={selectedCategory === "cuidado" ? "#ffffff" : colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryIcon,
                selectedCategory === "mascotas" && [
                  styles.activeCategoryIcon,
                  {backgroundColor: colors.primary},
                ],
              ]}
              onPress={() => {
                setSelectedCategory("mascotas");
                setIsCategoryPickerExpanded(false);
              }}
              activeOpacity={0.8}>
              <Ionicons
                name="paw"
                color={selectedCategory === "mascotas" ? "#ffffff" : colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  headerButton: {
    position: "relative",
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
  carousel: {
    marginBottom: 12,
  },
  carouselImage: {
    width: SCREEN_WIDTH - 72,
    height: 300,
    borderRadius: 16,
    marginRight: 8,
    resizeMode: "cover",
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

  // Floating Category Picker
  floatingCategoryPicker: {
    position: "absolute",
    right: 16,
    top: 120,
    flexDirection: "column",
    gap: 8,
    zIndex: 10,
  },
  categoryToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryIconsContainer: {
    flexDirection: "column",
    padding: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  activeCategoryIcon: {
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
