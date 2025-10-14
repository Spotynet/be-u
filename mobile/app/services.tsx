import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useAuth} from "@/features/auth";
import {useServiceManagement} from "@/features/services";
import {ServiceList} from "@/components/services";
import {useRouter} from "expo-router";
import {UserService} from "@/types/global";

export default function ServicesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const {services, isLoading, error, fetchMyServices, deleteService, toggleServiceStatus} =
    useServiceManagement();

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  useEffect(() => {
    if (isAuthenticated && isProvider) {
      fetchMyServices();
    }
  }, [isAuthenticated, isProvider]);

  const handleEdit = (service: UserService) => {
    // Navigate to edit screen (to be created)
    Alert.alert("Editar Servicio", `Editar: ${service.name}`, [{text: "OK", style: "default"}]);
  };

  const handleDelete = (service: UserService) => {
    Alert.alert("Eliminar Servicio", `¿Estás seguro que deseas eliminar "${service.name}"?`, [
      {text: "Cancelar", style: "cancel"},
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteService(service.id, service.type),
      },
    ]);
  };

  const handleToggleStatus = (service: UserService) => {
    toggleServiceStatus(service.id, service.type, service.is_active);
  };

  const handleCreateService = () => {
    // Navigate to create service screen
    router.push("/service/create");
  };

  // Redirect if not a provider
  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {backgroundColor: colors.background, borderBottomColor: colors.border},
          ]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mis Servicios</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Solo profesionales y lugares pueden gestionar servicios
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
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mis Servicios</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateService}
          activeOpacity={0.7}>
          <Ionicons name="add" color={colors.primary} size={28} />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {isLoading && services.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando servicios...
          </Text>
        </View>
      ) : (
        <ServiceList
          services={services}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          isLoading={isLoading}
        />
      )}
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  addButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
  loadingText: {
    fontSize: 15,
  },
});





