import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {getCategoryEmoji} from "@/constants/categories";

const {width: SCREEN_WIDTH} = Dimensions.get("window");
const CARD_PADDING = 8;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 3) / 2; // 2 columnas

export default function Home() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  // Datos del feed con diferentes tamaños y tipos
  const feedItems = [
    {
      id: 1,
      type: "hero",
      size: "large", // Ocupa 2 columnas
      category: "belleza",
      user: {
        name: "BE-U Spa Premium",
        avatar: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
        verified: true,
      },
      content: {
        title: "Tratamiento Facial LED",
        description: "Tecnología avanzada para rejuvenecer tu piel",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop",
        price: "$1,200",
        rating: 4.9,
      },
      stats: {likes: 124, comments: 28},
      timeAgo: "2h",
    },
    {
      id: 2,
      type: "story-highlight",
      size: "small", // 1 columna, altura pequeña
      category: "wellness",
      content: {
        emoji: "🧘‍♀️",
        title: "Yoga Matutino",
        subtitle: "Inicia tu día con energía",
        gradient: ["#667eea", "#764ba2"],
      },
    },
    {
      id: 3,
      type: "review",
      size: "small",
      category: "belleza",
      user: {
        name: "María González",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
      },
      content: {
        text: "¡Increíble experiencia! Mi corte quedó perfecto 💇‍♀️✨",
        rating: 5,
        salon: "BE-U Hair Studio",
      },
      stats: {likes: 45},
      timeAgo: "4h",
    },
    {
      id: 4,
      type: "service",
      size: "medium",
      category: "mascotas",
      user: {
        name: "Pet Spa & Grooming",
        avatar: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100&h=100&fit=crop",
        verified: true,
      },
      content: {
        title: "Grooming Completo",
        image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop",
        price: "$600",
        duration: "120 min",
      },
      stats: {likes: 82, comments: 15},
      timeAgo: "5h",
    },
    {
      id: 5,
      type: "promo",
      size: "medium",
      category: "belleza",
      content: {
        emoji: "🎉",
        title: "20% OFF",
        subtitle: "Manicure + Pedicure",
        validUntil: "Hasta el 30 de julio",
        gradient: ["#f093fb", "#f5576c"],
      },
      stats: {likes: 156},
    },
    {
      id: 6,
      type: "tip",
      size: "small",
      category: "wellness",
      user: {
        name: "Carlos Nutricionista",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      content: {
        icon: "💡",
        text: "Bebe 2L de agua al día para mantener tu piel hidratada",
        tipType: "Tip del día",
      },
      stats: {likes: 92},
      timeAgo: "6h",
    },
    {
      id: 7,
      type: "service",
      size: "medium",
      category: "wellness",
      user: {
        name: "Zen Wellness Center",
        avatar: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop",
        verified: true,
      },
      content: {
        title: "Masaje Relajante",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
        price: "$800",
        duration: "60 min",
      },
      stats: {likes: 67, comments: 12},
      timeAgo: "7h",
    },
    {
      id: 8,
      type: "story-highlight",
      size: "small",
      category: "mascotas",
      content: {
        emoji: "🐾",
        title: "Cuidado Canino",
        subtitle: "Tips para tu mascota",
        gradient: ["#ffecd2", "#fcb69f"],
      },
    },
    {
      id: 9,
      type: "before-after",
      size: "large",
      category: "belleza",
      user: {
        name: "BE-U Hair Studio",
        avatar: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop",
        verified: true,
      },
      content: {
        title: "Transformación Completa",
        beforeImage:
          "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=300&fit=crop",
        afterImage:
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
      },
      stats: {likes: 234, comments: 45},
      timeAgo: "8h",
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "belleza":
        return "#ec4899"; // pink
      case "wellness":
        return "#8b5cf6"; // purple
      case "mascotas":
        return "#f97316"; // orange
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

  // Renderizar diferentes tipos de cards
  const renderHeroCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.9}>
      <Image source={{uri: item.content.image}} style={styles.heroImage} />
      <View
        style={[
          styles.heroOverlay,
          {borderTopColor: getCategoryColor(item.category), borderTopWidth: 3},
        ]}>
        {/* User info */}
        <View style={styles.heroUser}>
          <Image source={{uri: item.user.avatar}} style={styles.heroAvatar} />
          <View style={styles.heroUserInfo}>
            <View style={styles.heroUserName}>
              <Text style={[styles.heroUserNameText, {color: colors.foreground}]}>
                {item.user.name}
              </Text>
              {item.user.verified && (
                <Ionicons
                  name="checkmark-circle"
                  color={getCategoryColor(item.category)}
                  size={16}
                />
              )}
            </View>
            <Text style={[styles.heroTimeAgo, {color: colors.mutedForeground}]}>
              {item.timeAgo}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text style={[styles.heroTitle, {color: colors.foreground}]}>{item.content.title}</Text>
        <Text style={[styles.heroDescription, {color: colors.mutedForeground}]}>
          {item.content.description}
        </Text>

        {/* Footer */}
        <View style={styles.heroFooter}>
          <View style={styles.heroRating}>
            <Ionicons name="star" color="#fbbf24" size={16} />
            <Text style={[styles.heroRatingText, {color: colors.foreground}]}>
              {item.content.rating}
            </Text>
          </View>
          <Text style={[styles.heroPrice, {color: getCategoryColor(item.category)}]}>
            {item.content.price}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={() => toggleLike(item.id)}
            activeOpacity={0.7}>
            <Ionicons
              name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
              color={likedPosts.has(item.id) ? "#ef4444" : colors.mutedForeground}
              size={20}
            />
            <Text style={[styles.heroActionText, {color: colors.mutedForeground}]}>
              {item.stats.likes + (likedPosts.has(item.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroAction} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={20} />
            <Text style={[styles.heroActionText, {color: colors.mutedForeground}]}>
              {item.stats.comments}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroAction} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" color={colors.mutedForeground} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStoryHighlight = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.storyCard,
        {
          background: `linear-gradient(135deg, ${item.content.gradient[0]}, ${item.content.gradient[1]})`,
        },
      ]}
      activeOpacity={0.9}>
      <View
        style={[
          styles.storyCardGradient,
          {
            backgroundColor: item.content.gradient[0],
          },
        ]}>
        <Text style={styles.storyEmoji}>{item.content.emoji}</Text>
        <Text style={styles.storyTitle}>{item.content.title}</Text>
        <Text style={styles.storySubtitle}>{item.content.subtitle}</Text>
        <View style={styles.storyArrow}>
          <Ionicons name="arrow-forward" color="#ffffff" size={18} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderReviewCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.reviewCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: getCategoryColor(item.category),
        },
      ]}
      activeOpacity={0.9}>
      <View style={styles.reviewHeader}>
        <Image source={{uri: item.user.avatar}} style={styles.reviewAvatar} />
        <View style={styles.reviewUser}>
          <Text style={[styles.reviewUserName, {color: colors.foreground}]}>{item.user.name}</Text>
          <View style={styles.reviewRating}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                color={i < item.content.rating ? "#fbbf24" : colors.mutedForeground}
                size={12}
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={[styles.reviewText, {color: colors.foreground}]} numberOfLines={3}>
        {item.content.text}
      </Text>
      <Text style={[styles.reviewSalon, {color: colors.mutedForeground}]} numberOfLines={1}>
        📍 {item.content.salon}
      </Text>
      <View style={styles.reviewFooter}>
        <TouchableOpacity onPress={() => toggleLike(item.id)} activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(item.id) ? "#ef4444" : colors.mutedForeground}
            size={16}
          />
        </TouchableOpacity>
        <Text style={[styles.reviewLikes, {color: colors.mutedForeground}]}>
          {item.stats.likes + (likedPosts.has(item.id) ? 1 : 0)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderServiceCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.serviceCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.9}>
      <Image source={{uri: item.content.image}} style={styles.serviceImage} />
      <View
        style={[
          styles.serviceCategoryBadge,
          {backgroundColor: getCategoryColor(item.category) + "15"},
        ]}>
        <Text style={[styles.serviceCategoryText, {color: getCategoryColor(item.category)}]}>
          {getCategoryEmoji(item.category)}
        </Text>
      </View>
      <View style={styles.serviceContent}>
        <View style={styles.serviceHeader}>
          <Image source={{uri: item.user.avatar}} style={styles.serviceAvatar} />
          <View style={{flex: 1}}>
            <Text style={[styles.serviceTitle, {color: colors.foreground}]} numberOfLines={1}>
              {item.content.title}
            </Text>
            <Text style={[styles.serviceName, {color: colors.mutedForeground}]} numberOfLines={1}>
              {item.user.name}
            </Text>
          </View>
        </View>
        <View style={styles.serviceFooter}>
          <Text style={[styles.servicePrice, {color: getCategoryColor(item.category)}]}>
            {item.content.price}
          </Text>
          <View style={styles.serviceActions}>
            <TouchableOpacity onPress={() => toggleLike(item.id)} activeOpacity={0.7}>
              <Ionicons
                name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
                color={likedPosts.has(item.id) ? "#ef4444" : colors.mutedForeground}
                size={18}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPromoCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.promoCard,
        {
          backgroundColor: item.content.gradient[0],
        },
      ]}
      activeOpacity={0.9}>
      <View style={styles.promoContent}>
        <Text style={styles.promoEmoji}>{item.content.emoji}</Text>
        <Text style={styles.promoTitle}>{item.content.title}</Text>
        <Text style={styles.promoSubtitle}>{item.content.subtitle}</Text>
        <Text style={styles.promoValid}>{item.content.validUntil}</Text>
        <View style={styles.promoFooter}>
          <TouchableOpacity onPress={() => toggleLike(item.id)} activeOpacity={0.7}>
            <Ionicons
              name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
              color="#ffffff"
              size={18}
            />
          </TouchableOpacity>
          <Text style={styles.promoLikes}>
            {item.stats.likes + (likedPosts.has(item.id) ? 1 : 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTipCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.tipCard,
        {
          backgroundColor: colors.card,
          borderColor: getCategoryColor(item.category),
        },
      ]}
      activeOpacity={0.9}>
      <View style={styles.tipHeader}>
        <View style={[styles.tipIconBadge, {backgroundColor: getCategoryColor(item.category)}]}>
          <Text style={styles.tipIcon}>{item.content.icon}</Text>
        </View>
        <Text style={[styles.tipType, {color: getCategoryColor(item.category)}]}>
          {item.content.tipType}
        </Text>
      </View>
      <Text style={[styles.tipText, {color: colors.foreground}]} numberOfLines={3}>
        {item.content.text}
      </Text>
      <View style={styles.tipFooter}>
        <Image source={{uri: item.user.avatar}} style={styles.tipAvatar} />
        <Text style={[styles.tipUserName, {color: colors.mutedForeground}]} numberOfLines={1}>
          {item.user.name}
        </Text>
        <TouchableOpacity onPress={() => toggleLike(item.id)} activeOpacity={0.7}>
          <Ionicons
            name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
            color={likedPosts.has(item.id) ? "#ef4444" : colors.mutedForeground}
            size={16}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderBeforeAfterCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.beforeAfterCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.9}>
      <View style={styles.beforeAfterImages}>
        <View style={styles.beforeAfterImageContainer}>
          <Image source={{uri: item.content.beforeImage}} style={styles.beforeAfterImage} />
          <View style={[styles.beforeAfterLabel, {backgroundColor: colors.muted}]}>
            <Text style={[styles.beforeAfterLabelText, {color: colors.foreground}]}>Antes</Text>
          </View>
        </View>
        <View style={styles.beforeAfterDivider}>
          <View style={[styles.beforeAfterDividerLine, {backgroundColor: colors.border}]} />
          <View
            style={[styles.beforeAfterIcon, {backgroundColor: getCategoryColor(item.category)}]}>
            <Ionicons name="arrow-forward" color="#ffffff" size={16} />
          </View>
        </View>
        <View style={styles.beforeAfterImageContainer}>
          <Image source={{uri: item.content.afterImage}} style={styles.beforeAfterImage} />
          <View
            style={[styles.beforeAfterLabel, {backgroundColor: getCategoryColor(item.category)}]}>
            <Text style={styles.beforeAfterLabelText}>Después</Text>
          </View>
        </View>
      </View>
      <View style={styles.beforeAfterContent}>
        <View style={styles.beforeAfterHeader}>
          <Image source={{uri: item.user.avatar}} style={styles.beforeAfterAvatar} />
          <View style={{flex: 1}}>
            <View style={styles.beforeAfterUserName}>
              <Text style={[styles.beforeAfterUserNameText, {color: colors.foreground}]}>
                {item.user.name}
              </Text>
              {item.user.verified && (
                <Ionicons
                  name="checkmark-circle"
                  color={getCategoryColor(item.category)}
                  size={14}
                />
              )}
            </View>
            <Text style={[styles.beforeAfterTitle, {color: colors.mutedForeground}]}>
              {item.content.title}
            </Text>
          </View>
        </View>
        <View style={styles.beforeAfterActions}>
          <TouchableOpacity
            style={styles.beforeAfterAction}
            onPress={() => toggleLike(item.id)}
            activeOpacity={0.7}>
            <Ionicons
              name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
              color={likedPosts.has(item.id) ? "#ef4444" : colors.mutedForeground}
              size={20}
            />
            <Text style={[styles.beforeAfterActionText, {color: colors.mutedForeground}]}>
              {item.stats.likes + (likedPosts.has(item.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.beforeAfterAction} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" color={colors.mutedForeground} size={20} />
            <Text style={[styles.beforeAfterActionText, {color: colors.mutedForeground}]}>
              {item.stats.comments}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCard = (item: any) => {
    switch (item.type) {
      case "hero":
        return renderHeroCard(item);
      case "story-highlight":
        return renderStoryHighlight(item);
      case "review":
        return renderReviewCard(item);
      case "service":
        return renderServiceCard(item);
      case "promo":
        return renderPromoCard(item);
      case "tip":
        return renderTipCard(item);
      case "before-after":
        return renderBeforeAfterCard(item);
      default:
        return null;
    }
  };

  // Organizar items en columnas para layout tipo masonry
  const organizeInColumns = () => {
    const leftColumn: any[] = [];
    const rightColumn: any[] = [];

    feedItems.forEach((item) => {
      if (item.size === "large") {
        // Large items van en su propia fila
        leftColumn.push({...item, fullWidth: true});
      } else {
        // Alternar items pequeños y medianos entre columnas
        if (leftColumn.length <= rightColumn.length) {
          leftColumn.push(item);
        } else {
          rightColumn.push(item);
        }
      }
    });

    return {leftColumn, rightColumn};
  };

  const {leftColumn, rightColumn} = organizeInColumns();

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
            <Ionicons name="search" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
            <Ionicons name="notifications-outline" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Masonry Feed */}
      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}>
        <View style={styles.masonryContainer}>
          {/* Renderizar items grandes (full width) y columnas */}
          {feedItems.map((item) => {
            if (item.size === "large") {
              return renderCard(item);
            }
            return null;
          })}

          <View style={styles.masonryColumns}>
            {/* Left Column */}
            <View style={styles.masonryColumn}>
              {leftColumn.filter((item) => item.size !== "large").map((item) => renderCard(item))}
            </View>

            {/* Right Column */}
            <View style={styles.masonryColumn}>{rightColumn.map((item) => renderCard(item))}</View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, {backgroundColor: colors.primary}]} activeOpacity={0.9}>
        <Ionicons name="add" color="#ffffff" size={28} />
      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: -1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 100,
  },
  masonryContainer: {
    padding: CARD_PADDING,
  },
  masonryColumns: {
    flexDirection: "row",
    gap: CARD_PADDING,
  },
  masonryColumn: {
    flex: 1,
    gap: CARD_PADDING,
  },

  // Hero Card (Large)
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: CARD_PADDING,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },
  heroOverlay: {
    padding: 16,
  },
  heroUser: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  heroUserInfo: {
    flex: 1,
  },
  heroUserName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroUserNameText: {
    fontSize: 15,
    fontWeight: "600",
  },
  heroTimeAgo: {
    fontSize: 12,
    marginTop: 2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heroRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroRatingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  heroPrice: {
    fontSize: 22,
    fontWeight: "bold",
  },
  heroActions: {
    flexDirection: "row",
    gap: 20,
  },
  heroAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroActionText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Story Highlight Card (Small)
  storyCard: {
    borderRadius: 16,
    overflow: "hidden",
    height: 140,
  },
  storyCardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  storyEmoji: {
    fontSize: 32,
  },
  storyTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  storySubtitle: {
    color: "#ffffff",
    fontSize: 12,
    opacity: 0.9,
  },
  storyArrow: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Review Card (Small)
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  reviewUser: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewSalon: {
    fontSize: 11,
    marginBottom: 10,
  },
  reviewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewLikes: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Service Card (Medium)
  serviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  serviceImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  serviceCategoryBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceCategoryText: {
    fontSize: 18,
  },
  serviceContent: {
    padding: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 12,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  serviceActions: {
    flexDirection: "row",
    gap: 12,
  },

  // Promo Card (Medium)
  promoCard: {
    borderRadius: 16,
    overflow: "hidden",
    height: 180,
  },
  promoContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  promoEmoji: {
    fontSize: 36,
  },
  promoTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  promoSubtitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  promoValid: {
    color: "#ffffff",
    fontSize: 11,
    opacity: 0.9,
  },
  promoFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promoLikes: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Tip Card (Small)
  tipCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  tipIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  tipIcon: {
    fontSize: 14,
  },
  tipType: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  tipFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tipUserName: {
    fontSize: 11,
    flex: 1,
  },

  // Before/After Card (Large)
  beforeAfterCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: CARD_PADDING,
  },
  beforeAfterImages: {
    flexDirection: "row",
    height: 200,
  },
  beforeAfterImageContainer: {
    flex: 1,
    position: "relative",
  },
  beforeAfterImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  beforeAfterLabel: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  beforeAfterLabelText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  beforeAfterDivider: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  beforeAfterDividerLine: {
    position: "absolute",
    width: 1,
    height: "100%",
  },
  beforeAfterIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  beforeAfterContent: {
    padding: 16,
  },
  beforeAfterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  beforeAfterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  beforeAfterUserName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  beforeAfterUserNameText: {
    fontSize: 14,
    fontWeight: "600",
  },
  beforeAfterTitle: {
    fontSize: 13,
  },
  beforeAfterActions: {
    flexDirection: "row",
    gap: 20,
  },
  beforeAfterAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  beforeAfterActionText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
