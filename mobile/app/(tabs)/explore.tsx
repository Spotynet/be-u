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
  ActivityIndicator,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {useRouter} from "expo-router";
import {providerApi} from "@/lib/api";
import {ProfessionalProfile, PlaceProfile} from "@/types/global";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get("window");

export default function Explore() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");

  // Real data states
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [places, setPlaces] = useState<PlaceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers function - Using mock data for now
  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔍 Loading providers (mock data)...");

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Import mock data dynamically
      const {mockProfessionals: mockProfs, mockPlaces: mockPls} = await import("@/lib/mockData");

      // Transform mock data to match expected format
      const transformedProfessionals = mockProfs.map((p) => ({
        id: p.id,
        user_id: p.id,
        email: `${p.name.toLowerCase()}@example.com`,
        name: p.name,
        last_name: p.last_name,
        bio: p.bio,
        city: p.city,
        rating: p.rating,
        services_count: p.services.length,
      }));

      const transformedPlaces = mockPls.map((p) => ({
        id: p.id,
        user_id: p.id,
        email: `${p.name.toLowerCase().replace(/\s/g, "")}@example.com`,
        name: p.name,
        street: p.address,
        city: p.city,
        country: p.country,
        services_count: p.services.length,
        address: p.address,
      }));

      console.log("✅ Loaded professionals:", transformedProfessionals.length);
      console.log("✅ Loaded places:", transformedPlaces.length);

      setProfessionals(transformedProfessionals);
      setPlaces(transformedPlaces);
    } catch (err: any) {
      console.error("❌ Error loading providers:", err);
      setError(err.message || "Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch providers on mount
  useEffect(() => {
    fetchProviders();
  }, []);

  // Categorías con estilo scene+/Y2K minimalista y girlie
  const categories = [
    {
      id: "lugares",
      name: "Lugares",
      icon: "🏢",
      color: "#FF6B6B",
      count: places.length,
      subtitle: "Descubre espacios únicos",
    },
    {
      id: "profesionales",
      name: "Profesionales",
      icon: "👥",
      color: "#B388FF",
      count: professionals.length,
      subtitle: "Encuentra expertos",
    },
    {
      id: "mascotas",
      name: "Cuidado Mascotas",
      icon: "🐾",
      color: "#FF8A65",
      count: "Próximamente",
      subtitle: "Para tus peluditos",
    },
  ];

  // Fetch providers on mount
  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      fetchProviders();
      return;
    }

    try {
      setIsLoading(true);
      const [professionalsRes, placesRes] = await Promise.all([
        providerApi.getProfessionalProfiles({search: query}),
        providerApi.getPlaceProfiles({search: query}),
      ]);

      setProfessionals(professionalsRes.data.results || []);
      setPlaces(placesRes.data.results || []);
    } catch (err: any) {
      console.error("Error searching:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to dedicated pages
    switch (categoryId) {
      case "lugares":
        router.push("/lugares");
        break;
      case "profesionales":
        router.push("/profesionales");
        break;
      case "mascotas":
        router.push("/cuidado-mascotas");
        break;
      default:
        break;
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
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                fetchProviders();
              }}>
              <Ionicons name="close-circle" color={colors.mutedForeground} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        {/* Category Cards - More Compact */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, {backgroundColor: category.color}]}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(category.id)}>
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                <Text style={styles.categoryCount}>
                  {typeof category.count === "number"
                    ? `${category.count} ${category.id}`
                    : category.count}
                </Text>
                <Ionicons name="arrow-forward" color="#ffffff" size={16} />
              </TouchableOpacity>
            ))}
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

        {/* Discover Button - Adopción de Mascotas */}
        <View style={styles.discoverSection}>
          <TouchableOpacity
            style={[styles.discoverButton, {backgroundColor: "#FFB347"}]}
            activeOpacity={0.9}
            onPress={() => router.push("/discover")}>
            <View style={styles.discoverContent}>
              <View style={styles.discoverIcon}>
                <Ionicons name="paw" color="#ffffff" size={28} />
              </View>
              <View style={styles.discoverText}>
                <Text style={styles.discoverTitle}>Encuentra tu Compañero Perfecto</Text>
                <Text style={styles.discoverSubtitle}>Adopta una mascota hoy</Text>
              </View>
              <View style={styles.discoverArrow}>
                <Ionicons name="arrow-forward" color="#ffffff" size={24} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Debug Info */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, {color: "#ef4444"}]}>Error: {error}</Text>
          </View>
        )}

        {/* Professionals Section */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
              Cargando profesionales y lugares...
            </Text>
          </View>
        ) : (
          <>
            {professionals.length > 0 && (
              <View style={styles.polaroidSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                    💅 Profesionales ({professionals.length})
                  </Text>
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
                        <View
                          style={[styles.polaroidImagePlaceholder, {backgroundColor: "#FFB6C1"}]}>
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

            {/* Places Section */}
            {places.length > 0 && (
              <View style={styles.polaroidSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
                    🏢 Establecimientos ({places.length})
                  </Text>
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
                        <View
                          style={[styles.polaroidImagePlaceholder, {backgroundColor: "#DDA0DD"}]}>
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
          </>
        )}

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
                title: "Lugares",
                subtitle: "Descubre espacios únicos",
                icon: "location",
                color: "#FF69B4",
                image:
                  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
                count: `${places.length} lugares`,
              },
              {
                id: 2,
                title: "Profesionales",
                subtitle: "Encuentra expertos",
                icon: "people",
                color: "#DDA0DD",
                image:
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
                count: `${professionals.length} profesionales`,
              },
              {
                id: 3,
                title: "Cuidado Mascotas",
                subtitle: "Para tus peluditos",
                icon: "paw",
                color: "#FFB347",
                image:
                  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
                count: "Próximamente",
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.exploreCard,
                  {backgroundColor: colors.card},
                  index % 2 === 0 ? styles.exploreCardLeft : styles.exploreCardRight,
                ]}
                activeOpacity={0.95}
                onPress={() => {
                  switch (item.id) {
                    case 1:
                      router.push("/lugares");
                      break;
                    case 2:
                      router.push("/profesionales");
                      break;
                    case 3:
                      router.push("/cuidado-mascotas");
                      break;
                    default:
                      break;
                  }
                }}>
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
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    minHeight: 110,
    gap: 4,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  categorySubtitle: {
    fontSize: 9,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 11,
  },
  categoryCount: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
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
  polaroidBio: {
    fontSize: 13,
    marginTop: 4,
  },
  polaroidServicesCount: {
    fontSize: 14,
    fontWeight: "700",
  },
  polaroidAddress: {
    fontSize: 13,
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  errorContainer: {
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
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
