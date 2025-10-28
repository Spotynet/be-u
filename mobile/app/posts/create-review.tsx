import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";
import {providerApi} from "@/lib/api";
import {errorUtils} from "@/lib/api";

export default function CreateReviewScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerType, setProviderType] = useState<"professional" | "place" | null>(null);
  const [rating, setRating] = useState(0);
  const [aspectRatings, setAspectRatings] = useState({
    quality: 0,
    cleanliness: 0,
    attention: 0,
    value: 0,
  });
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both professionals and places
        const [professionalsResponse, placesResponse] = await Promise.all([
          providerApi.getProfessionalProfiles({page: 1, page_size: 20}),
          providerApi.getPlaceProfiles({page: 1, page_size: 20}),
        ]);

        // Transform professionals data
        const transformedProfessionals = professionalsResponse.data.results.map((prof: any) => ({
          id: prof.id,
          name: prof.user?.first_name || prof.name || "Nombre no disponible",
          last_name: prof.user?.last_name || prof.last_name || "",
          specialty: prof.bio || "Especialista",
          city: prof.city || "Ciudad no especificada",
          type: "professional",
        }));

        // Transform places data
        const transformedPlaces = placesResponse.data.results.map((place: any) => ({
          id: place.id,
          name: place.name,
          specialty: place.description || "Establecimiento de belleza",
          city: place.city,
          type: "place",
        }));

        setProfessionals(transformedProfessionals);
        setPlaces(transformedPlaces);
      } catch (error: any) {
        console.error("Error fetching providers:", error);
        setError(errorUtils.getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const allProviders = [
    ...professionals.map((p) => ({...p, type: "professional"})),
    ...places.map((p) => ({...p, type: "place"})),
  ];

  const renderStarRating = (currentRating: number, onPress: (rating: number) => void) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onPress(star)} activeOpacity={0.7}>
          <Ionicons
            name={star <= currentRating ? "star" : "star-outline"}
            color={star <= currentRating ? "#FFD700" : colors.mutedForeground}
            size={24}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProviderCard = (provider: any) => (
    <TouchableOpacity
      key={`${provider.type}-${provider.id}`}
      style={[
        styles.providerCard,
        {
          backgroundColor:
            selectedProvider?.id === provider.id && selectedProvider?.type === provider.type
              ? colors.primary + "15"
              : colors.card,
          borderColor:
            selectedProvider?.id === provider.id && selectedProvider?.type === provider.type
              ? colors.primary
              : colors.border,
        },
      ]}
      onPress={() => {
        setSelectedProvider(provider);
        setProviderType(provider.type);
      }}
      activeOpacity={0.8}>
      <View style={styles.providerInfo}>
        <View style={[styles.providerAvatar, {backgroundColor: colors.muted}]}>
          {provider.type === "professional" ? (
            <Text style={styles.avatarText}>
              {provider.name.charAt(0)}
              {provider.last_name.charAt(0)}
            </Text>
          ) : (
            <Ionicons name="business" color={colors.mutedForeground} size={24} />
          )}
        </View>
        <View style={styles.providerDetails}>
          <Text style={[styles.providerName, {color: colors.foreground}]}>
            {provider.type === "professional"
              ? `${provider.name} ${provider.last_name}`
              : provider.name}
          </Text>
          <Text style={[styles.providerSpecialty, {color: colors.mutedForeground}]}>
            {provider.specialty || provider.description?.substring(0, 50) + "..."}
          </Text>
          <Text style={[styles.providerLocation, {color: colors.mutedForeground}]}>
            {provider.city}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
    </TouchableOpacity>
  );

  const handlePublish = () => {
    if (!selectedProvider) {
      Alert.alert("Error", "Selecciona un profesional o lugar");
      return;
    }

    if (rating === 0) {
      Alert.alert("Error", "Agrega una calificación");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Agrega una descripción de tu experiencia");
      return;
    }

    Alert.alert("¡Reseña Publicada!", "Tu reseña ha sido publicada exitosamente", [
      {
        text: "Ver Reseña",
        onPress: () => router.push("/(tabs)/"),
      },
    ]);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Dejar Reseña</Text>
        <TouchableOpacity onPress={handlePublish} style={styles.publishButton}>
          <Text style={[styles.publishButtonText, {color: colors.primary}]}>Publicar</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="person-outline" color={colors.mutedForeground} size={64} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando profesionales y lugares...
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
              setError(null);
              setIsLoading(true);
              // Re-trigger useEffect
            }}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Provider Selection */}
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
              ¿Sobre quién es tu reseña?
            </Text>
            <View style={styles.providersList}>
              {allProviders.slice(0, 6).map(renderProviderCard)}
            </View>
          </View>

          {/* Overall Rating */}
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
              Calificación General
            </Text>
            <View style={styles.ratingSection}>
              {renderStarRating(rating, setRating)}
              <Text style={[styles.ratingText, {color: colors.mutedForeground}]}>
                {rating === 0 ? "Selecciona una calificación" : `${rating} de 5 estrellas`}
              </Text>
            </View>
          </View>

          {/* Aspect Ratings */}
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
              Detalles de la Calificación
            </Text>

            <View style={styles.aspectRating}>
              <Text style={[styles.aspectLabel, {color: colors.foreground}]}>
                Calidad del servicio
              </Text>
              {renderStarRating(aspectRatings.quality, (rating) =>
                setAspectRatings({...aspectRatings, quality: rating})
              )}
            </View>

            <View style={styles.aspectRating}>
              <Text style={[styles.aspectLabel, {color: colors.foreground}]}>Limpieza</Text>
              {renderStarRating(aspectRatings.cleanliness, (rating) =>
                setAspectRatings({...aspectRatings, cleanliness: rating})
              )}
            </View>

            <View style={styles.aspectRating}>
              <Text style={[styles.aspectLabel, {color: colors.foreground}]}>Atención</Text>
              {renderStarRating(aspectRatings.attention, (rating) =>
                setAspectRatings({...aspectRatings, attention: rating})
              )}
            </View>

            <View style={styles.aspectRating}>
              <Text style={[styles.aspectLabel, {color: colors.foreground}]}>Precio/Valor</Text>
              {renderStarRating(aspectRatings.value, (rating) =>
                setAspectRatings({...aspectRatings, value: rating})
              )}
            </View>
          </View>

          {/* Photos */}
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Fotos (Opcional)</Text>
            <MediaUploader
              mediaType="photo"
              maxFiles={4}
              onMediaSelected={setPhotos}
              selectedMedia={photos}
            />
          </View>

          {/* Description */}
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
              Describe tu experiencia
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Comparte los detalles de tu experiencia..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* Recommendation */}
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <TouchableOpacity
              style={styles.recommendationRow}
              onPress={() => setWouldRecommend(!wouldRecommend)}
              activeOpacity={0.7}>
              <View style={styles.recommendationLeft}>
                <Ionicons name="heart" color={colors.primary} size={20} />
                <Text style={[styles.recommendationText, {color: colors.foreground}]}>
                  ¿Recomendarías este lugar/profesional?
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  wouldRecommend ? styles.toggleActive : styles.toggleInactive,
                ]}>
                <View
                  style={[
                    styles.toggleCircle,
                    wouldRecommend ? styles.toggleCircleActive : styles.toggleCircleInactive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Publish Button */}
          <TouchableOpacity
            style={[styles.publishButtonLarge, {backgroundColor: colors.primary}]}
            onPress={handlePublish}
            activeOpacity={0.8}>
            <Image
              source={require("@/assets/images/BE-U-white.png")}
              style={styles.publishButtonIcon}
              resizeMode="contain"
            />
            <Text style={styles.publishButtonLargeText}>Publicar Reseña</Text>
          </TouchableOpacity>

          <View style={{height: 40}} />
        </ScrollView>
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
    fontSize: 18,
    fontWeight: "700",
  },
  publishButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  providersList: {
    gap: 12,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  providerDetails: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  providerSpecialty: {
    fontSize: 13,
  },
  providerLocation: {
    fontSize: 12,
  },
  ratingSection: {
    alignItems: "center",
    gap: 12,
  },
  starContainer: {
    flexDirection: "row",
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  aspectRating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  aspectLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  recommendationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  recommendationText: {
    fontSize: 15,
    fontWeight: "500",
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: "#4ECDC4",
  },
  toggleInactive: {
    backgroundColor: "#ccc",
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  toggleCircleInactive: {
    alignSelf: "flex-start",
  },
  publishButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  publishButtonIcon: {
    width: 24,
    height: 24,
  },
  publishButtonLargeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
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
});
