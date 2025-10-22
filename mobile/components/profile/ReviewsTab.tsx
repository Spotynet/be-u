import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/features/auth";
import {useReviews} from "@/features/reviews";

interface ReviewsTabProps {
  userRole: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

export function ReviewsTab({userRole}: ReviewsTabProps) {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const {user} = useAuth();

  // Determine review type based on user role
  const reviewType =
    userRole === "CLIENT" ? "client" : userRole === "PROFESSIONAL" ? "professional" : "place";

  // Fetch real reviews data
  const {reviews, isLoading, error, refreshReviews} = useReviews(user?.id, reviewType);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" color={colors.mutedForeground} size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay reseñas</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
        {userRole === "CLIENT"
          ? "Aún no has escrito ninguna reseña. Después de completar una cita, podrás dejar una reseña."
          : "Aún no has recibido reseñas. Cuando tus clientes completen servicios, sus reseñas aparecerán aquí."}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle-outline" color="#ef4444" size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>Error al cargar reseñas</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, {backgroundColor: colors.primary}]}
        onPress={refreshReviews}
        activeOpacity={0.9}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.emptyState}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>Cargando reseñas...</Text>
    </View>
  );

  // Show loading state
  if (isLoading) {
    return renderLoadingState();
  }

  // Show error state
  if (error) {
    return renderErrorState();
  }

  // Show empty state
  if (reviews.length === 0) {
    return renderEmptyState();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.reviewsList}>
        {reviews.map((review) => (
          <View key={review.id} style={[styles.reviewCard, {backgroundColor: colors.card}]}>
            <View style={styles.reviewHeader}>
              <View style={styles.headerLeft}>
                <Text style={[styles.providerName, {color: colors.foreground}]}>
                  {userRole === "CLIENT"
                    ? review.professional_name || review.place_name || "Proveedor"
                    : review.client_name || "Cliente"}
                </Text>
                <Text style={[styles.serviceName, {color: colors.mutedForeground}]}>
                  {review.service_name || "Servicio"}
                </Text>
              </View>
              <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}>
                {new Date(review.created_at).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= review.rating ? "star" : "star-outline"}
                  color={star <= review.rating ? "#FFA500" : colors.mutedForeground}
                  size={16}
                />
              ))}
              <Text style={[styles.ratingText, {color: colors.foreground}]}>{review.rating}.0</Text>
            </View>
            <Text style={[styles.reviewText, {color: colors.foreground}]}>{review.comment}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  reviewsList: {
    padding: 16,
  },
  reviewCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewDate: {
    fontSize: 13,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
