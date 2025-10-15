import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {useRouter} from "expo-router";

export function FavoritesTab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  // Mock favorites data
  const [favorites] = useState<any[]>([
    {
      id: 1,
      type: "PROFESSIONAL",
      name: "Ana López",
      specialty: "Colorimetr ísta",
      rating: 4.9,
      avatar: "AL",
    },
    {
      id: 2,
      type: "PLACE",
      name: "Be-U Spa Premium",
      specialty: "Salón de belleza",
      rating: 4.8,
      avatar: "BS",
    },
    {
      id: 3,
      type: "PROFESSIONAL",
      name: "Sofía Martínez",
      specialty: "Estilista",
      rating: 4.7,
      avatar: "SM",
    },
    {
      id: 4,
      type: "PLACE",
      name: "Glamour Studio",
      specialty: "Centro de estética",
      rating: 4.6,
      avatar: "GS",
    },
  ]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" color={colors.mutedForeground} size={64} />
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay favoritos</Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
        Guarda tus profesionales y lugares favoritos para acceder a ellos rápidamente.
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, {backgroundColor: colors.primary}]}
        onPress={() => router.push("/explore")}>
        <Text style={styles.exploreButtonText}>Explorar</Text>
      </TouchableOpacity>
    </View>
  );

  if (favorites.length === 0) {
    return renderEmptyState();
  }

  const getAvatarColor = (index: number) => {
    const colors = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
    return colors[index % colors.length];
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
                item.type === "PROFESSIONAL" ? `/professional/${item.id}` : `/place/${item.id}`;
              router.push(route as any);
            }}
            activeOpacity={0.7}>
            <View style={[styles.avatar, {backgroundColor: getAvatarColor(index)}]}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
            </View>
            <Text style={[styles.name, {color: colors.foreground}]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.specialty, {color: colors.mutedForeground}]} numberOfLines={1}>
              {item.specialty}
            </Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text style={[styles.ratingText, {color: colors.mutedForeground}]}>
                {item.rating}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={(e) => {
                e.stopPropagation();
                // Handle unfavorite
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
