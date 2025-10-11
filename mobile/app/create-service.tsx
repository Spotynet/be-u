import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, Alert} from "react-native";
import {Stack, useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useAuth} from "@/features/auth";
import {useServiceManagement} from "@/features/services";
import {ServiceForm} from "@/components/services/ServiceForm";
import {ServiceFormData} from "@/types/global";

export default function CreateServiceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user} = useAuth();
  const {createService, isLoading} = useServiceManagement();

  const isPlaceUser = user?.role === "PLACE";
  const isProfessionalUser = user?.role === "PROFESSIONAL";

  // Redirect if not authorized
  React.useEffect(() => {
    if (user && !isPlaceUser && !isProfessionalUser) {
      Alert.alert("Acceso denegado", "Solo profesionales y lugares pueden crear servicios", [
        {text: "OK", onPress: () => router.back()},
      ]);
    }
  }, [user, isPlaceUser, isProfessionalUser]);

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      await createService(data);
      Alert.alert("Éxito", "Servicio creado correctamente", [
        {text: "OK", onPress: () => router.back()},
      ]);
    } catch (error) {
      // Error is already handled in the hook
      console.error("Error creating service:", error);
    }
  };

  const handleBack = () => {
    Alert.alert("¿Salir sin guardar?", "Los cambios no guardados se perderán", [
      {text: "Cancelar", style: "cancel"},
      {text: "Salir", style: "destructive", onPress: () => router.back()},
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Crear Servicio",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.container, {backgroundColor: colors.background}]}>
        {/* Header Info */}
        <View
          style={[styles.headerInfo, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={[styles.headerIcon, {backgroundColor: colors.primary + "20"}]}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>Nuevo Servicio</Text>
            <Text style={[styles.headerSubtitle, {color: colors.mutedForeground}]}>
              {isPlaceUser
                ? "Agrega un nuevo servicio a tu establecimiento"
                : "Agrega un nuevo servicio profesional"}
            </Text>
          </View>
        </View>

        {/* Form */}
        <ServiceForm isPlaceUser={isPlaceUser} onSubmit={handleSubmit} isSubmitting={isLoading} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
});
