import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {providerApi} from "@/lib/api";
import {PlaceProfile} from "@/types/global";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {mockPlaces, mockServices, mockReviews} from "@/lib/mockData";

export default function PlaceDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();

  const [place, setPlace] = useState<PlaceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchPlaceDetails();
  }, [id]);

  const fetchPlaceDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Buscar el lugar en los datos mock
      const placeData = mockPlaces.find((p) => p.id === parseInt(id || "1"));
      if (placeData) {
        // Agregar servicios y reseñas mock
        const placeWithServices = {
          ...placeData,
          services: mockServices.slice(0, 3), // Primeros 3 servicios
          reviews: mockReviews.slice(0, 2), // Primeras 2 reseñas
        };
        setPlace(placeWithServices);
      } else {
        setError("Lugar no encontrado");
      }
    } catch (err: any) {
      console.error("Error fetching place:", err);
      setError(err.message || "Error al cargar el establecimiento");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.background}]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando establecimiento...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.background}]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" color="#ef4444" size={64} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Error</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            {error || "No se pudo cargar el establecimiento"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={fetchPlaceDetails}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.background}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, {backgroundColor: "#DDA0DD"}]}>
            <Text style={styles.avatarText}>{place.name.substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={[styles.name, {color: colors.foreground}]}>{place.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" color={colors.mutedForeground} size={16} />
            <Text style={[styles.address, {color: colors.mutedForeground}]}>{place.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" color={colors.primary} size={18} />
            <Text style={[styles.servicesCount, {color: colors.foreground}]}>
              {place.services_count} servicios disponibles
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Ubicación</Text>
          <View style={styles.locationDetails}>
            <View style={styles.locationRow}>
              <Ionicons name="home" color={colors.mutedForeground} size={20} />
              <View style={{flex: 1}}>
                <Text style={[styles.locationText, {color: colors.foreground}]}>
                  {place.street} {place.number_ext}
                </Text>
                {place.city && (
                  <Text style={[styles.locationSubtext, {color: colors.mutedForeground}]}>
                    {place.city}
                    {place.country && `, ${place.country}`}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Services Section - Placeholder */}
        {place.services && place.services.length > 0 && (
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Servicios</Text>
            {place.services.map((service: any) => (
              <View
                key={service.id}
                style={[styles.serviceCard, {borderBottomColor: colors.border}]}>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, {color: colors.foreground}]}>
                    {service.name}
                  </Text>
                  <Text style={[styles.serviceDescription, {color: colors.muted}]}>
                    {service.description}
                  </Text>
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetail}>
                      <Ionicons name="time-outline" size={16} color={colors.muted} />
                      <Text style={[styles.serviceDetailText, {color: colors.muted}]}>
                        {service.duration} min
                      </Text>
                    </View>
                    <View style={styles.serviceDetail}>
                      <Ionicons name="person-outline" size={16} color={colors.muted} />
                      <Text style={[styles.serviceDetailText, {color: colors.muted}]}>
                        {service.professional}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.servicePrice, {color: colors.primary}]}>
                    <Text style={styles.priceText}>${service.price}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookButton, {backgroundColor: colors.primary}]}
                  onPress={() => {
                    setSelectedService(service);
                    setShowBookingFlow(true);
                  }}
                  activeOpacity={0.8}>
                  <Text style={styles.bookButtonText}>Reservar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Portfolio Section */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Portfolio</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.portfolioScroll}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.portfolioItem}>
                <View style={[styles.portfolioPlaceholder, {backgroundColor: colors.muted}]}>
                  <Ionicons name="image-outline" size={24} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.portfolioDescription, {color: colors.muted}]}>
                  Trabajo {item}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Reviews Section */}
        {place.reviews && place.reviews.length > 0 && (
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Reseñas</Text>
              <Text style={[styles.reviewCount, {color: colors.muted}]}>
                ({place.reviews.length})
              </Text>
            </View>
            {place.reviews.map((review: any) => (
              <View key={review.id} style={[styles.reviewCard, {borderBottomColor: colors.border}]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAuthor}>
                    <Text style={[styles.reviewAuthorName, {color: colors.foreground}]}>
                      {review.author}
                    </Text>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? "star" : "star-outline"}
                          size={14}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewDate, {color: colors.muted}]}>{review.date}</Text>
                </View>
                <Text style={[styles.reviewComment, {color: colors.foreground}]}>
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Contact Button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, {backgroundColor: colors.primary}]}
            activeOpacity={0.9}
            onPress={() => {
              // Si hay servicios disponibles, mostrar el primer servicio para reservar
              if (place.services && place.services.length > 0) {
                setSelectedService(place.services[0]);
                setShowBookingFlow(true);
              } else {
                // Si no hay servicios, navegar a una página de contacto general
                router.push("/contact");
              }
            }}>
            <Ionicons name="calendar" color="#ffffff" size={20} />
            <Text style={styles.primaryButtonText}>Agendar Cita</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Booking Flow Modal */}
      {selectedService && (
        <BookingFlow
          isVisible={showBookingFlow}
          onClose={() => setShowBookingFlow(false)}
          provider={place}
          service={selectedService}
        />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
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
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#ffffff",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  address: {
    fontSize: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  servicesCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  locationDetails: {
    gap: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "500",
  },
  locationSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Service Card Styles
  serviceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  serviceDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
  },
  bookButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Portfolio Styles
  portfolioScroll: {
    marginTop: 12,
  },
  portfolioItem: {
    marginRight: 16,
    alignItems: "center",
  },
  portfolioPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  portfolioDescription: {
    fontSize: 12,
    textAlign: "center",
  },
  // Reviews Styles
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  reviewCount: {
    marginLeft: 8,
    fontSize: 14,
  },
  reviewCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewAuthor: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
});
