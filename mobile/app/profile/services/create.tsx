import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "../../../contexts/ThemeVariantContext";
import {profileCustomizationApi} from "../../../lib/api";
import {useNavigation} from "../../../hooks/useNavigation";
import {MAIN_CATEGORIES} from "../../../constants/categories";

export default function CreateServiceScreen() {
  const router = useRouter();
  const {goBack} = useNavigation();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("otros");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
  });

  useEffect(() => {
    let mounted = true;
    const loadAllowedCategories = async () => {
      try {
        const response = await profileCustomizationApi.getProfileImages();
        const rawCategories = response?.data?.category;
        const categories = Array.isArray(rawCategories)
          ? rawCategories
          : rawCategories
            ? [rawCategories]
            : [];
        if (!mounted) return;
        if (categories.length > 0) {
          setAllowedCategories(categories);
          setSelectedCategory(categories[0]);
        } else {
          setAllowedCategories([]);
          setSelectedCategory("otros");
        }
      } catch {
        if (!mounted) return;
        setAllowedCategories([]);
        setSelectedCategory("otros");
      }
    };
    loadAllowedCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "El nombre del servicio es requerido");
      return;
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      Alert.alert("Error", "El precio debe ser un número válido mayor a 0");
      return;
    }
    if (
      !formData.duration_minutes ||
      isNaN(Number(formData.duration_minutes)) ||
      Number(formData.duration_minutes) <= 0
    ) {
      Alert.alert("Error", "La duración debe ser un número válido mayor a 0");
      return;
    }

    setLoading(true);
    try {
      await profileCustomizationApi.createCustomService({
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        price: Number(formData.price),
        duration_minutes: Number(formData.duration_minutes),
        category: selectedCategory,
        is_active: true,
      });

      Alert.alert("Éxito", "Servicio creado correctamente", [
        {text: "OK", onPress: () => router.replace("/profile/services")},
      ]);
    } catch (err: any) {
      console.error("Error creating service:", err);
      const data = err?.response?.data;
      const message =
        typeof data?.error === "string"
          ? data.error
          : typeof data?.detail === "string"
            ? data.detail
            : data && typeof data === "object" && !Array.isArray(data)
              ? Object.entries(data)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                  .join("\n")
              : err?.message || "No se pudo crear el servicio";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 16, 20),
          },
        ]}>
        <TouchableOpacity
          onPress={() => goBack("/profile/services")}
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Nuevo Servicio</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButtonContainer}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveButton, {color: colors.primary}]}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Service Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Nombre del Servicio</Text>
          <TextInput
            style={[
              styles.input,
              {backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground},
            ]}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            placeholder="Ej: Corte de cabello"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Service Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Descripción</Text>
          <TextInput
            style={[
              styles.textArea,
              {backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground},
            ]}
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            placeholder="Describe tu servicio..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Categoría del servicio</Text>
          <View style={styles.categoryChipsWrap}>
            {(allowedCategories.length > 0 ? allowedCategories : ["otros"]).map((categoryId) => {
              const categoryName =
                MAIN_CATEGORIES.find((c) => c.id === (categoryId as any))?.name || categoryId;
              const active = selectedCategory === categoryId;
              return (
                <TouchableOpacity
                  key={categoryId}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(categoryId)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      {color: active ? colors.primaryForeground : colors.foreground},
                    ]}>
                    {categoryName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Precio (MXN)</Text>
          <TextInput
            style={[
              styles.input,
              {backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground},
            ]}
            value={formData.price}
            onChangeText={(text) => setFormData({...formData, price: text})}
            placeholder="250"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
        </View>

        {/* Duration */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Duración (minutos)</Text>
          <TextInput
            style={[
              styles.input,
              {backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground},
            ]}
            value={formData.duration_minutes}
            onChangeText={(text) => setFormData({...formData, duration_minutes: text})}
            placeholder="60"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  saveButtonContainer: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  categoryChipsWrap: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
