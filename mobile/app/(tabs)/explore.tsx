import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {useRouter} from "expo-router";
import {ProfessionalProfile, PlaceProfile} from "@/types/global";
import {SubCategoryBar} from "@/components/ui/SubCategoryBar";
import {providerApi} from "@/lib/api";
import {errorUtils} from "@/lib/api";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function Explore() {
  const colorScheme = useColorScheme();
  const {colors, setVariant} = useThemeVariant();
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("todos");
  const [selectedCategory, setSelectedCategory] = useState<"belleza" | "cuidado" | "mascotas">(
    "belleza"
  );
  const [isCategoryPickerExpanded, setIsCategoryPickerExpanded] = useState(false);

  const categories = [
    {id: "belleza", emoji: "💅", name: "Belleza"},
    {id: "cuidado", emoji: "❤️", name: "Cuidado"},
    {id: "mascotas", emoji: "🐾", name: "Mascotas"},
  ];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Real data states
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [places, setPlaces] = useState<PlaceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers from API
  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔍 Fetching providers from API...");

      // Fetch both professionals and places in parallel
      const [professionalsResponse, placesResponse] = await Promise.all([
        providerApi.getProfessionalProfiles({
          page: 1,
          page_size: 20,
        }),
        providerApi.getPlaceProfiles({
          page: 1,
          page_size: 20,
        }),
      ]);

      console.log(
        "🔍 Raw professionals response:",
        JSON.stringify(professionalsResponse.data, null, 2)
      );
      console.log("🔍 Raw places response:", JSON.stringify(placesResponse.data, null, 2));

      // Transform professionals data
      const professionalsData = professionalsResponse.data.results || [];
      const transformedProfessionals = professionalsData.map((prof: any, index: number) => ({
        id: `prof_${index}_${Date.now()}`, // Ensure completely unique ID
        user_id: prof.user?.id || prof.id,
        email: prof.user?.email || "",
        name: prof.user?.first_name || prof.name || `Profesional ${index + 1}`,
        last_name: prof.user?.last_name || prof.last_name || "",
        bio: prof.bio || prof.user?.bio || `Profesional especializado en belleza ${index + 1}`,
        city: prof.city || prof.user?.city || "Ciudad no especificada",
        rating:
          typeof prof.rating === "number" ? prof.rating : Number(prof.rating) || 4.0 + index * 0.1,
        services_count: prof.services_count || 0,
        type: "professional",
        // Add mock coordinates for map display
        coordinates: {
          top: `${25 + ((index * 15) % 50)}%`,
          left: `${20 + ((index * 20) % 60)}%`,
        },
        avatar: "💇‍♀️",
        distance: `${(0.5 + index * 0.3).toFixed(1)} km`,
      }));

      // Transform places data
      const placesData = placesResponse.data.results || [];
      const transformedPlaces = placesData.map((place: any, index: number) => ({
        id: `place_${index}_${Date.now()}`, // Ensure completely unique ID
        user_id: place.id,
        email: "",
        name: place.name || `Lugar ${index + 1}`,
        last_name: "", // Places don't have last names
        street: place.street || place.address,
        city: place.city || "Ciudad no especificada",
        country: place.country || "México",
        services_count: place.services_count || 0,
        address: place.street || place.address || "Dirección no disponible",
        bio: place.bio || place.description || `Descripción del lugar ${index + 1}`,
        rating: place.rating || 4.0 + index * 0.1, // Mock rating for places
        type: "place",
        // Add mock coordinates for map display
        coordinates: {
          top: `${30 + ((index * 18) % 45)}%`,
          left: `${25 + ((index * 25) % 55)}%`,
        },
        avatar: "🏢",
        distance: `${(0.6 + index * 0.4).toFixed(1)} km`,
      }));

      console.log(
        "🔍 Transformed professionals:",
        transformedProfessionals.map((p) => ({id: p.id, name: p.name, type: p.type}))
      );
      console.log(
        "🔍 Transformed places:",
        transformedPlaces.map((p) => ({id: p.id, name: p.name, type: p.type}))
      );

      console.log("🔍 Setting professionals:", transformedProfessionals.length);
      console.log("🔍 Setting places:", transformedPlaces.length);

      // Add mock data if API returns empty results
      if (transformedProfessionals.length === 0) {
        console.log("🔍 No professionals found, adding mock data");
        const mockProfessionals = [
          {
            id: `mock_prof_0_${Date.now()}`,
            user_id: 1,
            email: "ana@example.com",
            name: "Ana",
            last_name: "López",
            bio: "Estilista profesional con 10 años de experiencia",
            city: "Ciudad de México",
            rating: 4.9,
            services_count: 5,
            type: "professional",
            coordinates: {top: "30%", left: "40%"},
            avatar: "💇‍♀️",
            distance: "0.5 km",
          },
          {
            id: `mock_prof_1_${Date.now()}`,
            user_id: 2,
            email: "maria@example.com",
            name: "María",
            last_name: "García",
            bio: "Especialista en uñas y cuidado personal",
            city: "Ciudad de México",
            rating: 4.7,
            services_count: 3,
            type: "professional",
            coordinates: {top: "45%", left: "60%"},
            avatar: "💅",
            distance: "0.8 km",
          },
        ];
        setProfessionals(mockProfessionals);
      } else {
        setProfessionals(transformedProfessionals);
      }

      if (transformedPlaces.length === 0) {
        console.log("🔍 No places found, adding mock data");
        const mockPlaces = [
          {
            id: `mock_place_0_${Date.now()}`,
            user_id: 3,
            email: "",
            name: "Salón de Belleza Luna",
            last_name: "",
            bio: "Salón especializado en tratamientos faciales y corporales",
            city: "Ciudad de México",
            rating: 4.8,
            services_count: 8,
            type: "place",
            coordinates: {top: "35%", left: "25%"},
            avatar: "🏢",
            distance: "1.2 km",
          },
          {
            id: `mock_place_1_${Date.now()}`,
            user_id: 4,
            email: "",
            name: "Centro de Estética Moderna",
            last_name: "",
            bio: "Centro de estética con tecnología de vanguardia",
            city: "Ciudad de México",
            rating: 4.6,
            services_count: 12,
            type: "place",
            coordinates: {top: "50%", left: "70%"},
            avatar: "🏢",
            distance: "1.5 km",
          },
        ];
        setPlaces(mockPlaces);
      } else {
        setPlaces(transformedPlaces);
      }

      // Log the first few items to verify data structure
      console.log("🔍 First professional:", transformedProfessionals[0]);
      console.log("🔍 First place:", transformedPlaces[0]);
    } catch (err: any) {
      console.error("❌ Error loading providers:", {
        message: err.message,
        code: err.code,
        status: err.status,
        response: err.response?.data,
        stack: err.stack,
      });

      // Provide more specific error messages
      let errorMessage = "Error al cargar los datos";
      if (err.message?.includes("Network Error")) {
        errorMessage = "Error de conexión. Verifica tu internet e intenta de nuevo.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Tiempo de espera agotado. Intenta de nuevo.";
      } else if (err.status === 404) {
        errorMessage = "Servicio no encontrado. Contacta soporte.";
      } else if (err.status >= 500) {
        errorMessage = "Error del servidor. Intenta más tarde.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debug environment variables
    console.log("🔧 Explore Page Environment:", {
      EXPO_PUBLIC_API_URL: "https://stg.be-u.ai/api",
      NODE_ENV: process.env.NODE_ENV,
    });

    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedItem]);

  const mapItems = [...professionals, ...places];
  const selectedItemData = mapItems.find((item: any) => item.id === selectedItem);

  if (selectedItem) {
    console.log("🔍 Looking for selected item ID:", selectedItem);
    console.log("🔍 Found selected item data:", JSON.stringify(selectedItemData, null, 2));
    console.log(
      "🔍 All available items:",
      mapItems.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        last_name: item.last_name,
      }))
    );
    console.log("🔍 Professionals count:", professionals.length);
    console.log("🔍 Places count:", places.length);
    console.log("🔍 Total mapItems count:", mapItems.length);
  }

  const filteredItems = mapItems.filter((item: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.last_name?.toLowerCase().includes(searchLower) ||
      item.city?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Explorar</Text>
          <Text style={[styles.headerSubtitle, {color: colors.mutedForeground}]}>
            {filteredItems.length} lugares cerca
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.categorySelector}>
            {/* Collapsed State - Single Button */}
            {!isCategoryPickerExpanded && (
              <TouchableOpacity
                style={[styles.categoryButton, {backgroundColor: colors.card}]}
                onPress={() => setIsCategoryPickerExpanded(true)}>
                <Text style={[styles.categoryButtonText, {color: colors.foreground}]}>
                  {categories.find((cat) => cat.id === selectedCategory)?.emoji}
                </Text>
              </TouchableOpacity>
            )}

            {/* Expanded State - Horizontal Options */}
            {isCategoryPickerExpanded && (
              <View style={[styles.expandedCategoryOptions, {backgroundColor: colors.card}]}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.expandedCategoryOption,
                      selectedCategory === category.id && styles.selectedCategoryOption,
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.id as "belleza" | "cuidado" | "mascotas");
                      setVariant(category.id as any);
                      setIsCategoryPickerExpanded(false);
                    }}>
                    <Text style={styles.expandedCategoryEmoji}>{category.emoji}</Text>
                    {selectedCategory === category.id && (
                      <Text style={[styles.expandedCategoryText, {color: colors.primary}]}>
                        {category.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.locationButton, {backgroundColor: colors.primary}]}>
            <Ionicons name="navigate" color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub Category Bar */}
      <View style={styles.subCategoryContainer}>
        <SubCategoryBar
          categories={[
            {id: "todos", name: "Todos", icon: "apps"},
            {id: "manicure", name: "Manicure & Pedicure", icon: "hand-left"},
            {id: "maquillaje", name: "Make Up", icon: "brush"},
            {id: "barberia", name: "Barbería", icon: "cut"},
            {id: "facial", name: "Facial", icon: "flower"},
            {id: "masaje", name: "Masaje", icon: "fitness"},
          ]}
          selectedCategoryId={selectedSubCategory}
          onCategorySelect={setSelectedSubCategory}
          showLabels={true}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, {backgroundColor: colors.card}]}>
          <Ionicons name="search" color={colors.mutedForeground} size={18} />
          <TextInput
            style={[styles.searchInput, {color: colors.foreground}]}
            placeholder="Buscar profesionales y lugares..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" color={colors.mutedForeground} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map Area */}
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={() => setIsListExpanded(!isListExpanded)}
        activeOpacity={1}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
              Cargando mapa...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" color="#ef4444" size={64} />
            <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
            <Text style={[styles.errorText, {color: colors.mutedForeground}]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, {backgroundColor: colors.primary}]}
              onPress={() => {
                fetchProviders();
              }}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Map Background */}
            <View style={[styles.mapBackground, {backgroundColor: colors.muted}]}>
              {/* Grid pattern */}
              <View style={styles.mapGrid}>
                {[...Array(8)].map((_, i) => (
                  <View
                    key={`v${i}`}
                    style={[styles.gridLineVertical, {left: `${(i + 1) * 12.5}%`}]}
                  />
                ))}
                {[...Array(8)].map((_, i) => (
                  <View
                    key={`h${i}`}
                    style={[styles.gridLineHorizontal, {top: `${(i + 1) * 12.5}%`}]}
                  />
                ))}
              </View>

              {/* User Location */}
              <View style={styles.userLocation}>
                <View style={[styles.userPulse, {backgroundColor: colors.primary}]} />
                <View style={[styles.userDot, {backgroundColor: colors.primary}]}>
                  <View style={styles.userDotInner} />
                </View>
              </View>

              {/* Map Pins */}
              <View style={styles.pinsContainer}>
                {filteredItems.map((item: any) => {
                  const isSelected = selectedItem === item.id;
                  return (
                    <Animated.View
                      key={item.id}
                      style={[
                        styles.pinWrapper,
                        {
                          top: item.coordinates.top,
                          left: item.coordinates.left,
                          transform: [{scale: isSelected ? scaleAnim : 1}],
                        },
                      ]}>
                      <TouchableOpacity
                        style={[
                          styles.pin,
                          isSelected && styles.pinSelected,
                          {
                            backgroundColor: isSelected ? colors.primary : "#ffffff",
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => {
                          console.log("📍 Pin clicked - Item:", {
                            id: item.id,
                            name: item.name,
                            type: item.type,
                          });
                          setSelectedItem(isSelected ? null : item.id);
                        }}
                        activeOpacity={0.9}>
                        <Text style={styles.pinAvatar}>{item.avatar}</Text>
                      </TouchableOpacity>

                      {/* Name Label */}
                      {isSelected && (
                        <View style={[styles.pinLabel, {backgroundColor: colors.primary}]}>
                          <Text style={styles.pinLabelText}>
                            {item.type === "professional"
                              ? `${item.name} ${item.last_name}`
                              : item.name}
                          </Text>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            {/* Legend */}
            <View style={[styles.legend, {backgroundColor: colors.card}]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
                <Text style={[styles.legendText, {color: colors.foreground}]}>Tú</Text>
              </View>
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* Bottom Sheet - List of Items */}
      {!selectedItem && !isLoading && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {backgroundColor: colors.background},
            isListExpanded && styles.bottomSheetExpanded,
          ]}>
          <TouchableOpacity
            style={styles.sheetHandle}
            onPress={() => setIsListExpanded(!isListExpanded)}
            activeOpacity={0.7}
          />
          <Text style={[styles.sheetTitle, {color: colors.foreground}]}>
            Cerca de ti ({filteredItems.length})
          </Text>
          {isListExpanded && (
            <Text style={[styles.sheetSubtitle, {color: colors.mutedForeground}]}>
              Toca el mapa para colapsar
            </Text>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.itemsListVertical,
              isListExpanded && styles.itemsListExpanded,
            ]}>
            {filteredItems.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCardVertical, {backgroundColor: colors.card}]}
                onPress={() => {
                  console.log("📋 List item clicked - Item:", {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                  });
                  setSelectedItem(item.id);
                }}
                activeOpacity={0.95}>
                <View style={[styles.itemAvatarVertical, {backgroundColor: colors.primary}]}>
                  <Text style={styles.itemAvatarTextVertical}>
                    {item.type === "professional"
                      ? `${item.name[0]}${item.last_name[0]}`
                      : item.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.itemInfoVertical}>
                  <Text
                    style={[styles.itemNameVertical, {color: colors.foreground}]}
                    numberOfLines={1}>
                    {item.type === "professional" ? `${item.name} ${item.last_name}` : item.name}
                  </Text>
                  <View style={styles.itemMetaVertical}>
                    {typeof item.rating !== "undefined" && (
                      <View style={styles.itemRatingVertical}>
                        <Ionicons name="star" color="#FFD700" size={12} />
                        <Text style={[styles.itemRatingTextVertical, {color: colors.foreground}]}>
                          {Number(item.rating || 0).toFixed(1)}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.itemDistanceVertical, {color: colors.mutedForeground}]}>
                      {item.distance}
                    </Text>
                    {item.type === "professional" && (
                      <View style={[styles.itemTypeBadge, {backgroundColor: "#FFB6C1"}]}>
                        <Text style={styles.itemTypeText}>💅 Profesional</Text>
                      </View>
                    )}
                    {item.type === "place" && (
                      <View style={[styles.itemTypeBadge, {backgroundColor: "#DDA0DD"}]}>
                        <Text style={styles.itemTypeText}>🏢 Lugar</Text>
                      </View>
                    )}
                  </View>
                  {item.bio && (
                    <Text
                      style={[styles.itemBioVertical, {color: colors.mutedForeground}]}
                      numberOfLines={2}>
                      {item.bio}
                    </Text>
                  )}
                  {item.address && (
                    <Text
                      style={[styles.itemAddressVertical, {color: colors.mutedForeground}]}
                      numberOfLines={1}>
                      <Ionicons name="location" size={12} color={colors.mutedForeground} />{" "}
                      {item.address}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Detail Sheet - Selected Item */}
      {selectedItemData && (
        <Animated.View
          style={[
            styles.detailSheet,
            {backgroundColor: colors.background, transform: [{scale: scaleAnim}]},
          ]}>
          <View style={styles.sheetHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[styles.detailCard, {backgroundColor: colors.card}]}>
              {/* Header */}
              <View style={styles.detailHeader}>
                <View style={[styles.detailAvatar, {backgroundColor: colors.primary}]}>
                  <Text style={styles.detailAvatarText}>
                    {selectedItemData.type === "professional"
                      ? `${selectedItemData.name[0]}${selectedItemData.last_name[0]}`
                      : selectedItemData.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailName, {color: colors.foreground}]}>
                    {selectedItemData.type === "professional"
                      ? `${selectedItemData.name} ${selectedItemData.last_name}`
                      : selectedItemData.name}
                  </Text>
                  <View style={styles.detailMeta}>
                    {selectedItemData.rating && (
                      <View style={styles.detailRating}>
                        <Ionicons name="star" color="#FFD700" size={14} />
                        <Text style={[styles.detailRatingText, {color: colors.foreground}]}>
                          {selectedItemData.rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.detailDot, {color: colors.mutedForeground}]}>•</Text>
                    <Text style={[styles.detailDistance, {color: colors.mutedForeground}]}>
                      {selectedItemData.distance}
                    </Text>
                    {selectedItemData.type === "professional" && (
                      <View style={[styles.detailTypeBadge, {backgroundColor: "#FFB6C1"}]}>
                        <Text style={styles.detailTypeText}>💅 Profesional</Text>
                      </View>
                    )}
                    {selectedItemData.type === "place" && (
                      <View style={[styles.detailTypeBadge, {backgroundColor: "#DDA0DD"}]}>
                        <Text style={styles.detailTypeText}>🏢 Lugar</Text>
                      </View>
                    )}
                  </View>
                  {selectedItemData.bio && (
                    <Text
                      style={[styles.detailBio, {color: colors.mutedForeground}]}
                      numberOfLines={2}>
                      {selectedItemData.bio}
                    </Text>
                  )}
                  {selectedItemData.address && (
                    <Text
                      style={[styles.detailAddress, {color: colors.mutedForeground}]}
                      numberOfLines={2}>
                      <Ionicons name="location" size={12} color={colors.mutedForeground} />{" "}
                      {selectedItemData.address}
                    </Text>
                  )}
                </View>
              </View>

              {/* Quick Info */}
              <View style={styles.detailQuickInfo}>
                <View style={[styles.quickInfoItem, {backgroundColor: colors.muted}]}>
                  <Ionicons name="briefcase" color={colors.primary} size={16} />
                  <Text style={[styles.quickInfoText, {color: colors.foreground}]}>
                    {selectedItemData.services_count} servicios
                  </Text>
                </View>
                {selectedItemData.city && (
                  <View style={[styles.quickInfoItem, {backgroundColor: colors.muted}]}>
                    <Ionicons name="location" color={colors.primary} size={16} />
                    <Text style={[styles.quickInfoText, {color: colors.foreground}]}>
                      {selectedItemData.city}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionPrimary, {backgroundColor: colors.primary}]}
                  onPress={() =>
                    router.push(
                      selectedItemData.type === "professional"
                        ? `/professional/${selectedItemData.id}`
                        : `/place/${selectedItemData.id}`
                    )
                  }
                  activeOpacity={0.9}>
                  <Ionicons name="eye" color="#ffffff" size={18} />
                  <Text style={styles.detailActionPrimaryText}>Ver Detalles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionSecondary, {borderColor: colors.border}]}
                  activeOpacity={0.9}>
                  <Ionicons name="navigate" color={colors.primary} size={18} />
                  <Text style={[styles.detailActionSecondaryText, {color: colors.primary}]}>
                    Ir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionIcon, {borderColor: colors.border}]}
                  activeOpacity={0.9}>
                  <Ionicons name="heart-outline" color={colors.foreground} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedItem(null)}
            activeOpacity={0.9}>
            <Ionicons name="close" color={colors.mutedForeground} size={24} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  subCategoryContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapBackground: {
    flex: 1,
    position: "relative",
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineVertical: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  gridLineHorizontal: {
    position: "absolute",
    height: 1,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  userLocation: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{translateX: -20}, {translateY: -20}],
  },
  userPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.2,
  },
  userDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  pinsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  pinWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  pin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  pinSelected: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
  },
  pinAvatar: {
    fontSize: 28,
  },
  pinLabel: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pinLabelText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  legend: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: 200,
  },
  bottomSheetExpanded: {
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  itemsListVertical: {
    gap: 12,
    paddingBottom: 20,
  },
  itemsListExpanded: {
    maxHeight: 400,
  },
  itemCardVertical: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemAvatarVertical: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  itemAvatarTextVertical: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  itemInfoVertical: {
    flex: 1,
    gap: 4,
  },
  itemNameVertical: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  itemMetaVertical: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  itemRatingVertical: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemRatingTextVertical: {
    fontSize: 13,
    fontWeight: "700",
  },
  itemDistanceVertical: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  itemBioVertical: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  itemAddressVertical: {
    fontSize: 12,
    marginTop: 2,
  },
  detailSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: "70%",
  },
  detailCard: {
    borderRadius: 20,
    padding: 16,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  detailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  detailAvatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  detailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  detailRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailRatingText: {
    fontSize: 14,
    fontWeight: "700",
  },
  detailDot: {
    fontSize: 12,
  },
  detailDistance: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  detailBio: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailAddress: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailQuickInfo: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  quickInfoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
  },
  detailActionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  detailActionPrimaryText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  detailActionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  detailActionSecondaryText: {
    fontSize: 15,
    fontWeight: "800",
  },
  detailActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
});
