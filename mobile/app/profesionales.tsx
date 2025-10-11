import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react";
import {mockProfessionals} from "@/lib/mockData";

export default function ProfesionalesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        setIsLoading(true);
        // Simulate loading
        await new Promise((resolve) => setTimeout(resolve, 800));
        setProfessionals(mockProfessionals);
      } catch (error) {
        console.error("Error loading professionals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfessionals();
  }, []);

  const renderProfessionalCard = (professional: any) => (
    <TouchableOpacity
      key={professional.id}
      style={[styles.professionalCard, {backgroundColor: colors.card}]}
      onPress={() => router.push(`/professional/${professional.id}` as any)}
      activeOpacity={0.8}>
      <View style={[styles.professionalAvatar, {backgroundColor: "#f0f0f0"}]}>
        <Text style={styles.avatarText}>
          {professional.name.charAt(0)}
          {professional.last_name.charAt(0)}
        </Text>
      </View>
      <View style={styles.professionalInfo}>
        <Text style={[styles.professionalName, {color: colors.foreground}]} numberOfLines={1}>
          {professional.name} {professional.last_name}
        </Text>
        <Text
          style={[styles.professionalSpecialty, {color: colors.mutedForeground}]}
          numberOfLines={1}>
          {professional.specialty}
        </Text>
        <Text style={[styles.professionalCity, {color: colors.mutedForeground}]} numberOfLines={1}>
          {professional.city}
        </Text>
        <View style={styles.professionalRating}>
          <Ionicons name="star" color="#FFD700" size={14} />
          <Text style={[styles.ratingText, {color: colors.foreground}]}>
            {professional.rating} ({professional.reviewsCount})
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
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Profesionales</Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="people-outline" color={colors.mutedForeground} size={64} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando profesionales...
          </Text>
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
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Profesionales</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search" color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Encuentra expertos en belleza
        </Text>

        {professionals.length > 0 ? (
          <View style={styles.professionalsList}>{professionals.map(renderProfessionalCard)}</View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" color={colors.mutedForeground} size={64} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay profesionales disponibles
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Pronto tendremos más expertos para ti
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
  professionalsList: {
    gap: 12,
  },
  professionalCard: {
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
  professionalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  professionalInfo: {
    flex: 1,
    gap: 2,
  },
  professionalName: {
    fontSize: 15,
    fontWeight: "600",
  },
  professionalSpecialty: {
    fontSize: 13,
  },
  professionalCity: {
    fontSize: 12,
  },
  professionalRating: {
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
