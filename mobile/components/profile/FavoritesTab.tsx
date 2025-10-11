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
  const [favorites] = useState<any[]>([]);

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {favorites.map((item, index) => (
          <TouchableOpacity key={index} style={[styles.card, {backgroundColor: colors.card}]}>
            <View style={[styles.avatar, {backgroundColor: "#FFB6C1"}]}>
              <Text style={styles.avatarText}>?</Text>
            </View>
            <Text style={[styles.name, {color: colors.foreground}]} numberOfLines={1}>
              Name
            </Text>
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
    padding: 12,
    gap: 12,
  },
  card: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
