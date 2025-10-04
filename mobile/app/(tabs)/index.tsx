import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef} from "react";
import {getCategoryEmoji} from "@/constants/categories";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function Home() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  // Historias - Formato horizontal tipo timeline novedoso
  const stories = [
    {
      id: 1,
      user: "BE-U Spa",
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
        name: "BE-U Spa",
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
        name: "BE-U Hair Studio",
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
        name: "BE-U Community",
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
      salon: "BE-U Spa Premium",
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
        name: "BE-U Community",
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
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>BE-U</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle-outline" color={colors.foreground} size={26} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
            <Ionicons name="notifications-outline" color={colors.foreground} size={26} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}>
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

        {/* Feed Posts */}
        <View style={styles.postsSection}>{feedPosts.map((post) => renderPost(post))}</View>
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
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF69B4",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 100,
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
});
