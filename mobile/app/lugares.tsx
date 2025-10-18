import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react";
import {providerApi} from "@/lib/api";
import {errorUtils} from "@/lib/api";

export default function LugaresScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await providerApi.getPlaceProfiles({
        page: 1,
        page_size: 50, // Get more places for the list
      });

      // Transform API response to match expected format for UI
      const transformedPlaces = response.data.results.map((place: any) => ({
        id: place.id,
        name: place.name,
        address: place.street || place.address || "Dirección no disponible",
        city: place.city,
        country: place.country || "México",
        rating: place.rating || 4.5,
        reviewsCount: place.reviews_count || 0,
        photo: place.photo,
        description: place.description,
        services: place.services?.map((s: any) => s.id) || [],
        team: place.team || [],
        professionals: place.professionals || [],
        gallery: place.gallery || [],
        amenities: place.amenities || [],
        hours: place.hours || {},
      }));

      setPlaces(transformedPlaces);
    } catch (error: any) {
      console.error("Error loading places:", error);
      setError(errorUtils.getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  const renderPlaceCard = (place: any) => (
    <TouchableOpacity
      key={place.id}
      style={[styles.placeCard, {backgroundColor: colors.card}]}
      onPress={() => router.push(`/place/${place.id}` as any)}
      activeOpacity={0.8}>
      <View style={[styles.placeImageContainer, {backgroundColor: "#f0f0f0"}]}>
        <Ionicons name="business" color={colors.mutedForeground} size={24} />
      </View>
      <View style={styles.placeInfo}>
        <Text style={[styles.placeName, {color: colors.foreground}]} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={[styles.placeAddress, {color: colors.mutedForeground}]} numberOfLines={1}>
          {place.address}
        </Text>
        <Text style={[styles.placeCity, {color: colors.mutedForeground}]} numberOfLines={1}>
          {place.city}
        </Text>
        <View style={styles.placeRating}>
          <Ionicons name="star" color="#FFD700" size={14} />
          <Text style={[styles.ratingText, {color: colors.foreground}]}>
            {place.rating} ({place.reviewsCount})
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {borderBottomColor: colors.border}]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Lugares</Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="location-outline" color={colors.mutedForeground} size={64} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando lugares...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {borderBottomColor: colors.border}]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Lugares</Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" color="#ef4444" size={64} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={() => {
              loadPlaces();
            }}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Lugares</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search" color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Descubre espacios únicos para tu belleza
        </Text>

        {places.length > 0 ? (
          <View style={styles.placesList}>{places.map(renderPlaceCard)}</View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" color={colors.mutedForeground} size={64} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay lugares disponibles
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Pronto tendremos más establecimientos para ti
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
  placesList: {
    gap: 12,
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  placeInfo: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "600",
  },
  placeAddress: {
    fontSize: 13,
  },
  placeCity: {
    fontSize: 12,
  },
  placeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
