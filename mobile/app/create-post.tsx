import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";
import { postFormats } from "@/constants/postFormats";

const ROW_BG = "#f3f4f6";

export default function CreatePostScreen() {
  const { colors } = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  const availableFormats = postFormats.filter((format) => {
    if (!user) return false;
    if (format.id === "video" || format.id === "pet_adoption") return false;
    return format.roles.includes(user.role);
  });

  const handleFormatSelect = (formatId: string) => {
    router.replace(`/posts/create-${formatId}` as any);
  };

  const handleClose = () => {
    router.back();
  };

  if (!user) return null;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        {/* Handle bar */}
        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Crear Publicación
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.closeCircle}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {availableFormats.map((format) => (
            <Pressable
              key={format.id}
              style={({ pressed }) => [
                styles.optionRow,
                { backgroundColor: ROW_BG },
                pressed && styles.optionRowPressed,
              ]}
              onPress={() => handleFormatSelect(format.id)}
            >
              <View
                style={[
                  styles.optionIconWrap,
                  {
                    backgroundColor: format.color + "25",
                    borderColor: format.color + "60",
                  },
                ]}
              >
                <Ionicons
                  name={format.icon as any}
                  size={24}
                  color={format.color}
                />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                  {format.title}
                </Text>
                <Text
                  style={[styles.optionSubtitle, { color: colors.mutedForeground }]}
                >
                  {format.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          ))}
        </ScrollView>

        {availableFormats.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Inicia sesión para crear publicaciones
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 320,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  optionRowPressed: {
    opacity: 0.85,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  empty: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
  },
});
