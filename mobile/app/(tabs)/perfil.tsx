import {View, Text, StyleSheet} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {Ionicons} from "@expo/vector-icons";
import React from "react";
import {AppHeader} from "@/components/ui/AppHeader";
import {ClientProfileTab, ProfessionalProfileTab} from "@/components/profile";
import {Redirect} from "expo-router";

export default function Perfil() {
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();

  const isClient = user?.role === "CLIENT";

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
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
