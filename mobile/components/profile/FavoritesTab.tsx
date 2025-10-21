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
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth";
import {useFavorites} from "@/features/favorites";

export function FavoritesTab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  // Fetch real favorites data
  const {favorites, isLoading, error, removeFavorite, refreshFavorites} = useFavorites();

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" color={colors.mutedForeground} size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay favoritos</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
        Guarda tus profesionales y lugares favoritos para acceder a ellos rápidamente.
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, {backgroundColor: colors.primary}]}
        onPress={() => router.push("/(tabs)/explore")}>
        <Text style={styles.exploreButtonText}>Explorar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle-outline" color="#ef4444" size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>Error al cargar favoritos</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, {backgroundColor: colors.primary}]}
        onPress={refreshFavorites}
        activeOpacity={0.9}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.emptyState}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>Cargando favoritos...</Text>
    </View>
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="heart-outline" color={colors.mutedForeground} size={64} />
        <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
          Inicia sesión para ver tus favoritos
        </Text>
        <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
          Guarda tus profesionales y lugares favoritos para acceder a ellos rápidamente.
        </Text>
        <TouchableOpacity
          style={[styles.exploreButton, {backgroundColor: colors.primary}]}
          onPress={() => router.push("/login")}
          activeOpacity={0.9}>
          <Text style={styles.exploreButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    return renderLoadingState();
  }

  // Show error state
  if (error) {
    return renderErrorState();
  }

  // Show empty state
  if (favorites.length === 0) {
    return renderEmptyState();
  }

  const getAvatarColor = (index: number) => {
    const colors = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
    return colors[index % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      await removeFavorite(favoriteId);
    } catch (err) {
      // Error already handled in hook
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {favorites.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, {backgroundColor: colors.card}]}
            onPress={() => {
              const route =
                item.favorite_type === "PROFESSIONAL"
                  ? `/professional/${item.content_object_id}`
                  : `/place/${item.content_object_id}`;
              router.push(route as any);
            }}
            activeOpacity={0.7}>
            <View style={[styles.avatar, {backgroundColor: getAvatarColor(index)}]}>
              <Text style={styles.avatarText}>{getInitials(item.favorite_name)}</Text>
            </View>
            <Text style={[styles.name, {color: colors.foreground}]} numberOfLines={1}>
              {item.favorite_name}
            </Text>
            <Text style={[styles.specialty, {color: colors.mutedForeground}]} numberOfLines={1}>
              {item.favorite_specialty}
            </Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text style={[styles.ratingText, {color: colors.mutedForeground}]}>
                {item.favorite_rating.toFixed(1)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(item.id);
              }}>
              <Ionicons name="heart" size={20} color="#EF4444" />
            </TouchableOpacity>
          </TouchableOpacity>
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
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  exploreButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 16,
  },
  card: {
    width: "47%",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  specialty: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
  },
});
