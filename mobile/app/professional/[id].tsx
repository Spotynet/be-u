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
import {ProfessionalProfile} from "@/types/global";
import {BookingFlow} from "@/components/booking/BookingFlow";
import {mockServices} from "@/lib/mockData";

export default function ProfessionalDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();

  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchProfessionalDetails();
  }, [id]);

  const fetchProfessionalDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Load mock data
      const {mockProfessionals, mockServices, mockReviews} = await import("@/lib/mockData");
      const mockProf = mockProfessionals.find((p) => p.id === Number(id));

      if (!mockProf) {
        throw new Error("Profesional no encontrado");
      }

      // Transform to match expected format
      setProfessional({
        ...mockProf,
        email: `${mockProf.name.toLowerCase()}@example.com`,
        services: mockServices.filter((s) => mockProf.services.includes(s.id)),
        reviews: mockReviews.filter(
          (r) => r.providerId === mockProf.id && r.providerType === "professional"
        ),
      });
    } catch (err: any) {
      console.error("Error fetching professional:", err);
      setError(err.message || "Error al cargar el perfil");
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
            Cargando perfil...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !professional) {
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
            {error || "No se pudo cargar el perfil"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={fetchProfessionalDetails}>
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
          <View style={[styles.avatarContainer, {backgroundColor: "#FFB6C1"}]}>
            <Text style={styles.avatarText}>
              {professional.name[0]}
              {professional.last_name[0]}
            </Text>
          </View>
          <Text style={[styles.name, {color: colors.foreground}]}>
            {professional.name} {professional.last_name}
          </Text>
          {professional.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location" color={colors.mutedForeground} size={16} />
              <Text style={[styles.location, {color: colors.mutedForeground}]}>
                {professional.city}
              </Text>
            </View>
          )}
          <View style={styles.ratingRow}>
            <Ionicons name="star" color="#FFD700" size={18} />
            <Text style={[styles.rating, {color: colors.foreground}]}>
              {professional.rating.toFixed(1)}
            </Text>
            <Text style={[styles.servicesCount, {color: colors.mutedForeground}]}>
              · {professional.services_count} servicios
            </Text>
          </View>
        </View>

        {/* Bio */}
        {professional.bio && (
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Sobre mí</Text>
            <Text style={[styles.bioText, {color: colors.foreground}]}>{professional.bio}</Text>
          </View>
        )}

        {/* Services Section */}
        {professional.services && professional.services.length > 0 && (
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Servicios</Text>
            {professional.services.map((service: any) => (
              <View
                key={service.id}
                style={[styles.serviceCard, {borderBottomColor: colors.border}]}>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, {color: colors.foreground}]}>
                    {service.name}
                  </Text>
                  <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                    {service.description}
                  </Text>
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetail}>
                      <Ionicons name="time-outline" color={colors.primary} size={16} />
                      <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                        {service.duration}
                      </Text>
                    </View>
                    <View style={styles.servicePrice}>
                      <Text style={[styles.priceText, {color: colors.primary}]}>
                        ${service.price} MXN
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.bookButton, {backgroundColor: colors.primary}]}
                  onPress={() => setShowBookingFlow(true)}
                  activeOpacity={0.8}>
                  <Text style={styles.bookButtonText}>Reservar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Portfolio Section */}
        {professional.portfolio && professional.portfolio.length > 0 && (
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Portafolio</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.portfolioScroll}>
              {professional.portfolio.map((item: any) => (
                <View key={item.id} style={[styles.portfolioItem, {backgroundColor: "#f0f0f0"}]}>
                  <View style={styles.portfolioPlaceholder}>
                    <Ionicons name="image" color={colors.mutedForeground} size={40} />
                  </View>
                  <Text
                    style={[styles.portfolioDescription, {color: colors.foreground}]}
                    numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews Section */}
        {professional.reviews && professional.reviews.length > 0 && (
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Reseñas</Text>
              <Text style={[styles.reviewCount, {color: colors.mutedForeground}]}>
                ({professional.reviews.length})
              </Text>
            </View>
            {professional.reviews.slice(0, 3).map((review: any) => (
              <View key={review.id} style={[styles.reviewCard, {borderBottomColor: colors.border}]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewAuthor, {color: colors.foreground}]}>
                    {review.author}
                  </Text>
                  <View style={styles.reviewRating}>
                    {[...Array(review.rating)].map((_, i) => (
                      <Ionicons key={i} name="star" color="#FFD700" size={14} />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewComment, {color: colors.foreground}]} numberOfLines={3}>
                  {review.comment}
                </Text>
                <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}>
                  {new Date(review.date).toLocaleDateString("es-MX")}
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
              if (professional.services && professional.services.length > 0) {
                setSelectedService(professional.services[0]);
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
          provider={professional}
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
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  location: {
    fontSize: 15,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: "700",
  },
  servicesCount: {
    fontSize: 14,
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
  bioText: {
    fontSize: 15,
    lineHeight: 22,
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
  serviceCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceDetailText: {
    fontSize: 14,
  },
  servicePrice: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
  },
  bookButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  bookButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  portfolioScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  portfolioItem: {
    width: 140,
    borderRadius: 12,
    overflow: "hidden",
  },
  portfolioPlaceholder: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  portfolioDescription: {
    padding: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  reviewCount: {
    fontSize: 14,
  },
  reviewCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: "600",
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
  },
});
