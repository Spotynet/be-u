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
import {SafeMapView, Region} from "@/components/map/SafeMapView";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAppTheme} from "@/constants/theme";
import {useCategory} from "@/contexts/CategoryContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {useState, useRef, useEffect} from "react";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {ProfessionalProfile, PlaceProfile} from "@/types/global";
import {SubCategoryBar} from "@/components/ui/SubCategoryBar";
import {providerApi} from "@/lib/api";
import {getAvatarColorFromSubcategory} from "@/constants/categories";
import {getCurrentLocation, calculateDistance} from "@/lib/googleMaps";
import {ProviderMarker} from "@/components/map/ProviderMarker";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

type MapItem = (ProfessionalProfile | PlaceProfile) & {
  type: "professional" | "place";
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  address?: string;
  profile_type?: "PROFESSIONAL" | "PLACE";
  photo?: string;
};

export default function Explore() {
  const {colors} = useThemeVariant();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    selectedMainCategory,
    setSelectedMainCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    subcategoriesByMainCategory,
  } = useCategory();
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [radiusKm] = useState(10);


  // Keep Mascotas logic in codebase, but hide it from the UI for now.
  const ALL_CATEGORIES = [
    {id: "belleza", name: "Belleza"},
    {id: "bienestar", name: "Bienestar"},
    {id: "mascotas", name: "Mascotas"},
  ] as const;
  const categories = ALL_CATEGORIES.filter((c) => c.id !== "mascotas");

  useEffect(() => {
    // If user had Mascotas selected previously, force a visible category.
    if (selectedMainCategory === "mascotas") {
      setSelectedMainCategory("belleza");
      setSelectedSubCategory("todos");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Real data states
  const [professionals, setProfessionals] = useState<MapItem[]>([]);
  const [places, setPlaces] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers from API
  const fetchProviders = async (coords?: {latitude: number; longitude: number}) => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchAllPages = async (page = 1, acc: any[] = []): Promise<any[]> => {
        const response = await providerApi.getPublicProfiles({
          page,
          page_size: 50,
          ...(coords ? {latitude: coords.latitude, longitude: coords.longitude, radius: radiusKm} : {}),
        } as any);
        const results = response.data.results || [];
        const next = response.data.next;
        const merged = [...acc, ...results];
        if (next && page < 10) {
          return fetchAllPages(page + 1, merged);
        }
        return merged;
      };

      const allProfiles = await fetchAllPages();
      const transformProfile = (profile: any, index: number): MapItem => {
        const latitude = profile.latitude != null ? Number(profile.latitude) : undefined;
        const longitude = profile.longitude != null ? Number(profile.longitude) : undefined;
        const distanceFromApi =
          typeof profile.distance === "number" ? profile.distance : Number(profile.distance) || undefined;
        const distanceComputed =
          coords && latitude != null && longitude != null
            ? calculateDistance(coords.latitude, coords.longitude, latitude, longitude)
            : undefined;
        const distance_km = distanceFromApi ?? distanceComputed;

        return {
          id: profile.id,
          user_id: profile.user,
          email: profile.user_email || "",
          name: profile.name || `Proveedor ${index + 1}`,
          bio: profile.bio || profile.description || "",
          city: profile.city || "Ciudad no especificada",
          rating: typeof profile.rating === "number" ? profile.rating : Number(profile.rating) || 0,
          services_count: 0,
          type: profile.profile_type === "PLACE" ? "place" : "professional",
          profile_type: profile.profile_type,
          category: profile.category,
          sub_categories: profile.sub_categories || [],
          images: profile.images || [],
          has_calendar: profile.has_calendar || false,
          photo: profile.user_image,
          street: profile.street,
          postal_code: profile.postal_code,
          number_ext: profile.number_ext,
          number_int: profile.number_int,
          country: profile.country,
          address: profile.street || profile.address || "",
          latitude,
          longitude,
          distance_km,
        } as MapItem;
      };

      const transformed = allProfiles.map(transformProfile);
      setProfessionals(transformed.filter((p) => p.profile_type === "PROFESSIONAL"));
      setPlaces(transformed.filter((p) => p.profile_type === "PLACE"));
    } catch (err: any) {
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

  const loadInitialLocation = async () => {
    const current = await getCurrentLocation();
    if (current) {
      setUserLocation({latitude: current.latitude, longitude: current.longitude});
      setMapRegion({
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      });
    }
    if (useLocationFilter && current) {
      fetchProviders({latitude: current.latitude, longitude: current.longitude});
    } else {
      fetchProviders();
    }
  };

  const toggleNearMe = async () => {
    if (useLocationFilter) {
      setUseLocationFilter(false);
      fetchProviders();
      return;
    }
    const current = await getCurrentLocation();
    if (!current) {
      setError("No se pudo obtener tu ubicación");
      return;
    }
    setUseLocationFilter(true);
    setUserLocation({latitude: current.latitude, longitude: current.longitude});
    setMapRegion({
      latitude: current.latitude,
      longitude: current.longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    });
    fetchProviders({latitude: current.latitude, longitude: current.longitude});
  };

  useEffect(() => {
    loadInitialLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      item.city?.toLowerCase().includes(searchLower)
    );
  });

  const getDistanceLabel = (item: any) => {
    if (typeof item.distance_km === "number") {
      return `${item.distance_km.toFixed(1)} km`;
    }
    if (typeof item.distance === "string") return item.distance;
    return "";
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 16, backgroundColor: colors.primary}]}>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: theme.white}]}>Explorar</Text>
          <Text style={[styles.headerSubtitle, {color: "rgba(255, 255, 255, 0.7)"}]}>
            {filteredItems.length} lugares cerca
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.categorySelector}>
            {/* Always Expanded - Horizontal Options */}
            <View style={[styles.expandedCategoryOptions, {backgroundColor: "rgba(255, 255, 255, 0.1)"}]}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.expandedCategoryOption,
                    selectedMainCategory === category.id && {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                    },
                  ]}
                  onPress={() => {
                    setSelectedMainCategory(category.id as "belleza" | "bienestar" | "mascotas");
                  }}>
                  {getCategoryIcon(
                    category.id,
                    theme.white,
                    24
                  )}
                  <Text
                    style={[
                      styles.expandedCategoryText,
                      {
                        color: theme.white,
                      },
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.nearMeButton,
              {backgroundColor: useLocationFilter ? colors.accent : "rgba(255, 255, 255, 0.1)"},
            ]}
            onPress={toggleNearMe}>
            <Ionicons
              name="locate-outline"
              color={useLocationFilter ? colors.accentForeground : theme.white}
              size={18}
            />
            <Text
              style={[
                styles.nearMeText,
                {color: useLocationFilter ? colors.accentForeground : theme.white},
              ]}>
              Cerca de mí
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub Category Bar */}
      <View style={styles.subCategoryContainer}>
        <SubCategoryBar
          categories={subcategoriesByMainCategory[selectedMainCategory]}
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
      <View style={styles.mapContainer}>
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
                if (useLocationFilter && userLocation) {
                  fetchProviders(userLocation);
                } else {
                  fetchProviders();
                }
              }}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SafeMapView
              style={styles.map}
              region={
                mapRegion ?? {
                  latitude: 19.4326,
                  longitude: -99.1332,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }
              }
              onRegionChangeComplete={setMapRegion}
              showsUserLocation={!!userLocation}
              showsMyLocationButton={false}>
              {filteredItems
                .filter((item: any) => typeof item.latitude === "number" && typeof item.longitude === "number")
                .map((item: any) => {
                  const isSelected = selectedItem === item.id;
                  return (
                    <ProviderMarker
                      key={item.id}
                      id={item.id}
                      name={item.name || (item.type === "professional" ? "Profesional" : "Lugar")}
                      profileType={item.profile_type || (item.type === "place" ? "PLACE" : "PROFESSIONAL")}
                      latitude={Number(item.latitude)}
                      longitude={Number(item.longitude)}
                      onPress={() => setSelectedItem(isSelected ? null : item.id)}
                    />
                  );
                })}
            </SafeMapView>

            <View style={[styles.legend, {backgroundColor: colors.card}]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
                <Text style={[styles.legendText, {color: colors.foreground}]}>Tú</Text>
              </View>
            </View>
          </>
        )}
      </View>

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
            showsVerticalScrollIndicator={true}
            contentContainerStyle={[
              styles.itemsListVertical,
              isListExpanded && styles.itemsListExpanded,
              {paddingBottom: 20},
            ]}
            nestedScrollEnabled={true}>
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
                <View
                  style={[
                    styles.itemAvatarVertical,
                    {
                      backgroundColor: getAvatarColorFromSubcategory(
                        item.category,
                        item.sub_categories
                      ),
                    },
                  ]}>
                  {item.photo ? (
                    <Image source={{uri: item.photo}} style={styles.itemAvatarImageVertical} />
                  ) : (
                    <Text style={styles.itemAvatarTextVertical}>
                      {(item.name || (item.type === "professional" ? "P" : "L"))
                        .substring(0, 2)
                        .toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.itemInfoVertical}>
                  <Text
                    style={[styles.itemNameVertical, {color: colors.foreground}]}
                    numberOfLines={1}>
                    {item.name || (item.type === "professional" ? "Profesional" : "Lugar")}
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
                    {getDistanceLabel(item) ? (
                      <Text style={[styles.itemDistanceVertical, {color: colors.mutedForeground}]}>
                        {getDistanceLabel(item)}
                      </Text>
                    ) : null}
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
                <View
                  style={[
                    styles.detailAvatar,
                    {
                      backgroundColor: getAvatarColorFromSubcategory(
                        selectedItemData.category,
                        selectedItemData.sub_categories
                      ),
                    },
                  ]}>
                  <Text style={styles.detailAvatarText}>
                    {(selectedItemData.name ||
                      (selectedItemData.type === "professional" ? "P" : "L"))
                      .substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailName, {color: colors.foreground}]}>
                    {selectedItemData.name ||
                      (selectedItemData.type === "professional" ? "Profesional" : "Lugar")}
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
                    {getDistanceLabel(selectedItemData) ? (
                      <Text style={[styles.detailDistance, {color: colors.mutedForeground}]}>
                        {getDistanceLabel(selectedItemData)}
                      </Text>
                    ) : null}
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
                  onPress={() => router.push(`/profile/${selectedItemData.id}`)}
                  activeOpacity={0.9}>
                  <Ionicons name="eye" color={theme.white} size={18} />
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

