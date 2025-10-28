import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {useRouter} from "expo-router";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Data de mascotas para adopción
  const profiles = [
    {
      id: 1,
      name: "Luna",
      type: "perro",
      breed: "Golden Retriever",
      age: "2 años",
      gender: "Hembra",
      size: "Grande",
      energy: "Alta",
      images: [
        "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=1200&fit=crop",
      ],
      distance: "0.5 km",
      shelter: "Refugio Huellitas Felices",
      personality: "Juguetona, cariñosa y muy sociable. Le encanta jugar con niños.",
      vaccinated: true,
      sterilized: true,
      tags: ["Amigable con niños", "Juguetona", "Entrenada"],
      color: "#FFB347",
    },
    {
      id: 2,
      name: "Michi",
      type: "gato",
      breed: "Persa",
      age: "1 año",
      gender: "Macho",
      size: "Mediano",
      energy: "Media",
      images: [
        "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1573865526739-10c1dd7aa000?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&h=1200&fit=crop",
      ],
      distance: "1.2 km",
      shelter: "Gatitos sin Hogar",
      personality: "Tranquilo y cariñoso. Perfecto para departamentos.",
      vaccinated: true,
      sterilized: true,
      tags: ["Tranquilo", "Indoor", "Cariñoso"],
      color: "#DDA0DD",
    },
    {
      id: 3,
      name: "Max",
      type: "perro",
      breed: "Beagle",
      age: "3 años",
      gender: "Macho",
      size: "Mediano",
      energy: "Alta",
      images: [
        "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&h=1200&fit=crop",
      ],
      distance: "0.8 km",
      shelter: "Adopta un Amigo",
      personality: "Curioso y activo. Le encanta explorar y hacer ejercicio.",
      vaccinated: true,
      sterilized: false,
      tags: ["Activo", "Aventurero", "Leal"],
      color: "#87CEEB",
    },
    {
      id: 4,
      name: "Nala",
      type: "gato",
      breed: "Siamés",
      age: "6 meses",
      gender: "Hembra",
      size: "Pequeño",
      energy: "Alta",
      images: [
        "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6?w=800&h=1200&fit=crop",
      ],
      distance: "2.0 km",
      shelter: "Refugio Huellitas Felices",
      personality: "Juguetona y curiosa. Perfecta para familias activas.",
      vaccinated: true,
      sterilized: false,
      tags: ["Juguetona", "Joven", "Sociable"],
      color: "#FFB6C1",
    },
    {
      id: 5,
      name: "Rocky",
      type: "perro",
      breed: "Labrador",
      age: "4 años",
      gender: "Macho",
      size: "Grande",
      energy: "Media",
      images: [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=1200&fit=crop",
        "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=800&h=1200&fit=crop",
      ],
      distance: "1.5 km",
      shelter: "Adopta un Amigo",
      personality: "Tranquilo y protector. Ideal para familias con espacio.",
      vaccinated: true,
      sterilized: true,
      tags: ["Protector", "Tranquilo", "Familiar"],
      color: "#90EE90",
    },
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({x: gesture.dx, y: gesture.dy});
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          Animated.spring(position, {
            toValue: {x: 0, y: 0},
            friction: 4,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: {x: SCREEN_WIDTH + 100, y: 0},
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex((prev) => prev + 1);
      position.setValue({x: 0, y: 0});
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: {x: -SCREEN_WIDTH - 100, y: 0},
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex((prev) => prev + 1);
      position.setValue({x: 0, y: 0});
    });
  };

  const currentProfile = profiles[currentIndex % profiles.length];
  const nextProfile = profiles[(currentIndex + 1) % profiles.length];

  const getPetTypeEmoji = (type: string) => {
    switch (type) {
      case "perro":
        return "🐕";
      case "gato":
        return "🐱";
      default:
        return "🐾";
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.background}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" color={colors.foreground} size={28} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Adopta 🐾</Text>
          <Text style={[styles.headerSubtitle, {color: colors.mutedForeground}]}>
            Tu nuevo mejor amigo te espera
          </Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      {/* Cards Stack */}
      <View style={styles.cardContainer}>
        {/* Next Card (Behind) */}
        {nextProfile && (
          <View style={[styles.card, styles.nextCard, {backgroundColor: colors.card}]}>
            <Image source={{uri: nextProfile.images[0]}} style={styles.cardImage} />
          </View>
        )}

        {/* Current Card */}
        {currentIndex < profiles.length && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [{translateX: position.x}, {translateY: position.y}, {rotate: rotate}],
              },
            ]}>
            <Image source={{uri: currentProfile.images[0]}} style={styles.cardImage} />

            {/* Like/Nope Stamps */}
            <Animated.View
              style={[
                styles.stamp,
                styles.likeStamp,
                {
                  opacity: likeOpacity,
                },
              ]}>
              <Text style={styles.stampText}>¡ADOPTA!</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.stamp,
                styles.nopeStamp,
                {
                  opacity: nopeOpacity,
                },
              ]}>
              <Text style={styles.stampText}>PASS</Text>
            </Animated.View>

            {/* Card Info Overlay */}
            <View style={styles.cardOverlay}>
              {/* Tags */}
              <View style={styles.cardTags}>
                {currentProfile.vaccinated && (
                  <View style={[styles.vaccineBadge, {backgroundColor: currentProfile.color}]}>
                    <Ionicons name="shield-checkmark" color="#ffffff" size={16} />
                    <Text style={styles.badgeText}>Vacunado</Text>
                  </View>
                )}
                {currentProfile.sterilized && (
                  <View style={[styles.sterilizedBadge, {backgroundColor: "#4CAF50"}]}>
                    <Ionicons name="checkmark-done" color="#ffffff" size={16} />
                    <Text style={styles.badgeText}>Esterilizado</Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>
                    {currentProfile.name} {getPetTypeEmoji(currentProfile.type)}
                  </Text>
                  <View style={[styles.typeTag, {backgroundColor: currentProfile.color}]}>
                    <Text style={styles.typeTagText}>{currentProfile.breed}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" color="#ffffff" size={16} />
                    <Text style={styles.detailText}>{currentProfile.age}</Text>
                  </View>
                  <Text style={styles.divider}>•</Text>
                  <View style={styles.detailItem}>
                    <Ionicons
                      name={currentProfile.gender === "Macho" ? "male" : "female"}
                      color="#ffffff"
                      size={16}
                    />
                    <Text style={styles.detailText}>{currentProfile.gender}</Text>
                  </View>
                  <Text style={styles.divider}>•</Text>
                  <View style={styles.detailItem}>
                    <Ionicons name="resize-outline" color="#ffffff" size={16} />
                    <Text style={styles.detailText}>{currentProfile.size}</Text>
                  </View>
                </View>

                <View style={styles.personalitySection}>
                  <Text style={styles.personalityTitle}>Personalidad:</Text>
                  <Text style={styles.personalityText}>{currentProfile.personality}</Text>
                </View>

                {/* Tags de características */}
                <View style={styles.characteristicsTags}>
                  {currentProfile.tags.map((tag, i) => (
                    <View key={i} style={styles.characteristicTag}>
                      <Text style={styles.characteristicTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.footerInfo}>
                  <View style={styles.shelterInfo}>
                    <Ionicons name="home-outline" color="#ffffff" size={14} />
                    <Text style={styles.shelterText}>{currentProfile.shelter}</Text>
                  </View>
                  <Text style={styles.divider}>•</Text>
                  <Text style={styles.distance}>{currentProfile.distance}</Text>
                </View>

                {/* Image Counter */}
                <View style={styles.imageCounter}>
                  {currentProfile.images.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.imageCounterDot, i === 0 && styles.imageCounterDotActive]}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Info Button */}
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle" color="#ffffff" size={32} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* No more cards */}
        {currentIndex >= profiles.length && (
          <View style={[styles.emptyState, {backgroundColor: colors.card}]}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              ¡Has visto todas las mascotas disponibles!
            </Text>
            <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>
              Pronto habrá más peluditos buscando un hogar
            </Text>
            <TouchableOpacity
              style={[styles.restartButton, {backgroundColor: "#FFB347"}]}
              onPress={() => setCurrentIndex(0)}>
              <Text style={styles.restartButtonText}>Ver de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.nopeButton]}
          onPress={swipeLeft}
          activeOpacity={0.9}>
          <Ionicons name="close" color="#ff4458" size={32} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton, {backgroundColor: "#1e90ff"}]}
          activeOpacity={0.9}>
          <Image
            source={require("@/assets/images/BE-U-white.png")}
            style={styles.superLikeIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={swipeRight}
          activeOpacity={0.9}>
          <Ionicons name="heart" color="#00d084" size={32} />
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Cards
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 24,
    position: "absolute",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  nextCard: {
    transform: [{scale: 0.95}],
    opacity: 0.8,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Stamps
  stamp: {
    position: "absolute",
    top: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 4,
    borderRadius: 12,
    transform: [{rotate: "-20deg"}],
  },
  likeStamp: {
    right: 40,
    borderColor: "#00d084",
  },
  nopeStamp: {
    left: 40,
    borderColor: "#ff4458",
  },
  stampText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#ffffff",
  },

  // Card Overlay
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  cardTags: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  vaccineBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  sterilizedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  cardInfo: {
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeTagText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  personalitySection: {
    marginTop: 8,
  },
  personalityTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  personalityText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.95,
  },
  characteristicsTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  characteristicTag: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  characteristicTagText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  shelterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shelterText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  divider: {
    color: "#ffffff",
    opacity: 0.6,
  },
  distance: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  imageCounter: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  imageCounterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  imageCounterDotActive: {
    backgroundColor: "#ffffff",
  },

  // Info Button
  infoButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Actions
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 30,
    gap: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  nopeButton: {
    borderWidth: 3,
    borderColor: "#ff4458",
  },
  likeButton: {
    borderWidth: 3,
    borderColor: "#00d084",
  },
  superLikeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  superLikeIcon: {
    width: 28,
    height: 28,
  },

  // Empty State
  emptyState: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  restartButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  restartButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
