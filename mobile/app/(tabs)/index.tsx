import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Image} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";

export default function Home() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const stories = [
    {
      id: 1,
      name: "BE-U Spa",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
      isOwn: true,
    },
    {
      id: 2,
      name: "María",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
      isOwn: false,
    },
    {
      id: 3,
      name: "Carlos",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      isOwn: false,
    },
    {
      id: 4,
      name: "BE-U Hair",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop",
      isOwn: false,
    },
  ];

  const posts = [
    {
      id: 1,
      user: {
        name: "BE-U Spa Premium",
        avatar: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
        isVerified: true,
        location: "Roma Norte, CDMX",
      },
      content: {
        type: "service",
        text: "✨ ¡Nuevo tratamiento facial con tecnología LED! Reserva tu cita y descubre los beneficios de la luz roja para tu piel. #BEU #Facial #Skincare",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
        service: "Tratamiento Facial LED",
        price: "$1,200",
        duration: "60 min",
      },
      stats: {likes: 24, comments: 8, shares: 3},
      timeAgo: "2h",
    },
    {
      id: 2,
      user: {
        name: "María González",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
        isVerified: false,
        location: "Cliente BE-U",
      },
      content: {
        type: "review",
        text: "¡Increíble experiencia en BE-U Hair Studio! Mi corte quedó perfecto y el ambiente es súper relajante. Definitivamente regresaré 💇‍♀️✨",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
        rating: 5,
        salon: "BE-U Hair Studio",
      },
      stats: {likes: 18, comments: 5, shares: 2},
      timeAgo: "4h",
    },
    {
      id: 3,
      user: {
        name: "Carlos Estilista",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        isVerified: true,
        location: "Profesional BE-U",
      },
      content: {
        type: "tip",
        text: "💡 Tip del día: Para mantener tu color vibrante, usa champú sin sulfatos y evita el agua muy caliente. ¡Tu cabello te lo agradecerá!",
        image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
        tipCategory: "Cuidado del Cabello",
      },
      stats: {likes: 32, comments: 12, shares: 8},
      timeAgo: "6h",
    },
    {
      id: 4,
      user: {
        name: "BE-U Beauty Bar",
        avatar: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=100&h=100&fit=crop",
        isVerified: true,
        location: "Condesa, CDMX",
      },
      content: {
        type: "promotion",
        text: "🎉 ¡OFERTA ESPECIAL! Esta semana: 20% de descuento en manicure + pedicure. ¡Reserva ya y luce unas manos perfectas!",
        image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
        discount: "20% OFF",
        validUntil: "Hasta el 30 de julio",
      },
      stats: {likes: 45, comments: 15, shares: 12},
      timeAgo: "8h",
    },
  ];

  const toggleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  const renderStory = (story: any, index: number) => (
    <TouchableOpacity key={story.id} style={styles.storyContainer}>
      <View style={[styles.storyRing, {borderColor: story.isOwn ? colors.muted : colors.primary}]}>
        <Image source={{uri: story.image}} style={styles.storyAvatar} />
      </View>
      <Text style={[styles.storyName, {color: colors.foreground}]}>
        {story.isOwn ? "Tu historia" : story.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPost = (post: any) => (
    <View
      key={post.id}
      style={[styles.postCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={{uri: post.user.avatar}} style={styles.userAvatar} />
          <View style={styles.userDetails}>
            <View style={styles.userNameContainer}>
              <Text style={[styles.userName, {color: colors.foreground}]}>{post.user.name}</Text>
              {post.user.isVerified && (
                <Ionicons name="checkmark-circle" color={colors.primary} size={16} />
              )}
            </View>
            <Text style={[styles.userLocation, {color: colors.mutedForeground}]}>
              {post.user.location} • {post.timeAgo}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={[styles.postText, {color: colors.foreground}]}>{post.content.text}</Text>

        {/* Content Type Specific Info */}
        {post.content.type === "service" && (
          <View style={[styles.serviceInfo, {backgroundColor: colors.muted}]}>
            <View style={styles.serviceDetails}>
              <Text style={[styles.serviceName, {color: colors.foreground}]}>
                {post.content.service}
              </Text>
              <Text style={[styles.serviceDuration, {color: colors.mutedForeground}]}>
                {post.content.duration}
              </Text>
            </View>
            <Text style={[styles.servicePrice, {color: colors.primary}]}>{post.content.price}</Text>
          </View>
        )}

        {post.content.type === "review" && (
          <View style={[styles.reviewInfo, {backgroundColor: colors.muted}]}>
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  color={i < post.content.rating ? "#fbbf24" : colors.mutedForeground}
                  size={16}
                />
              ))}
            </View>
            <Text style={[styles.reviewSalon, {color: colors.foreground}]}>
              {post.content.salon}
            </Text>
          </View>
        )}

        {post.content.type === "tip" && (
          <View style={[styles.tipInfo, {backgroundColor: colors.muted}]}>
            <Ionicons name="bulb" color={colors.primary} size={20} />
            <Text style={[styles.tipCategory, {color: colors.foreground}]}>
              {post.content.tipCategory}
            </Text>
          </View>
        )}

        {post.content.type === "promotion" && (
          <View style={[styles.promotionInfo, {backgroundColor: colors.primary}]}>
            <Text style={[styles.discountText, {color: "#ffffff"}]}>{post.content.discount}</Text>
            <Text style={[styles.validUntil, {color: "#ffffff"}]}>{post.content.validUntil}</Text>
          </View>
        )}

        {/* Post Image */}
        <Image source={{uri: post.content.image}} style={styles.postImage} />
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(post.id)}>
            <Ionicons
              name={likedPosts.has(post.id) ? "heart" : "heart-outline"}
              color={likedPosts.has(post.id) ? "#ef4444" : colors.mutedForeground}
              size={24}
            />
            <Text style={[styles.actionText, {color: colors.mutedForeground}]}>
              {post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
            <Text style={[styles.actionText, {color: colors.mutedForeground}]}>
              {post.stats.comments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" color={colors.mutedForeground} size={24} />
            <Text style={[styles.actionText, {color: colors.mutedForeground}]}>
              {post.stats.shares}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.background}]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>BE-U</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="add-circle-outline" color={colors.primary} size={28} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="heart-outline" color={colors.mutedForeground} size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContent}>
        {stories.map(renderStory)}
      </ScrollView>

      {/* Posts */}
      <View style={styles.postsContainer}>{posts.map(renderPost)}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  storiesContainer: {
    paddingVertical: 16,
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyContainer: {
    alignItems: "center",
    width: 70,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyName: {
    fontSize: 12,
    textAlign: "center",
  },
  postsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userLocation: {
    fontSize: 14,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  reviewInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewSalon: {
    fontSize: 16,
    fontWeight: "600",
  },
  tipInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  tipCategory: {
    fontSize: 16,
    fontWeight: "600",
  },
  promotionInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  discountText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  validUntil: {
    fontSize: 14,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
