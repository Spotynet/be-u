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
  const [reviews] = useState<any[]>([]);

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
      {reviews.map((review, index) => (
        <View key={index} style={[styles.reviewCard, {backgroundColor: colors.card}]}>
          <View style={styles.reviewHeader}>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" color="#FFD700" size={16} />
              ))}
            </View>
            <Text style={[styles.reviewDate, {color: colors.mutedForeground}]}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.reviewText, {color: colors.foreground}]}>Review text</Text>
        </View>
      ))}
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
  reviewCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 4,
  },
  reviewDate: {
    fontSize: 13,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
