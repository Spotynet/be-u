import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {useRouter} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function Explore() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Categorías principales con colores y gradientes
  const categories = [
    {
      id: "belleza",
      name: "Belleza",
      emoji: "💄",
      gradient: ["#ec4899", "#f472b6"],
      count: 234,
    },
    {
      id: "wellness",
      name: "Wellness",
      emoji: "🧘",
      gradient: ["#8b5cf6", "#a78bfa"],
      count: 156,
    },
    {
      id: "mascotas",
      name: "Mascotas",
      emoji: "🐾",
      gradient: ["#f97316", "#fb923c"],
      count: 89,
    },
  ];

  // Featured/Hero content
  const featured = {
    title: "Tratamiento Facial con LED",
    subtitle: "Tecnología avanzada de rejuvenecimiento",
    provider: "BE-U Spa Premium",
    rating: 4.9,
    price: "$1,200",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop",
    badge: "Destacado",
    category: "belleza",
  };

  // Trending services
  const trending = [
    {
      id: 1,
      name: "Masaje Relajante",
      provider: "Zen Wellness",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop",
      price: "$800",
      rating: 4.8,
      category: "wellness",
    },
    {
      id: 2,
      name: "Corte y Color",
      provider: "BE-U Hair Studio",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=200&fit=crop",
      price: "$600",
      rating: 4.9,
      category: "belleza",
    },
    {
      id: 3,
      name: "Grooming Completo",
      provider: "Pet Spa",
      image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=200&fit=crop",
      price: "$500",
      rating: 4.7,
      category: "mascotas",
    },
  ];

  // Near you establishments
  const nearYou = [
    {
      id: 1,
      name: "BE-U Spa Premium",
      distance: "0.5 km",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop",
      rating: 4.8,
      category: "belleza",
    },
    {
      id: 2,
      name: "Flow Yoga Studio",
      distance: "0.8 km",
      image: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=200&h=200&fit=crop",
      rating: 4.9,
      category: "wellness",
    },
    {
      id: 3,
      name: "Pet Grooming",
      distance: "1.2 km",
      image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
      rating: 4.7,
      category: "mascotas",
    },
  ];

  // Collections/Spotlights
  const collections = [
    {
      id: 1,
      title: "Relájate y Renuévate",
      subtitle: "Los mejores spas de la ciudad",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=250&fit=crop",
      count: 45,
      gradient: ["rgba(139, 92, 246, 0.8)", "rgba(167, 139, 250, 0.6)"],
    },
    {
      id: 2,
      title: "Transforma tu Look",
      subtitle: "Expertos en color y estilo",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=250&fit=crop",
      count: 67,
      gradient: ["rgba(236, 72, 153, 0.8)", "rgba(244, 114, 182, 0.6)"],
    },
    {
      id: 3,
      title: "Cuidado para tu Mascota",
      subtitle: "Profesionales certificados",
      image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=250&fit=crop",
      count: 34,
      gradient: ["rgba(249, 115, 22, 0.8)", "rgba(251, 146, 60, 0.6)"],
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Sticky Search Header */}
      <View style={[styles.searchHeader, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.searchContainer,
            searchFocused && {borderColor: colors.primary},
            {backgroundColor: colors.input, borderColor: colors.border},
          ]}>
          <Ionicons name="search" color={colors.mutedForeground} size={20} />
          <TextInput
            style={[styles.searchInput, {color: colors.foreground}]}
            placeholder="Buscar servicios, lugares..."
            placeholderTextColor={colors.mutedForeground}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchFocused && (
            <TouchableOpacity onPress={() => setSearchFocused(false)}>
              <Ionicons name="close-circle" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="options" color={colors.foreground} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        {/* Featured/Hero Section */}
        <TouchableOpacity style={styles.featuredCard} activeOpacity={0.95}>
          <Image source={{uri: featured.image}} style={styles.featuredImage} />
          <View style={styles.featuredOverlay}>
            <View style={[styles.featuredBadge, {backgroundColor: colors.primary}]}>
              <Ionicons name="star" color="#ffffff" size={14} />
              <Text style={styles.featuredBadgeText}>{featured.badge}</Text>
            </View>

            <View style={styles.featuredContent}>
              <Text style={styles.featuredProvider}>{featured.provider}</Text>
              <Text style={styles.featuredTitle}>{featured.title}</Text>
              <Text style={styles.featuredSubtitle}>{featured.subtitle}</Text>

              <View style={styles.featuredFooter}>
                <View style={styles.featuredRating}>
                  <Ionicons name="star" color="#fbbf24" size={16} />
                  <Text style={styles.featuredRatingText}>{featured.rating}</Text>
                </View>
                <Text style={styles.featuredPrice}>{featured.price}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Categorías</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.9}
                onPress={() => setSelectedCategory(category.id)}>
                <View
                  style={[
                    styles.categoryCardContent,
                    {backgroundColor: category.gradient[0] + "15"},
                  ]}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryName, {color: colors.foreground}]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.categoryCount, {color: colors.mutedForeground}]}>
                    {category.count} servicios
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Near You */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Cerca de ti</Text>
              <Text style={[styles.sectionSubtitle, {color: colors.mutedForeground}]}>
                Establecimientos a menos de 2 km
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/map")}
              style={[styles.sectionAction, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name="map" color={colors.primary} size={16} />
              <Text style={[styles.sectionActionText, {color: colors.primary}]}>Ver mapa</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearYouScroll}>
            {nearYou.map((place) => (
              <TouchableOpacity key={place.id} style={styles.nearYouCard} activeOpacity={0.9}>
                <Image source={{uri: place.image}} style={styles.nearYouImage} />
                <View style={styles.nearYouContent}>
                  <Text style={[styles.nearYouName, {color: colors.foreground}]} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <View style={styles.nearYouMeta}>
                    <Ionicons name="location" color={colors.primary} size={12} />
                    <Text style={[styles.nearYouDistance, {color: colors.mutedForeground}]}>
                      {place.distance}
                    </Text>
                  </View>
                  <View style={styles.nearYouRating}>
                    <Ionicons name="star" color="#fbbf24" size={12} />
                    <Text style={[styles.nearYouRatingText, {color: colors.foreground}]}>
                      {place.rating}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                <Ionicons name="flame" color="#ef4444" size={20} /> Tendencia
              </Text>
              <Text style={[styles.sectionSubtitle, {color: colors.mutedForeground}]}>
                Lo más reservado esta semana
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.seeAll, {color: colors.primary}]}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}>
            {trending.map((service) => (
              <TouchableOpacity key={service.id} style={styles.trendingCard} activeOpacity={0.9}>
                <Image source={{uri: service.image}} style={styles.trendingImage} />
                <View style={styles.trendingGradient}>
                  <View style={styles.trendingContent}>
                    <Text style={styles.trendingName}>{service.name}</Text>
                    <Text style={styles.trendingProvider}>{service.provider}</Text>
                    <View style={styles.trendingFooter}>
                      <View style={styles.trendingRating}>
                        <Ionicons name="star" color="#fbbf24" size={14} />
                        <Text style={styles.trendingRatingText}>{service.rating}</Text>
                      </View>
                      <Text style={styles.trendingPrice}>{service.price}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Collections/Spotlights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
              Colecciones Destacadas
            </Text>
          </View>

          <View style={styles.collectionsContainer}>
            {collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={styles.collectionCard}
                activeOpacity={0.9}>
                <Image source={{uri: collection.image}} style={styles.collectionImage} />
                <View style={styles.collectionOverlay}>
                  <View style={styles.collectionContent}>
                    <Text style={styles.collectionTitle}>{collection.title}</Text>
                    <Text style={styles.collectionSubtitle}>{collection.subtitle}</Text>
                    <View style={styles.collectionBadge}>
                      <Text style={styles.collectionCount}>{collection.count} lugares</Text>
                      <Ionicons name="arrow-forward" color="#ffffff" size={16} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, {backgroundColor: "#ec4899" + "15"}]}>
                <Ionicons name="calendar" color="#ec4899" size={24} />
              </View>
              <Text style={[styles.quickActionTitle, {color: colors.foreground}]}>
                Mis Reservas
              </Text>
              <Text style={[styles.quickActionSubtitle, {color: colors.mutedForeground}]}>
                Ver y gestionar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, {backgroundColor: "#8b5cf6" + "15"}]}>
                <Ionicons name="heart" color="#8b5cf6" size={24} />
              </View>
              <Text style={[styles.quickActionTitle, {color: colors.foreground}]}>Favoritos</Text>
              <Text style={[styles.quickActionSubtitle, {color: colors.mutedForeground}]}>
                Lugares guardados
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}
              onPress={() => router.push("/map")}>
              <View style={[styles.quickActionIcon, {backgroundColor: "#f97316" + "15"}]}>
                <Ionicons name="map" color="#f97316" size={24} />
              </View>
              <Text style={[styles.quickActionTitle, {color: colors.foreground}]}>
                Explorar Mapa
              </Text>
              <Text style={[styles.quickActionSubtitle, {color: colors.mutedForeground}]}>
                Vista completa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, {backgroundColor: "#10b981" + "15"}]}>
                <Ionicons name="gift" color="#10b981" size={24} />
              </View>
              <Text style={[styles.quickActionTitle, {color: colors.foreground}]}>Ofertas</Text>
              <Text style={[styles.quickActionSubtitle, {color: colors.mutedForeground}]}>
                Descuentos especiales
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // Featured/Hero Card
  featuredCard: {
    height: 420,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)",
    justifyContent: "space-between",
    padding: 20,
  },
  featuredBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  featuredBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  featuredContent: {
    marginTop: "auto",
  },
  featuredProvider: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
    marginBottom: 4,
  },
  featuredTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 34,
  },
  featuredSubtitle: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 16,
  },
  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredRatingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  featuredPrice: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },

  // Sections
  section: {
    marginTop: 32,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Categories
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 140,
  },
  categoryCardContent: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  categoryEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
  },

  // Near You
  nearYouScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  nearYouCard: {
    width: 140,
  },
  nearYouImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 12,
  },
  nearYouContent: {
    gap: 6,
  },
  nearYouName: {
    fontSize: 14,
    fontWeight: "600",
  },
  nearYouMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nearYouDistance: {
    fontSize: 12,
  },
  nearYouRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nearYouRatingText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Trending
  trendingScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  trendingCard: {
    width: 260,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },
  trendingImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  trendingGradient: {
    ...StyleSheet.absoluteFillObject,
    background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.9) 100%)",
    justifyContent: "flex-end",
  },
  trendingContent: {
    padding: 16,
  },
  trendingName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  trendingProvider: {
    color: "#ffffff",
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 12,
  },
  trendingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendingRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendingRatingText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  trendingPrice: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Collections
  collectionsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  collectionCard: {
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
  },
  collectionImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  collectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 100%)",
    justifyContent: "flex-end",
  },
  collectionContent: {
    padding: 20,
  },
  collectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  collectionSubtitle: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 12,
  },
  collectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collectionCount: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 13,
  },
});
