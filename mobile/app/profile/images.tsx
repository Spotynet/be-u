import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "../../contexts/ThemeVariantContext";
import {ImageGallery} from "../../components/profile/ImageGallery";
import {BackButton} from "../../components/ui/BackButton";
import {useAuth} from "../../features/auth/hooks/useAuth";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function ImagesManagementScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();
  const router = useRouter();

  // Check if user is a provider (PROFESSIONAL or PLACE)
  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  // Redirect if not authenticated or not a provider
  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <BackButton fallbackRoute="/(tabs)/perfil" style={styles.backButton} />
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>
              Galería de Imágenes
            </Text>
          </View>
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>
            Acceso Restringido
          </Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Solo profesionales y lugares pueden gestionar imágenes de perfil
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 16,
          },
        ]}>
        <BackButton fallbackRoute="/(tabs)/perfil" style={styles.backButton} />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>
            Galería de Imágenes
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {padding: 16}]}
        showsVerticalScrollIndicator={false}>
        <ImageGallery maxImages={10} />
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
});

