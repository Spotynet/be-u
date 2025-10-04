import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef} from "react";
import {useRouter} from "expo-router";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get("window");

export default function Explore() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Categorías con estilo scene+/Y2K minimalista y girlie
  const categories = [
    {
      id: "belleza",
      name: "Belleza",
      icon: "✨",
      color: "#FF69B4",
      gradient: ["#FFB6C1", "#FF69B4"],
      pattern: "stars",
    },
    {
      id: "wellness",
      name: "Wellness",
      icon: "🌸",
      color: "#DDA0DD",
      gradient: ["#E6B3E6", "#DDA0DD"],
      pattern: "flowers",
    },
    {
      id: "mascotas",
      name: "Pets",
      icon: "🐾",
      color: "#FFB347",
      gradient: ["#FFD700", "#FFB347"],
      pattern: "paws",
    },
  ];

  // Featured services con diseño más visual
  const featured = [
    {
      id: 1,
      title: "Facial LED Therapy",
      provider: "BE-U Spa",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=800&fit=crop",
      price: "$1,200",
      rating: 4.9,
      category: "belleza",
      tags: ["Trending", "Premium"],
    },
    {
      id: 2,
      title: "Yoga Session",
      provider: "Flow Studio",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=800&fit=crop",
      price: "$500",
      rating: 4.8,
      category: "wellness",
      tags: ["Popular"],
    },
    {
      id: 3,
      title: "Grooming Premium",
      provider: "Pet Spa",
      image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=800&fit=crop",
      price: "$600",
      rating: 4.7,
      category: "mascotas",
      tags: ["New"],
    },
  ];

  const filteredFeatured = selectedCategory
    ? featured.filter((item) => item.category === selectedCategory)
    : featured;

  const handleCategoryPress = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Explorar</Text>
          <View style={styles.headerActions}>
            {/* View Mode Toggle */}
            <View style={[styles.viewToggle, {backgroundColor: colors.muted}]}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === "list" && [
                    styles.toggleButtonActive,
                    {backgroundColor: colors.primary},
                  ],
                ]}
                onPress={() => setViewMode("list")}
                activeOpacity={0.7}>
                <Ionicons
                  name="list"
                  color={viewMode === "list" ? "#ffffff" : colors.mutedForeground}
                  size={18}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === "map" && [
                    styles.toggleButtonActive,
                    {backgroundColor: colors.primary},
                  ],
                ]}
                onPress={() => {
                  setViewMode("map");
                  router.push("/map");
                }}
                activeOpacity={0.7}>
                <Ionicons
                  name="map"
                  color={viewMode === "map" ? "#ffffff" : colors.mutedForeground}
                  size={18}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.iconButton, {backgroundColor: colors.muted}]}>
              <Ionicons name="heart-outline" color={colors.foreground} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar - Minimalista y redondeado */}
        <View
          style={[
            styles.searchBar,
            searchFocused && styles.searchBarFocused,
            {backgroundColor: colors.muted, borderColor: colors.primary},
          ]}>
          <Ionicons name="search" color={colors.mutedForeground} size={18} />
          <TextInput
            style={[styles.searchInput, {color: colors.foreground}]}
            placeholder="¿Qué buscas hoy?"
            placeholderTextColor={colors.mutedForeground}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchFocused && (
            <TouchableOpacity onPress={() => setSearchFocused(false)}>
              <Ionicons name="close-circle" color={colors.mutedForeground} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        {/* Scene+ Style Categories - Minimalistas y cute */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => {
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                    {
                      backgroundColor: isSelected ? category.color + "15" : colors.card,
                      borderColor: isSelected ? category.color : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(category.id)}>
                  <View
                    style={[styles.categoryIconWrapper, {backgroundColor: category.color + "20"}]}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    {isSelected && (
                      <View style={[styles.categoryCheckmark, {backgroundColor: category.color}]}>
                        <Ionicons name="checkmark" color="#ffffff" size={12} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      {color: isSelected ? category.color : colors.foreground},
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Búsqueda por tipo - Círculos estilo OpenTable */}
        <View style={styles.typesSection}>
          <View style={styles.typesSectionHeader}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Buscar por tipo</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, {color: colors.primary}]}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typesScroll}>
            {[
              {
                id: 1,
                name: "Facial",
                emoji: "✨",
                image:
                  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=200&fit=crop",
                color: "#FFB6C1",
              },
              {
                id: 2,
                name: "Cabello",
                emoji: "💇‍♀️",
                image:
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop",
                color: "#FF69B4",
              },
              {
                id: 3,
                name: "Yoga",
                emoji: "🧘‍♀️",
                image:
                  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop",
                color: "#DDA0DD",
              },
              {
                id: 4,
                name: "Masajes",
                emoji: "💆‍♀️",
                image:
                  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=200&fit=crop",
                color: "#E6B3E6",
              },
              {
                id: 5,
                name: "Mascotas",
                emoji: "🐾",
                image:
                  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop",
                color: "#FFB347",
              },
            ].map((type) => (
              <TouchableOpacity key={type.id} style={styles.typeCard} activeOpacity={0.8}>
                <View style={[styles.typeImageWrapper, {borderColor: type.color}]}>
                  <Image source={{uri: type.image}} style={styles.typeImage} />
                  <View style={[styles.typeEmojiBadge, {backgroundColor: type.color}]}>
                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  </View>
                </View>
                <Text style={[styles.typeName, {color: colors.foreground}]}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Discover Button - Estilo Tinder */}
        <View style={styles.discoverSection}>
          <TouchableOpacity
            style={[styles.discoverButton, {backgroundColor: "#FF69B4"}]}
            activeOpacity={0.9}
            onPress={() => router.push("/discover")}>
            <View style={styles.discoverContent}>
              <View style={styles.discoverIcon}>
                <Ionicons name="sparkles" color="#ffffff" size={28} />
              </View>
              <View style={styles.discoverText}>
                <Text style={styles.discoverTitle}>Descubre tu Match Perfecto</Text>
                <Text style={styles.discoverSubtitle}>
                  Desliza para explorar salones y profesionales
                </Text>
              </View>
              <View style={styles.discoverArrow}>
                <Ionicons name="arrow-forward" color="#ffffff" size={24} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Polaroid Style - Destacados */}
        <View style={styles.polaroidSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>✨ Destacados</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, {color: colors.primary}]}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.polaroidScroll}
            snapToInterval={SCREEN_WIDTH * 0.7 + 16}
            decelerationRate="fast">
            {filteredFeatured.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.polaroidCard,
                  {backgroundColor: colors.card},
                  index % 2 === 0
                    ? {transform: [{rotate: "2deg"}]}
                    : {transform: [{rotate: "-2deg"}]},
                ]}
                activeOpacity={0.95}>
                <View style={styles.polaroidImageWrapper}>
                  <Image source={{uri: item.image}} style={styles.polaroidImage} />
                  <TouchableOpacity
                    style={[styles.polaroidLikeButton, {backgroundColor: "#ffffff"}]}>
                    <Ionicons name="heart-outline" color="#FF69B4" size={20} />
                  </TouchableOpacity>
                  {item.tags[0] && (
                    <View style={[styles.polaroidBadge, {backgroundColor: "#FF69B4"}]}>
                      <Text style={styles.polaroidBadgeText}>{item.tags[0]}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.polaroidInfo}>
                  <Text style={[styles.polaroidProvider, {color: colors.mutedForeground}]}>
                    {item.provider}
                  </Text>
                  <Text
                    style={[styles.polaroidTitle, {color: colors.foreground}]}
                    numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.polaroidFooter}>
                    <View style={styles.polaroidRating}>
                      <Ionicons name="star" color="#FFD700" size={14} />
                      <Text style={[styles.polaroidRatingText, {color: colors.foreground}]}>
                        {item.rating}
                      </Text>
                    </View>
                    <Text style={[styles.polaroidPrice, {color: "#FF69B4"}]}>{item.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Explorar y Descubrir - Grid Visual */}
        <View style={styles.exploreSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>✨ Explorar</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, {color: colors.primary}]}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.exploreGrid}>
            {[
              {
                id: 1,
                title: "Lugares Cerca",
                subtitle: "Descubre espacios únicos",
                icon: "location",
                color: "#FF69B4",
                image:
                  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
                count: "24+ lugares",
              },
              {
                id: 2,
                title: "Profesionales",
                subtitle: "Encuentra expertos",
                icon: "people",
                color: "#DDA0DD",
                image:
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
                count: "50+ profesionales",
              },
              {
                id: 3,
                title: "Cuidado Mascotas",
                subtitle: "Para tus peluditos",
                icon: "paw",
                color: "#FFB347",
                image:
                  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
                count: "12+ servicios",
              },
              {
                id: 4,
                title: "Experiencias",
                subtitle: "Vive algo nuevo",
                icon: "sparkles",
                color: "#87CEEB",
                image:
                  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
                count: "18+ actividades",
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.exploreCard,
                  {backgroundColor: colors.card},
                  index % 2 === 0 ? styles.exploreCardLeft : styles.exploreCardRight,
                ]}
                activeOpacity={0.95}>
                <Image source={{uri: item.image}} style={styles.exploreCardImage} />
                <View style={[styles.exploreCardOverlay, {backgroundColor: item.color + "E6"}]}>
                  <View style={styles.exploreCardIcon}>
                    <Ionicons name={item.icon as any} color="#ffffff" size={28} />
                  </View>
                  <Text style={styles.exploreCardTitle}>{item.title}</Text>
                  <Text style={styles.exploreCardSubtitle}>{item.subtitle}</Text>
                  <View style={styles.exploreCardFooter}>
                    <Text style={styles.exploreCardCount}>{item.count}</Text>
                    <Ionicons name="arrow-forward" color="#ffffff" size={18} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  viewToggle: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 3,
  },
  toggleButton: {
    width: 36,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonActive: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 10,
  },
  searchBarFocused: {
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // Categories - Scene+ Style
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: "row",
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  categoryCardSelected: {
    borderWidth: 2,
  },
  categoryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryCheckmark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  // Types Section - Círculos estilo OpenTable
  typesSection: {
    marginBottom: 24,
  },
  typesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  typesScroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  typeCard: {
    alignItems: "center",
    width: 90,
  },
  typeImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    padding: 3,
    marginBottom: 8,
    position: "relative",
  },
  typeImage: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
    resizeMode: "cover",
  },
  typeEmojiBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  typeEmoji: {
    fontSize: 14,
  },
  typeName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  // Discover Section - Tinder Style
  discoverSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  discoverButton: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#FF69B4",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  discoverContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  discoverIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  discoverText: {
    flex: 1,
  },
  discoverTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  discoverSubtitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.9,
  },
  discoverArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Polaroid Style - Sin overlays negros
  polaroidSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
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
  polaroidImage: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    resizeMode: "cover",
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
  polaroidPrice: {
    fontSize: 20,
    fontWeight: "900",
  },

  // Explorar Grid - Categorías visuales
  exploreSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  exploreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  exploreCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  exploreCardLeft: {
    marginBottom: 12,
  },
  exploreCardRight: {
    marginBottom: 12,
  },
  exploreCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  exploreCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 60,
  },
  exploreCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  exploreCardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  exploreCardSubtitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.95,
    marginBottom: 12,
  },
  exploreCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exploreCardCount: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.9,
  },
});
