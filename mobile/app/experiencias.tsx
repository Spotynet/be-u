import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";

export default function ExperienciasScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Experiencias</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.comingSoonContainer}>
          <View style={[styles.iconContainer, {backgroundColor: colors.primary + "15"}]}>
            <Ionicons name="sparkles" color={colors.primary} size={64} />
          </View>
          <Text style={[styles.comingSoonTitle, {color: colors.foreground}]}>Próximamente</Text>
          <Text style={[styles.comingSoonText, {color: colors.mutedForeground}]}>
            Descubre experiencias únicas y momentos especiales que transformarán tu rutina de
            belleza
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" color={colors.primary} size={20} />
              <Text style={[styles.featureText, {color: colors.foreground}]}>
                Retiros de belleza
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" color={colors.primary} size={20} />
              <Text style={[styles.featureText, {color: colors.foreground}]}>
                Workshops y clases
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" color={colors.primary} size={20} />
              <Text style={[styles.featureText, {color: colors.foreground}]}>
                Eventos exclusivos
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" color={colors.primary} size={20} />
              <Text style={[styles.featureText, {color: colors.foreground}]}>Tours de belleza</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.notifyButton, {backgroundColor: colors.primary}]}
            activeOpacity={0.8}>
            <Ionicons name="notifications" color="#ffffff" size={20} />
            <Text style={styles.notifyButtonText}>Notificarme cuando esté disponible</Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  featuresList: {
    gap: 16,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "500",
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  notifyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
