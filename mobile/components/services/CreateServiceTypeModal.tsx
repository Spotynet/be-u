import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {serviceApi, errorUtils} from "@/lib/api";
import {ServiceCategoryData} from "@/types/global";

interface CreateServiceTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (serviceType: any) => void;
}

export const CreateServiceTypeModal: React.FC<CreateServiceTypeModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<ServiceCategoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await serviceApi.getCategories();
      setCategories(response.data.results || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "No se pudieron cargar las categorías");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert("Error", "Selecciona una categoría");
      return;
    }

    try {
      setLoading(true);
      const response = await serviceApi.createServiceType({
        name: name.trim(),
        category: selectedCategoryId,
        description: description.trim() || undefined,
      });

      Alert.alert("Éxito", "Tipo de servicio creado correctamente");
      onCreated(response.data);
      handleClose();
    } catch (error) {
      const message = errorUtils.getErrorMessage(error);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedCategoryId(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: colors.foreground}]}>Nuevo Tipo de Servicio</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <View style={styles.field}>
              <Text style={[styles.label, {color: colors.foreground}]}>
                Nombre del servicio <Text style={{color: "#ef4444"}}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Ej: Corte de cabello, Masaje relajante"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.field}>
              <Text style={[styles.label, {color: colors.foreground}]}>
                Categoría <Text style={{color: "#ef4444"}}>*</Text>
              </Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={styles.categoriesGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            selectedCategoryId === category.id ? colors.primary : colors.card,
                          borderColor:
                            selectedCategoryId === category.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}>
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              selectedCategoryId === category.id ? "#ffffff" : colors.foreground,
                          },
                        ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description Input */}
            <View style={styles.field}>
              <Text style={[styles.label, {color: colors.foreground}]}>Descripción (opcional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Describe el tipo de servicio..."
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, {borderColor: colors.border}]}
              onPress={handleClose}
              disabled={loading}>
              <Text style={[styles.cancelButtonText, {color: colors.foreground}]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                {backgroundColor: colors.primary},
                loading && styles.buttonDisabled,
              ]}
              onPress={handleCreate}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Crear</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "75%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#3b82f6",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
