import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {serviceApi} from "@/lib/api";
import {ServiceType} from "@/types/global";
import {CreateServiceTypeModal} from "./CreateServiceTypeModal";

interface ServiceTypeSelectorProps {
  selectedServiceTypeId?: number;
  onSelect: (serviceTypeId: number) => void;
  allowedCategoryIds?: string[];
}

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  selectedServiceTypeId,
  onSelect,
  allowedCategoryIds = [],
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);

  useEffect(() => {
    if (modalVisible) {
      fetchServiceTypes();
    }
  }, [modalVisible, searchQuery]);

  useEffect(() => {
    if (selectedServiceTypeId && serviceTypes.length > 0) {
      const type = serviceTypes.find((t) => t.id === selectedServiceTypeId);
      if (type) {
        setSelectedServiceType(type);
      }
    }
  }, [selectedServiceTypeId, serviceTypes]);

  const fetchServiceTypes = async () => {
    try {
      setLoading(true);
      const response = await serviceApi.getServiceTypes({search: searchQuery});
      const allServiceTypes = response.data.results || [];
      if (!allowedCategoryIds.length) {
        setServiceTypes(allServiceTypes);
        return;
      }
      const normalizedAllowed = new Set(
        allowedCategoryIds.map((item) => item.toLowerCase().trim())
      );
      const filtered = allServiceTypes.filter((serviceType: ServiceType) => {
        const categoryName = String(serviceType.category_name || "").toLowerCase().trim();
        return normalizedAllowed.has(categoryName);
      });
      setServiceTypes(filtered);
    } catch (error) {
      console.error("Error fetching service types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    onSelect(serviceType.id);
    setModalVisible(false);
  };

  const handleServiceTypeCreated = (newServiceType: ServiceType) => {
    setServiceTypes((prev) => [newServiceType, ...prev]);
    handleSelect(newServiceType);
    setCreateModalVisible(false);
  };

  const groupedServiceTypes = serviceTypes.reduce((acc, type) => {
    const category = type.category_name || "Otros";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(type);
    return acc;
  }, {} as Record<string, ServiceType[]>);

  const renderServiceType = ({item}: {item: ServiceType}) => (
    <TouchableOpacity
      style={[
        styles.serviceTypeItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => handleSelect(item)}>
      <View style={[styles.serviceIcon, {backgroundColor: colors.primary + "20"}]}>
        <Ionicons name="cut" size={24} color={colors.primary} />
      </View>
      <View style={styles.serviceTypeInfo}>
        <Text style={[styles.serviceTypeName, {color: colors.foreground}]}>{item.name}</Text>
        {item.description && (
          <Text
            style={[styles.serviceTypeDescription, {color: colors.mutedForeground}]}
            numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  const renderCategory = (category: string, types: ServiceType[]) => (
    <View key={category} style={styles.categorySection}>
      <Text style={[styles.categoryTitle, {color: colors.mutedForeground}]}>{category}</Text>
      {types.map((type) => (
        <View key={type.id}>{renderServiceType({item: type})}</View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: colors.foreground}]}>
        Tipo de servicio <Text style={{color: "#ef4444"}}>*</Text>
      </Text>
      <Text style={[styles.hint, {color: colors.mutedForeground}]}>
        Selecciona o crea un nuevo tipo de servicio
      </Text>

      {selectedServiceType ? (
        <TouchableOpacity
          style={[
            styles.selectedContainer,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}
          onPress={() => setModalVisible(true)}>
          <View style={[styles.selectedIcon, {backgroundColor: colors.primary + "20"}]}>
            <Ionicons name="cut" size={20} color={colors.primary} />
          </View>
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedName, {color: colors.foreground}]}>
              {selectedServiceType.name}
            </Text>
            {selectedServiceType.category_name && (
              <Text style={[styles.selectedCategory, {color: colors.mutedForeground}]}>
                {selectedServiceType.category_name}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.selectButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => setModalVisible(true)}>
          <Ionicons name="list" size={20} color={colors.primary} />
          <Text style={[styles.selectText, {color: colors.foreground}]}>
            Seleccionar tipo de servicio
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.foreground}]}>
                Seleccionar Servicio
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Create New Button */}
            <TouchableOpacity
              style={[styles.createNewButton, {backgroundColor: colors.primary}]}
              onPress={() => {
                setModalVisible(false);
                setCreateModalVisible(true);
              }}>
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.createNewText}>Crear Nuevo Tipo de Servicio</Text>
            </TouchableOpacity>

            <View style={[styles.searchContainer, {backgroundColor: colors.card}]}>
              <Ionicons name="search" size={20} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, {color: colors.foreground}]}
                placeholder="Buscar servicio..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={Object.keys(groupedServiceTypes)}
                keyExtractor={(item) => item}
                renderItem={({item}) => renderCategory(item, groupedServiceTypes[item])}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="cut-outline" size={48} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
                      No se encontraron servicios
                    </Text>
                    <TouchableOpacity
                      style={[styles.emptyButton, {backgroundColor: colors.primary}]}
                      onPress={() => {
                        setModalVisible(false);
                        setCreateModalVisible(true);
                      }}>
                      <Text style={styles.emptyButtonText}>Crear Nuevo</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <CreateServiceTypeModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={handleServiceTypeCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
  },
  selectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  selectedCategory: {
    fontSize: 13,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  selectText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  createNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  createNewText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  serviceTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTypeInfo: {
    flex: 1,
  },
  serviceTypeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  serviceTypeDescription: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
