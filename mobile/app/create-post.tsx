import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {postFormats} from "@/constants/postFormats";

export default function CreatePostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user} = useAuth();

  // Filter post formats based on user role
  const availableFormats = postFormats.filter((format) => {
    if (!user) return false;
    return format.roles.includes(user.role);
  });

  const handleFormatSelect = (formatId: string) => {
    // Navigate to specific creator screen
    router.push(`/posts/create-${formatId}` as any);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" color={colors.foreground} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Crear Publicación</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          ¿Qué tipo de publicación quieres crear?
        </Text>

        <View style={styles.formatsGrid}>
          {availableFormats.map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[styles.formatCard, {backgroundColor: colors.card}]}
              activeOpacity={0.8}
              onPress={() => handleFormatSelect(format.id)}>
              <View style={[styles.formatIcon, {backgroundColor: format.color + "20"}]}>
                <Ionicons name={format.icon as any} color={format.color} size={32} />
              </View>
              <Text style={[styles.formatTitle, {color: colors.foreground}]}>{format.title}</Text>
              <Text style={[styles.formatDescription, {color: colors.mutedForeground}]}>
                {format.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty state if no formats available */}
        {availableFormats.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" color={colors.mutedForeground} size={64} />
            <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
              No hay formatos disponibles
            </Text>
            <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
              Por favor, inicia sesión para crear publicaciones
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  formatsGrid: {
    gap: 16,
  },
  formatCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formatIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  formatDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
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
});
