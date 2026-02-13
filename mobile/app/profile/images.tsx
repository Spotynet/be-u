import React from "react";
import {View, Text, StyleSheet, ScrollView} from "react-native";
import {useThemeVariant} from "../../contexts/ThemeVariantContext";
import {ImageGallery} from "../../components/profile/ImageGallery";
import {AppHeader} from "../../components/ui/AppHeader";
import {useAuth} from "../../features/auth/hooks/useAuth";
import {Ionicons} from "@expo/vector-icons";

export default function ImagesManagementScreen() {
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppHeader
          title="Galería de Imágenes"
          showBackButton
          backFallbackRoute="/(tabs)/perfil"
          backgroundColor={colors.background}
          borderBottom={colors.border}
        />
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
      <AppHeader
        title="Galería de Imágenes"
        showBackButton
        backFallbackRoute="/(tabs)/perfil"
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
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

