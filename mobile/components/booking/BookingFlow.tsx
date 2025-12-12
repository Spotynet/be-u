import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect} from "react";
import {useRouter} from "expo-router";
import {providerApi, profileCustomizationApi} from "@/lib/api";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface BookingFlowProps {
  placeId: number;
  serviceId?: number;
  onClose?: () => void;
}

export const BookingFlow = ({placeId, serviceId, onClose}: BookingFlowProps) => {
  const {colors} = useThemeVariant();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("10:00 am");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookingData();
  }, [placeId, serviceId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileResponse = await providerApi.getPlaceProfile(placeId);
      setProfile(profileResponse.data);

      const servicesResponse = await profileCustomizationApi.getCustomServices();
      setServices(servicesResponse.data || []);

      // Mock professionals data - replace with actual API call
      setProfessionals([
        {id: 1, name: "Ana García", rating: 4.9, avatar: "AG"},
        {id: 2, name: "Carlos López", rating: 4.8, avatar: "CL"},
        {id: 3, name: "María Rodríguez", rating: 4.9, avatar: "MR"},
        {id: 4, name: "Pedro Martínez", rating: 4.7, avatar: "PM"},
        {id: 5, name: "Laura Sánchez", rating: 4.9, avatar: "LS"},
      ]);

      // Set selected service if provided
      if (serviceId) {
        const service = services.find((s) => s.id === serviceId);
        setSelectedService(service);
      }
    } catch (err: any) {
      console.error("Error loading booking data:", err);
      setError("Error al cargar los datos de reserva");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase();
  };

  const handleContinue = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      Alert.alert("Información incompleta", "Por favor selecciona todos los campos requeridos.");
      return;
    }

    // Navigate to next step or complete booking
    router.push(`/booking/confirm/${placeId}`);
  };

  const handleAddAnotherService = () => {
    // Navigate to service selection
    router.push(`/booking/services/${placeId}`);
  };

  const handleSkipAdditionalServices = () => {
    // Continue without additional services
    handleContinue();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
          Cargando datos de reserva...
        </Text>
      </View>
    );
  }

  if (error || !profile) {
    // Don't show error, just close the modal
    if (onClose) {
      onClose();
    }
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.background}]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="chevron-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>
          Reserva: Salones: Reservar 1
        </Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={{uri: "https://via.placeholder.com/400x200"}}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Profile Summary */}
        <View style={styles.profileSummary}>
          <Text style={[styles.salonTitle, {color: colors.foreground}]}>Tu salón</Text>
          <View style={styles.summaryRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" color="#fbbf24" size={16} />
              <Text style={[styles.ratingText, {color: colors.foreground}]}>
                {profile?.rating?.toFixed(1) || "4.9"}
              </Text>
            </View>
            <Text style={[styles.distanceText, {color: colors.mutedForeground}]}>560m</Text>
          </View>
          <Text style={[styles.followersText, {color: colors.mutedForeground}]}>
            {profile?.followers_count || 1690} Seguidores
          </Text>
        </View>

        {/* Selected Services */}
        {selectedService && (
          <View style={styles.selectedServicesContainer}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
              Servicios seleccionados
            </Text>
            <View style={[styles.serviceCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.serviceName, {color: colors.foreground}]}>
                {selectedService.name}
              </Text>
              <View style={styles.serviceDetails}>
                <Text style={[styles.serviceDuration, {color: colors.mutedForeground}]}>
                  {selectedService.duration} min
                </Text>
                <Text style={[styles.servicePrice, {color: colors.primary}]}>
                  $ {selectedService.price} MXN
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Professional Selection */}
        <View style={styles.professionalsContainer}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Elige un profesional
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.professionalsScroll}>
            {professionals.map((professional) => (
              <TouchableOpacity
                key={professional.id}
                style={[
                  styles.professionalCard,
                  {
                    backgroundColor:
                      selectedProfessional?.id === professional.id
                        ? colors.primary + "20"
                        : colors.card,
                    borderColor:
                      selectedProfessional?.id === professional.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedProfessional(professional)}>
                <View style={styles.professionalAvatar}>
                  <Text style={[styles.professionalAvatarText, {color: colors.foreground}]}>
                    {professional.avatar}
                  </Text>
                  <View style={[styles.professionalRating, {backgroundColor: colors.primary}]}>
                    <Text style={styles.professionalRatingText}>{professional.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.professionalName, {color: colors.foreground}]}>
                  {professional.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Calendario</Text>
          <View style={[styles.calendarCard, {backgroundColor: colors.card}]}>
            <Text style={[styles.monthTitle, {color: colors.foreground}]}>Julio</Text>
            <View style={styles.calendarGrid}>
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
                <Text key={day} style={[styles.dayHeader, {color: colors.mutedForeground}]}>
                  {day}
                </Text>
              ))}
              {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor:
                        selectedDate === day.toString() ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedDate(day.toString())}>
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: selectedDate === day.toString() ? "#ffffff" : colors.foreground,
                      },
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.timeContainer}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Hora</Text>
          <View style={[styles.timeCard, {backgroundColor: colors.card}]}>
            <Text style={[styles.timeText, {color: colors.foreground}]}>{selectedTime}</Text>
            <Ionicons name="chevron-down" color={colors.mutedForeground} size={20} />
          </View>
        </View>

        {/* Add Another Service */}
        <View style={styles.addServiceContainer}>
          <Text style={[styles.addServiceTitle, {color: colors.foreground}]}>
            ¿Deseas agregar otro servicio?
          </Text>
          <TouchableOpacity
            style={[styles.addServiceButton, {backgroundColor: colors.muted}]}
            onPress={handleSkipAdditionalServices}>
            <Text style={[styles.addServiceButtonText, {color: colors.foreground}]}>No</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    gap: 16,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  favoriteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroImageContainer: {
    height: 200,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  profileSummary: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  salonTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  distanceText: {
    fontSize: 14,
  },
  followersText: {
    fontSize: 14,
  },
  selectedServicesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceDuration: {
    fontSize: 14,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  professionalsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  professionalsScroll: {
    marginTop: 12,
  },
  professionalCard: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  professionalAvatarText: {
    fontSize: 18,
    fontWeight: "600",
  },
  professionalRating: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  professionalRatingText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  professionalName: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  calendarCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayHeader: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dayButton: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  timeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  addServiceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addServiceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  addServiceButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  addServiceButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  continueButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});
