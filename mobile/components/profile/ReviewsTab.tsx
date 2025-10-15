import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";

interface ReviewsTabProps {
  userRole: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

export function ReviewsTab({userRole}: ReviewsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Mock reviews data
  const [reviews] = useState<any[]>([
    {
      id: 1,
      rating: 5,
      comment:
        "Excelente servicio! Ana es muy profesional y el resultado fue increíble. Definitivamente volveré.",
      providerName: "Ana López",
      serviceName: "Corte y Peinado",
      date: "2024-12-15",
      photos: [],
    },
    {
      id: 2,
      rating: 4,
      comment:
        "Muy buen lugar, ambiente agradable y atención de calidad. Solo el tiempo de espera fue un poco largo.",
      providerName: "Be-U Spa Premium",
      serviceName: "Color Completo",
      date: "2024-12-10",
      photos: [],
    },
    {
      id: 3,
      rating: 5,
      comment: "Sofía hizo un trabajo increíble con mi manicure. Super recomendada!",
      providerName: "Sofía Martínez",
      serviceName: "Manicure",
      date: "2024-12-08",
      photos: [],
    },
  ]);

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
                  {review.providerName}
                </Text>
                <Text style={[styles.serviceName, {color: colors.mutedForeground}]}>
                  {review.serviceName}
                </Text>
              </View>
              <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}>
                {new Date(review.date).toLocaleDateString("es-MX", {
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
});
