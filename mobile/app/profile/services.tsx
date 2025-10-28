import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "../../contexts/ThemeVariantContext";
import {profileCustomizationApi} from "../../lib/api";

interface CustomService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
}

export default function ServiceManagementScreen() {
  const router = useRouter();
  const {colors} = useThemeVariant();
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = async () => {
    try {
      const response = await profileCustomizationApi.getCustomServices();
      setServices(response.data || []);
    } catch (error) {
      console.error("Error loading services:", error);
      Alert.alert("Error", "No se pudieron cargar los servicios");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleAddService = () => {
    router.push("/profile/services/create");
  };

  const handleEditService = (serviceId: number) => {
    router.push(`/profile/services/edit/${serviceId}`);
  };

  const handleDeleteService = (serviceId: number, serviceName: string) => {
    Alert.alert("Eliminar Servicio", `¿Estás seguro de que quieres eliminar "${serviceName}"?`, [
      {text: "Cancelar", style: "cancel"},
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await profileCustomizationApi.deleteCustomService(serviceId);
            loadServices();
            Alert.alert("Éxito", "Servicio eliminado correctamente");
          } catch (error) {
            console.error("Error deleting service:", error);
            Alert.alert("Error", "No se pudo eliminar el servicio");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mis Servicios</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mis Servicios</Text>
        <TouchableOpacity onPress={handleAddService}>
          <Ionicons name="add" color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}>
        {/* Add Service Button */}
        <TouchableOpacity
          style={[styles.addServiceButton, {backgroundColor: colors.primary}]}
          onPress={handleAddService}>
          <Ionicons name="add" color="#ffffff" size={20} />
          <Text style={styles.addServiceButtonText}>Agregar Nuevo Servicio</Text>
        </TouchableOpacity>

        {/* Services List */}
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" color={colors.mutedForeground} size={64} />
            <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>
              No tienes servicios
            </Text>
            <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
              Agrega tu primer servicio para comenzar a recibir reservas
            </Text>
          </View>
        ) : (
          services.map((service) => (
            <View
              key={service.id}
              style={[
                styles.serviceCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, {color: colors.foreground}]}>{service.name}</Text>
                <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                  {service.description}
                </Text>
                <View style={styles.serviceDetails}>
                  <View style={styles.serviceDetailItem}>
                    <Ionicons name="time-outline" color={colors.mutedForeground} size={16} />
                    <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                      {service.duration_minutes} min
                    </Text>
                  </View>
                  <View style={styles.serviceDetailItem}>
                    <Ionicons name="cash-outline" color={colors.mutedForeground} size={16} />
                    <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                      ${service.price} MXN
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={[styles.actionButton, {backgroundColor: colors.muted}]}
                  onPress={() => handleEditService(service.id)}>
                  <Ionicons name="pencil" color={colors.foreground} size={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, {backgroundColor: "#ff4444"}]}
                  onPress={() => handleDeleteService(service.id, service.name)}>
                  <Ionicons name="trash" color="#ffffff" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{height: 40}} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 20,
  },
  addServiceButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  serviceDetails: {
    flexDirection: "row",
    gap: 16,
  },
  serviceDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 12,
  },
  serviceActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
