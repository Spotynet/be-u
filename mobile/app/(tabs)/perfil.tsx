import {View, Text, StyleSheet} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {Ionicons} from "@expo/vector-icons";
import React from "react";
import {AppHeader} from "@/components/ui/AppHeader";
import {ClientProfileTab, ProfessionalProfileTab} from "@/components/profile";

export default function Perfil() {
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();

  const isClient = user?.role === "CLIENT";

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppHeader
          title="Perfil"
          showBackButton={false}
          backgroundColor={colors.background}
          borderBottom={colors.border}
        />
        <View style={styles.centeredContainer}>
          <Ionicons name="person-outline" size={80} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Inicia sesión para ver tu perfil
          </Text>
          <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
            Accede a tu cuenta para gestionar tu perfil y tus favoritos
          </Text>
        </View>
      </View>
    );
  }

  return isClient ? <ClientProfileTab /> : <ProfessionalProfileTab />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
});
