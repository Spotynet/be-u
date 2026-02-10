import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useProfileCustomization} from "@/features/profile/hooks/useProfileCustomization";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
}

interface ServiceManagerProps {}

export const ServiceManager = ({}: ServiceManagerProps) => {
  const {colors} = useThemeVariant();
  const {data, isLoading, createService, updateService, deleteService} = useProfileCustomization();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    description: "",
    price: 0,
    duration_minutes: 60,
    category: "",
    is_active: true,
  });

  const services = data.services || [];

  const categories = ["Belleza", "Cuidado Personal", "Mascotas", "Salud", "Bienestar", "Otros"];

  const handleAddService = async () => {
    if (!newService.name || !newService.description || !newService.price) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      await createService({
        name: newService.name!,
        description: newService.description!,
        price: newService.price!,
        duration_minutes: newService.duration_minutes || 60,
        category: newService.category || "Otros",
        is_active: newService.is_active ?? true,
      });

      setNewService({
        name: "",
        description: "",
        price: 0,
        duration_minutes: 60,
        category: "",
        is_active: true,
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating service:", error);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setNewService(service);
    setShowAddModal(true);
  };

  const handleUpdateService = async () => {
    if (!editingService || !newService.name || !newService.description || !newService.price) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      await updateService(editingService.id, {
        name: newService.name!,
        description: newService.description!,
        price: newService.price!,
        duration_minutes: newService.duration_minutes || 60,
        category: newService.category || "Otros",
        is_active: newService.is_active ?? true,
      });

      setEditingService(null);
      setNewService({
        name: "",
        description: "",
        price: 0,
        duration_minutes: 60,
        category: "",
        is_active: true,
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleDeleteService = (serviceId: number) => {
    Alert.alert("Eliminar servicio", "¿Estás seguro que deseas eliminar este servicio?", [
      {text: "Cancelar", style: "cancel"},
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteService(serviceId);
          } catch (error) {
            console.error("Error deleting service:", error);
          }
        },
      },
    ]);
  };

  const toggleServiceStatus = async (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    try {
      await updateService(serviceId, {is_active: !service.is_active});
    } catch (error) {
      console.error("Error updating service status:", error);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingService(null);
    setNewService({
      name: "",
      description: "",
      price: 0,
      duration_minutes: 60,
      category: "",
      is_active: true,
    });
  };

  const renderServiceCard = (service: Service) => (
    <View
      key={service.id}
      style={[styles.serviceCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, {color: colors.foreground}]}>{service.name}</Text>
          <View style={styles.serviceMeta}>
            <Text style={[styles.servicePrice, {color: colors.primary}]}>${Math.round(Number(service.price))}</Text>
            <Text style={[styles.serviceDuration, {color: colors.mutedForeground}]}>
              {service.duration_minutes} min
            </Text>
            <View style={[styles.categoryBadge, {backgroundColor: colors.muted}]}>
              <Text style={[styles.categoryText, {color: colors.mutedForeground}]}>
                {service.category}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.statusToggle,
            {backgroundColor: service.is_active ? "#10b981" : colors.muted},
          ]}
          onPress={() => toggleServiceStatus(service.id)}
          activeOpacity={0.7}>
          <Text style={styles.statusText}>{service.is_active ? "Activo" : "Inactivo"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
        {service.description}
      </Text>

      <View style={styles.serviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.primary}]}
          onPress={() => handleEditService(service)}
          activeOpacity={0.9}>
          <Ionicons name="create-outline" size={16} color="#ffffff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: "#ef4444"}]}
          onPress={() => handleDeleteService(service.id)}
          activeOpacity={0.9}>
          <Ionicons name="trash-outline" size={16} color="#ffffff" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando servicios...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>
          Servicios Ofrecidos ({services.length})
        </Text>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Gestiona los servicios que ofreces y sus precios
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.addButton, {backgroundColor: colors.primary}]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.9}>
        <Ionicons name="add" color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>Agregar Servicio</Text>
      </TouchableOpacity>

      {services.length === 0 ? (
        <View style={[styles.emptyState, {backgroundColor: colors.muted}]}>
          <Ionicons name="briefcase-outline" color={colors.mutedForeground} size={64} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay servicios</Text>
          <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
            Agrega servicios para que los clientes puedan reservarlos
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
          {services.map(renderServiceCard)}
        </ScrollView>
      )}

      {/* Add/Edit Service Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, {backgroundColor: colors.background}]}>
          <View style={[styles.modalHeader, {borderBottomColor: colors.border}]}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={[styles.modalCancel, {color: colors.primary}]}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              {editingService ? "Editar Servicio" : "Agregar Servicio"}
            </Text>
            <TouchableOpacity onPress={editingService ? handleUpdateService : handleAddService}>
              <Text style={[styles.modalSave, {color: colors.primary}]}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, {color: colors.foreground}]}>Nombre del Servicio</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={newService.name}
                onChangeText={(text) => setNewService({...newService, name: text})}
                placeholder="Ej: Corte de cabello"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, {color: colors.foreground}]}>Descripción</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={newService.description}
                onChangeText={(text) => setNewService({...newService, description: text})}
                placeholder="Describe el servicio..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 10}]}>
                <Text style={[styles.label, {color: colors.foreground}]}>Precio ($)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={newService.price?.toString() || ""}
                  onChangeText={(text) =>
                    setNewService({...newService, price: parseFloat(text) || 0})
                  }
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, {flex: 1, marginLeft: 10}]}>
                <Text style={[styles.label, {color: colors.foreground}]}>Duración (min)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={newService.duration_minutes?.toString() || ""}
                  onChangeText={(text) =>
                    setNewService({...newService, duration_minutes: parseInt(text) || 60})
                  }
                  placeholder="60"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, {color: colors.foreground}]}>Categoría</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor:
                          newService.category === category ? colors.primary : colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setNewService({...newService, category})}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.categoryOptionText,
                        {color: newService.category === category ? "#ffffff" : colors.foreground},
                      ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  servicesList: {
    flex: 1,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  serviceDuration: {
    fontSize: 14,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  categoriesScroll: {
    marginTop: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
