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
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "../../contexts/ThemeVariantContext";
import {profileCustomizationApi, serviceApi} from "../../lib/api";
import {formatPrice as formatPriceUtil} from "../../lib/priceUtils";
import {useNavigation} from "../../hooks/useNavigation";
import {useAuth} from "../../features/auth/hooks/useAuth";
import {BackButton} from "../../components/ui/BackButton";

interface CustomService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceManagementScreenProps {
  embedded?: boolean;
}

export default function ServiceManagementScreen({embedded = false}: ServiceManagementScreenProps) {
  const router = useRouter();
  const {goBack} = useNavigation();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is a provider (PROFESSIONAL or PLACE)
  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  // Redirect if not authenticated or not a provider
  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        {!embedded && (
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
                Servicios
              </Text>
            </View>
          </View>
        )}
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>
            Acceso Restringido
          </Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Solo profesionales y lugares pueden gestionar servicios
          </Text>
        </View>
      </View>
    );
  }

  const loadServices = async () => {
    try {
      // Use CustomService system (where services are actually stored)
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

  const formatPrice = (price: number) => formatPriceUtil(price, {suffix: " MXN"});

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        {!embedded && (
          <View style={[styles.header, {paddingTop: insets.top + 44, paddingBottom: 12}]}>
            <TouchableOpacity onPress={() => goBack("/(tabs)/perfil")}>
              <Ionicons name="arrow-back" color={colors.foreground} size={24} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mis Servicios</Text>
            <View style={{width: 24}} />
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header (only when not embedded) */}
      {!embedded && (
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top + 16, 20),
              paddingBottom: 12,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
          ]}>
          <TouchableOpacity
            onPress={() => goBack("/(tabs)/perfil")}
            style={styles.backButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, {color: colors.foreground}]}>Mis Servicios</Text>
          </View>
          <View style={{width: 44}} />
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}>
        {/* Agregar servicio - diseño nuevo */}
        <TouchableOpacity
          onPress={handleAddService}
          style={[styles.addServiceButton, {borderColor: colors.primary + "60", backgroundColor: colors.primary + "08"}]}
          activeOpacity={0.7}
          accessibilityLabel="Agregar servicio">
          <View style={[styles.addServiceIconWrap, {backgroundColor: colors.primary + "20"}]}>
            <Ionicons name="add" color={colors.primary} size={20} />
          </View>
          <Text style={[styles.addServiceLabel, {color: colors.primary}]}>Agregar servicio</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={18} />
        </TouchableOpacity>

        {/* Services List */}
        {services.length === 0 ? (
          <View style={[styles.emptyState, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={[styles.emptyIcon, {backgroundColor: colors.muted}]}>
              <Ionicons name="briefcase-outline" color={colors.primary} size={28} />
            </View>
            <Text style={[styles.emptyStateTitle, {color: colors.foreground}]}>Crea tu primer servicio</Text>
            <Text style={[styles.emptyStateDescription, {color: colors.mutedForeground}]}>
              Un catálogo claro mejora conversiones. Define duración, precio y una descripción breve.
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
              <View style={[styles.serviceAccent, {backgroundColor: colors.primary}]} />

              <View style={styles.serviceBody}>
                <View style={styles.serviceTopRow}>
                  <View style={styles.serviceInfo}>
                    <Text
                      style={[styles.serviceName, {color: colors.foreground}]}
                      numberOfLines={1}>
                      {service.name}
                    </Text>
                    {!!service.description && (
                      <Text
                        style={[styles.serviceDescription, {color: colors.mutedForeground}]}
                        numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.serviceActions}>
                    <TouchableOpacity
                      style={[styles.iconButton, {backgroundColor: colors.muted, borderColor: colors.border}]}
                      onPress={() => handleEditService(service.id)}
                      activeOpacity={0.8}
                      accessibilityLabel={`Editar ${service.name}`}>
                      <Ionicons name="pencil" color={colors.foreground} size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, {backgroundColor: "#ef4444", borderColor: "rgba(0,0,0,0)"}]}
                      onPress={() => handleDeleteService(service.id, service.name)}
                      activeOpacity={0.8}
                      accessibilityLabel={`Eliminar ${service.name}`}>
                      <Ionicons name="trash" color="#ffffff" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={[styles.metaChip, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                    <Ionicons name="time-outline" color={colors.mutedForeground} size={14} />
                    <Text style={[styles.metaText, {color: colors.foreground}]}>
                      {service.duration_minutes} min
                    </Text>
                  </View>
                  <View style={[styles.metaChip, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                    <Ionicons name="cash-outline" color={colors.mutedForeground} size={14} />
                    <Text style={[styles.metaText, {color: colors.foreground}]}>
                      {formatPrice(service.price)}
                    </Text>
                  </View>
                </View>
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
    minHeight: 0,
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  addButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  addFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
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
  content: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 16,
    gap: 12,
  },
  addServiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addServiceLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  serviceCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  serviceAccent: {
    width: 4,
  },
  serviceBody: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  serviceTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
  },
  serviceActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
