import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {useRouter} from "expo-router";

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [selectedSalon, setSelectedSalon] = useState<number | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Lugares con estilo Snapchat (con avatares/bitmojis)
  const places = [
    {
      id: 1,
      name: "Be-U Spa",
      category: "belleza",
      avatar: "💇‍♀️",
      rating: 4.9,
      distance: "0.5 km",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop",
      price: "$$",
      coordinates: {top: "30%", left: "28%"},
      isHot: true,
      color: "#FF69B4",
    },
    {
      id: 2,
      name: "Hair Studio",
      category: "belleza",
      avatar: "✂️",
      rating: 4.8,
      distance: "0.8 km",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=200&fit=crop",
      price: "$$$",
      coordinates: {top: "45%", left: "65%"},
      isHot: false,
      color: "#FFB6C1",
    },
    {
      id: 3,
      name: "Zen Studio",
      category: "wellness",
      avatar: "🧘‍♀️",
      rating: 4.9,
      distance: "1.2 km",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=200&fit=crop",
      price: "$$",
      coordinates: {top: "25%", left: "72%"},
      isHot: true,
      color: "#DDA0DD",
    },
    {
      id: 4,
      name: "Flow Yoga",
      category: "wellness",
      avatar: "🌸",
      rating: 4.7,
      distance: "1.5 km",
      image: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=200&fit=crop",
      price: "$",
      coordinates: {top: "60%", left: "55%"},
      isHot: false,
      color: "#E6B3E6",
    },
    {
      id: 5,
      name: "Pet Spa",
      category: "mascotas",
      avatar: "🐾",
      rating: 4.8,
      distance: "0.9 km",
      image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=200&fit=crop",
      price: "$$",
      coordinates: {top: "40%", left: "20%"},
      isHot: false,
      color: "#FFB347",
    },
    {
      id: 6,
      name: "Clínica Vet",
      category: "mascotas",
      avatar: "🏥",
      rating: 4.9,
      distance: "2.0 km",
      image: "https://images.unsplash.com/photo-1630438994394-3deff7a591bf?w=400&h=200&fit=crop",
      price: "$$$",
      coordinates: {top: "70%", left: "75%"},
      isHot: true,
      color: "#FFD700",
    },
    {
      id: 7,
      name: "Beauty Bar",
      category: "belleza",
      avatar: "💅",
      rating: 4.7,
      distance: "1.8 km",
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=200&fit=crop",
      price: "$$",
      coordinates: {top: "55%", left: "38%"},
      isHot: false,
      color: "#FF69B4",
    },
  ];

  const selectedPlace = selectedSalon ? places.find((p) => p.id === selectedSalon) : null;

  useEffect(() => {
    if (selectedSalon) {
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
  }, [selectedSalon]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Snapchat-style Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" color={colors.foreground} size={28} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mapa</Text>
          <Text style={[styles.headerSubtitle, {color: colors.mutedForeground}]}>
            {places.length} lugares
          </Text>
        </View>
        <TouchableOpacity style={[styles.locationButton, {backgroundColor: colors.primary}]}>
          <Ionicons name="navigate" color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, {backgroundColor: colors.card}]}>
          <Ionicons name="search" color={colors.mutedForeground} size={18} />
          <TextInput
            style={[styles.searchInput, {color: colors.foreground}]}
            placeholder="Buscar lugares..."
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>

      {/* Map Area - Snapchat Style */}
      <View style={styles.mapContainer}>
        {/* Map Background */}
        <View style={[styles.mapBackground, {backgroundColor: "#F8F8F8"}]}>
          {/* Grid pattern */}
          <View style={styles.mapGrid}>
            {[...Array(8)].map((_, i) => (
              <View key={`v${i}`} style={[styles.gridLineVertical, {left: `${(i + 1) * 12.5}%`}]} />
            ))}
            {[...Array(8)].map((_, i) => (
              <View
                key={`h${i}`}
                style={[styles.gridLineHorizontal, {top: `${(i + 1) * 12.5}%`}]}
              />
            ))}
          </View>

          {/* User Location - You are here */}
          <View style={styles.userLocation}>
            <View style={[styles.userPulse, {backgroundColor: colors.primary}]} />
            <View style={[styles.userDot, {backgroundColor: colors.primary}]}>
              <View style={styles.userDotInner} />
            </View>
          </View>

          {/* Places Pins - Snapchat Bitmoji style */}
          <View style={styles.pinsContainer}>
            {places.map((place) => {
              const isSelected = selectedSalon === place.id;
              return (
                <Animated.View
                  key={place.id}
                  style={[
                    styles.pinWrapper,
                    {
                      top: place.coordinates.top,
                      left: place.coordinates.left,
                      transform: [{scale: isSelected ? scaleAnim : 1}],
                    },
                  ]}>
                  <TouchableOpacity
                    style={[
                      styles.pin,
                      isSelected && styles.pinSelected,
                      {
                        backgroundColor: isSelected ? place.color : "#ffffff",
                        borderColor: place.color,
                      },
                    ]}
                    onPress={() => setSelectedSalon(isSelected ? null : place.id)}
                    activeOpacity={0.9}>
                    <Text style={styles.pinAvatar}>{place.avatar}</Text>
                    {place.isHot && (
                      <View style={styles.hotBadge}>
                        <Text style={styles.hotBadgeText}>🔥</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Name Label */}
                  {isSelected && (
                    <View style={[styles.pinLabel, {backgroundColor: place.color}]}>
                      <Text style={styles.pinLabelText}>{place.name}</Text>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Floating Legend - Minimal */}
        <View style={[styles.legend, {backgroundColor: colors.card}]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
            <Text style={[styles.legendText, {color: colors.foreground}]}>Tú</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <Text style={styles.legendHot}>🔥</Text>
            <Text style={[styles.legendText, {color: colors.foreground}]}>Popular</Text>
          </View>
        </View>
      </View>

      {/* Bottom Card - Snapchat Style */}
      {selectedPlace && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {backgroundColor: colors.background, transform: [{scale: scaleAnim}]},
          ]}>
          <View style={styles.sheetHandle} />

          <TouchableOpacity
            style={[styles.placeCard, {backgroundColor: colors.card}]}
            activeOpacity={0.95}>
            <Image source={{uri: selectedPlace.image}} style={styles.placeImage} />

            <View style={styles.placeContent}>
              <View style={styles.placeHeader}>
                <View style={[styles.placeAvatar, {backgroundColor: selectedPlace.color}]}>
                  <Text style={styles.placeAvatarText}>{selectedPlace.avatar}</Text>
                </View>
                <View style={styles.placeInfo}>
                  <Text style={[styles.placeName, {color: colors.foreground}]}>
                    {selectedPlace.name}
                  </Text>
                  <View style={styles.placeMeta}>
                    <View style={styles.placeRating}>
                      <Ionicons name="star" color="#FFD700" size={14} />
                      <Text style={[styles.placeRatingText, {color: colors.foreground}]}>
                        {selectedPlace.rating}
                      </Text>
                    </View>
                    <Text style={[styles.placeDot, {color: colors.mutedForeground}]}>•</Text>
                    <Text style={[styles.placeDistance, {color: colors.mutedForeground}]}>
                      {selectedPlace.distance}
                    </Text>
                    <Text style={[styles.placeDot, {color: colors.mutedForeground}]}>•</Text>
                    <Text style={[styles.placePrice, {color: colors.mutedForeground}]}>
                      {selectedPlace.price}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.placeActions}>
                <TouchableOpacity
                  style={[styles.actionButton, {backgroundColor: selectedPlace.color}]}
                  activeOpacity={0.9}>
                  <Ionicons name="calendar" color="#ffffff" size={18} />
                  <Text style={styles.actionButtonText}>Reservar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButtonSecondary, {borderColor: colors.border}]}
                  activeOpacity={0.9}>
                  <Ionicons name="navigate" color={selectedPlace.color} size={18} />
                  <Text style={[styles.actionButtonSecondaryText, {color: selectedPlace.color}]}>
                    Ir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButtonIcon, {borderColor: colors.border}]}
                  activeOpacity={0.9}>
                  <Ionicons name="heart-outline" color={colors.foreground} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedSalon(null)}
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
    paddingTop: 50,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  // Map
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

  // User Location
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  // Pins - Snapchat Bitmoji style
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  hotBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF4500",
  },
  hotBadgeText: {
    fontSize: 12,
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

  // Legend
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
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendHot: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "700",
  },
  legendDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },

  // Bottom Sheet
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  placeCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  placeImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  placeContent: {
    padding: 16,
  },
  placeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  placeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  placeAvatarText: {
    fontSize: 24,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  placeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  placeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeRatingText: {
    fontSize: 14,
    fontWeight: "700",
  },
  placeDot: {
    fontSize: 12,
  },
  placeDistance: {
    fontSize: 13,
    fontWeight: "600",
  },
  placePrice: {
    fontSize: 13,
    fontWeight: "700",
  },
  placeActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  actionButtonSecondaryText: {
    fontSize: 15,
    fontWeight: "800",
  },
  actionButtonIcon: {
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
