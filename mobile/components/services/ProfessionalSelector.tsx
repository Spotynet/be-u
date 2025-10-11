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
import {userApi, errorUtils} from "@/lib/api";
import {ProfessionalOption} from "@/types/global";

interface ProfessionalSelectorProps {
  selectedProfessionalId?: number;
  onSelect: (professionalId: number | undefined) => void;
}

export const ProfessionalSelector: React.FC<ProfessionalSelectorProps> = ({
  selectedProfessionalId,
  onSelect,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [modalVisible, setModalVisible] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalOption | null>(null);

  useEffect(() => {
    if (modalVisible) {
      fetchProfessionals();
    }
  }, [modalVisible]);

  useEffect(() => {
    if (selectedProfessionalId && professionals.length > 0) {
      const prof = professionals.find((p) => p.id === selectedProfessionalId);
      if (prof) {
        setSelectedProfessional(prof);
      }
    }
  }, [selectedProfessionalId, professionals]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfessionals({search: searchQuery});
      const profList = response.data.results.map((user: any) => ({
        id: user.professional_profile?.id || user.id,
        name: user.professional_profile?.name || user.firstName || "",
        last_name: user.professional_profile?.last_name || user.lastName || "",
        bio: user.professional_profile?.bio,
        city: user.professional_profile?.city,
        rating: user.professional_profile?.rating || 0,
      }));
      setProfessionals(profList);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (professional: ProfessionalOption) => {
    setSelectedProfessional(professional);
    onSelect(professional.id);
    setModalVisible(false);
  };

  const handleClear = () => {
    setSelectedProfessional(null);
    onSelect(undefined);
  };

  const renderProfessional = ({item}: {item: ProfessionalOption}) => (
    <TouchableOpacity
      style={[
        styles.professionalItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => handleSelect(item)}>
      <View style={[styles.avatar, {backgroundColor: colors.primary}]}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0)}
          {item.last_name.charAt(0)}
        </Text>
      </View>
      <View style={styles.professionalInfo}>
        <Text style={[styles.professionalName, {color: colors.foreground}]}>
          {item.name} {item.last_name}
        </Text>
        {item.bio && (
          <Text style={[styles.professionalBio, {color: colors.mutedForeground}]} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
        <View style={styles.professionalMeta}>
          {item.city && (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, {color: colors.mutedForeground}]}>{item.city}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={[styles.metaText, {color: colors.foreground}]}>
              {item.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: colors.foreground}]}>
        Profesional asignado (opcional)
      </Text>
      <Text style={[styles.hint, {color: colors.mutedForeground}]}>
        Asigna un profesional específico para este servicio
      </Text>

      {selectedProfessional ? (
        <View
          style={[
            styles.selectedContainer,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <View style={[styles.selectedAvatar, {backgroundColor: colors.primary}]}>
            <Text style={styles.avatarText}>
              {selectedProfessional.name.charAt(0)}
              {selectedProfessional.last_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedName, {color: colors.foreground}]}>
              {selectedProfessional.name} {selectedProfessional.last_name}
            </Text>
            {selectedProfessional.city && (
              <Text style={[styles.selectedCity, {color: colors.mutedForeground}]}>
                {selectedProfessional.city}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.selectButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => setModalVisible(true)}>
          <Ionicons name="person-add" size={20} color={colors.primary} />
          <Text style={[styles.selectText, {color: colors.foreground}]}>
            Seleccionar profesional
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
                Seleccionar Profesional
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, {backgroundColor: colors.card}]}>
              <Ionicons name="search" size={20} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, {color: colors.foreground}]}
                placeholder="Buscar profesional..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={fetchProfessionals}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={professionals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProfessional}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
                      No se encontraron profesionales
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  selectedCity: {
    fontSize: 13,
  },
  clearButton: {
    padding: 4,
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
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
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
  professionalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  professionalBio: {
    fontSize: 13,
    marginBottom: 4,
  },
  professionalMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  },
});
