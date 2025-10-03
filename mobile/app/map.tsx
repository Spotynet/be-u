import {View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {useRouter} from "expo-router";
import {MAIN_CATEGORIES, getCategoryEmoji} from "@/constants/categories";

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [selectedSalon, setSelectedSalon] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const salons = [
    // Belleza
    {
      id: 1,
      name: "BE-U Spa Premium",
      category: "belleza",
      rating: 4.8,
      distance: "0.5 km",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop",
      price: "Desde $800",
      coordinates: {top: "30%", left: "25%"},
      isFavorite: true,
    },
    {
      id: 2,
      name: "BE-U Hair Studio",
      category: "belleza",
      rating: 4.9,
      distance: "1.2 km",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=200&fit=crop",
      price: "Desde $600",
      coordinates: {top: "45%", left: "60%"},
      isFavorite: false,
    },
    {
      id: 3,
      name: "BE-U Beauty Bar",
      category: "belleza",
      rating: 4.7,
      distance: "0.8 km",
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=200&fit=crop",
      price: "Desde $500",
      coordinates: {top: "55%", left: "35%"},
      isFavorite: true,
    },
    // Wellness
    {
      id: 4,
      name: "Zen Wellness Center",
      category: "wellness",
      rating: 4.9,
      distance: "1.5 km",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=200&fit=crop",
      price: "Desde $1,200",
      coordinates: {top: "25%", left: "70%"},
      isFavorite: false,
    },
    {
      id: 5,
      name: "Flow Yoga Studio",
      category: "wellness",
      rating: 4.8,
      distance: "0.9 km",
      image: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=200&fit=crop",
      price: "Desde $300",
      coordinates: {top: "65%", left: "50%"},
      isFavorite: true,
    },
    // Mascotas
    {
      id: 6,
      name: "Pet Spa & Grooming",
      category: "mascotas",
      rating: 4.7,
      distance: "2.0 km",
      image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=200&fit=crop",
      price: "Desde $400",
      coordinates: {top: "40%", left: "15%"},
      isFavorite: false,
    },
    {
      id: 7,
      name: "Clínica Veterinaria BE-U",
      category: "mascotas",
      rating: 4.9,
      distance: "1.8 km",
      image: "https://images.unsplash.com/photo-1630438994394-3deff7a591bf?w=400&h=200&fit=crop",
      price: "Desde $600",
      coordinates: {top: "70%", left: "75%"},
      isFavorite: true,
    },
  ];

  const filteredSalons = activeFilter
    ? salons.filter((salon) => salon.category === activeFilter)
    : salons;

  const selectedSalonData = selectedSalon
    ? filteredSalons.find((s) => s.id === selectedSalon)
    : null;

  const getPinColor = (salon: any) => {
    if (selectedSalon === salon.id) return colors.primary;
    if (salon.isFavorite) return "#10b981";
    return "#ef4444";
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mapa de Servicios</Text>
          <Text style={[styles.headerSubtitle, {color: colors.mutedForeground}]}>
            {filteredSalons.length} establecimientos
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.headerButton, showFilters && {backgroundColor: colors.primary + "15"}]}>
          <Ionicons
            name="options"
            color={showFilters ? colors.primary : colors.foreground}
            size={24}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[styles.searchBar, {backgroundColor: colors.input, borderColor: colors.border}]}>
          <Ionicons name="search" color={colors.mutedForeground} size={20} />
          <TextInput
            style={[styles.searchInput, {color: colors.foreground}]}
            placeholder="Buscar en el mapa..."
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>

      {/* Category Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !activeFilter && [styles.activeFilterChip, {backgroundColor: colors.primary}],
                {borderColor: colors.border},
              ]}
              onPress={() => setActiveFilter(null)}>
              <Text
                style={[
                  styles.filterChipText,
                  {color: !activeFilter ? "#ffffff" : colors.foreground},
                ]}>
                Todos
              </Text>
            </TouchableOpacity>

            {MAIN_CATEGORIES.filter((cat) => cat.id !== "todos").map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterChip,
                  activeFilter === category.id && [
                    styles.activeFilterChip,
                    {backgroundColor: colors.primary},
                  ],
                  {borderColor: colors.border},
                ]}
                onPress={() => setActiveFilter(category.id)}>
                <Text style={styles.filterEmoji}>{getCategoryEmoji(category.id)}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    {color: activeFilter === category.id ? "#ffffff" : colors.foreground},
                  ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map Area */}
      <View style={styles.mapContainer}>
        {/* Placeholder del mapa */}
        <View style={[styles.mapPlaceholder, {backgroundColor: colors.muted}]}>
          <View style={styles.mapGrid}>
            <View style={[styles.gridLine, {backgroundColor: colors.border}]} />
            <View style={[styles.gridLineHorizontal, {backgroundColor: colors.border}]} />
          </View>

          <View style={styles.mapCenter}>
            <Ionicons name="navigate-circle" color={colors.primary} size={32} />
            <Text style={[styles.mapCenterText, {color: colors.mutedForeground}]}>
              Tu ubicación
            </Text>
          </View>

          {/* Pins */}
          <View style={styles.pinsContainer}>
            {filteredSalons.map((salon) => (
              <TouchableOpacity
                key={salon.id}
                style={[
                  styles.pin,
                  {
                    backgroundColor: getPinColor(salon),
                    top: salon.coordinates.top,
                    left: salon.coordinates.left,
                    transform: [{scale: selectedSalon === salon.id ? 1.2 : 1}],
                  },
                ]}
                onPress={() => setSelectedSalon(salon.id)}>
                <Ionicons name="location" color="#ffffff" size={24} />
                {salon.isFavorite && (
                  <View style={styles.pinBadge}>
                    <Ionicons name="heart" color="#ffffff" size={10} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View style={[styles.legend, {backgroundColor: colors.background}]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: "#ef4444"}]} />
            <Text style={[styles.legendText, {color: colors.foreground}]}>Establecimientos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: "#10b981"}]} />
            <Text style={[styles.legendText, {color: colors.foreground}]}>Favoritos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
            <Text style={[styles.legendText, {color: colors.foreground}]}>Seleccionado</Text>
          </View>
        </View>
      </View>

      {/* Bottom Card */}
      {selectedSalonData && (
        <View style={[styles.bottomCard, {backgroundColor: colors.background}]}>
          <TouchableOpacity
            style={[styles.salonCard, {backgroundColor: colors.card, borderColor: colors.border}]}
            activeOpacity={0.9}
            onPress={() => {
              // TODO: Navigate to salon details
              console.log("Open salon:", selectedSalonData.id);
            }}>
            <Image source={{uri: selectedSalonData.image}} style={styles.salonImage} />

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                // TODO: Toggle favorite
              }}>
              <Ionicons
                name={selectedSalonData.isFavorite ? "heart" : "heart-outline"}
                color={selectedSalonData.isFavorite ? "#ef4444" : colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>

            <View style={styles.salonContent}>
              <Text style={[styles.salonName, {color: colors.foreground}]} numberOfLines={1}>
                {selectedSalonData.name}
              </Text>

              <View style={styles.salonMeta}>
                <View style={styles.salonRating}>
                  <Ionicons name="star" color="#fbbf24" size={16} />
                  <Text style={[styles.salonRatingText, {color: colors.foreground}]}>
                    {selectedSalonData.rating}
                  </Text>
                </View>
                <Text style={[styles.salonDistance, {color: colors.mutedForeground}]}>
                  • {selectedSalonData.distance}
                </Text>
              </View>

              <View style={styles.salonFooter}>
                <Text style={[styles.salonPrice, {color: colors.primary}]}>
                  {selectedSalonData.price}
                </Text>
                <View style={styles.salonActions}>
                  <TouchableOpacity
                    style={[styles.directionsButton, {borderColor: colors.border}]}
                    onPress={(e) => {
                      e.stopPropagation();
                      // TODO: Open directions
                    }}>
                    <Ionicons name="navigate" color={colors.primary} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reserveButton, {backgroundColor: colors.primary}]}
                    onPress={(e) => {
                      e.stopPropagation();
                      // TODO: Open reservation
                    }}>
                    <Text style={styles.reserveButtonText}>Reservar</Text>
                    <Ionicons name="arrow-forward" color="#ffffff" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSalon(null)}>
            <Ionicons name="close" color={colors.mutedForeground} size={20} />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={[
            styles.floatingButton,
            {backgroundColor: colors.background, borderColor: colors.border},
          ]}
          onPress={() => {
            // TODO: Center map on user location
          }}>
          <Ionicons name="locate" color={colors.primary} size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.floatingButton,
            {backgroundColor: colors.background, borderColor: colors.border},
          ]}
          onPress={() => {
            // TODO: Show list view
          }}>
          <Ionicons name="list" color={colors.foreground} size={24} />
        </TouchableOpacity>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    paddingBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  activeFilterChip: {
    borderWidth: 0,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapPlaceholder: {
    flex: 1,
    position: "relative",
  },
  mapGrid: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gridLine: {
    position: "absolute",
    width: 1,
    height: "100%",
    left: "50%",
    opacity: 0.1,
  },
  gridLineHorizontal: {
    position: "absolute",
    height: 1,
    width: "100%",
    top: "50%",
    opacity: 0.1,
  },
  mapCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{translateX: -16}, {translateY: -16}],
    alignItems: "center",
    opacity: 0.3,
  },
  mapCenterText: {
    fontSize: 10,
    marginTop: 4,
  },
  pinsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  pin: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  legend: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "column",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  salonCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  salonImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  salonContent: {
    padding: 16,
  },
  salonName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  salonMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  salonRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  salonRatingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  salonDistance: {
    fontSize: 14,
    marginLeft: 4,
  },
  salonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salonPrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  salonActions: {
    flexDirection: "row",
    gap: 8,
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reserveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 6,
  },
  reserveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingButtons: {
    position: "absolute",
    bottom: 24,
    right: 16,
    gap: 12,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
