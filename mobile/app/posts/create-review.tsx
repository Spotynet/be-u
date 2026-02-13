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
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";
import {LinkedServiceSelector, type CustomServiceItem} from "@/components/posts/LinkedServiceSelector";
import {providerApi, profileCustomizationApi, errorUtils} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AppHeader} from "@/components/ui/AppHeader";

export default function CreateReviewScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {isAuthenticated} = useAuth();

  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerType, setProviderType] = useState<"professional" | "place" | null>(null);
  const [rating, setRating] = useState(5);
  const [aspectRatings, setAspectRatings] = useState({
    quality: 5,
    cleanliness: 5,
    attention: 5,
    value: 5,
  });
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customServices, setCustomServices] = useState<CustomServiceItem[]>([]);
  const [linkedServiceId, setLinkedServiceId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    profileCustomizationApi.getCustomServices()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
        setCustomServices(list.map((s: any) => ({
          id: s.id,
          name: s.name || s.service_name || "",
          price: s.price != null ? String(s.price) : "",
          duration_minutes: s.duration_minutes,
        })));
      })
      .catch(() => { if (!cancelled) setCustomServices([]); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

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

  // Auto-pick a provider since we're hiding provider selection UI for now.
  useEffect(() => {
    if (!isLoading && !error && !selectedProvider && allProviders.length > 0) {
      setSelectedProvider(allProviders[0]);
      setProviderType(allProviders[0]?.type || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, allProviders.length]);

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
      <AppHeader
        title="Dejar Reseña"
        showBackButton={true}
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
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
          <MediaUploader
            mediaType="photo"
            maxFiles={4}
            onMediaSelected={setPhotos}
            selectedMedia={photos}
          />

          <LinkedServiceSelector
            customServices={customServices}
            linkedServiceId={linkedServiceId}
            onSelect={setLinkedServiceId}
            colors={colors}
          />

          {/* Description */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, {color: colors.foreground}]}>
              DESCRIPCIÓN
            </Text>
            <TextInput
              style={[
                styles.descriptionInput,
                {backgroundColor: colors.input, color: colors.foreground},
              ]}
              placeholder="Escribe algo sobre este trabajo..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          <View style={{height: 24}} />
        </ScrollView>
      )}

      {selectedProvider && (
        <View
          style={[
            styles.fixedBottom,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <TouchableOpacity
            style={[styles.publishButtonLarge, {backgroundColor: colors.primary}]}
            onPress={handlePublish}
            activeOpacity={0.8}>
            <Text style={styles.publishButtonLargeText}>Publicar en el feed</Text>
            <Ionicons name="arrow-forward" color="#ffffff" size={22} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  descriptionInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
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
  fixedBottom: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  publishButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
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
