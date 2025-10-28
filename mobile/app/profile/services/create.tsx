import React, {useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "../../../contexts/ThemeVariantContext";
import {profileCustomizationApi} from "../../../lib/api";

export default function CreateServiceScreen() {
  const router = useRouter();
  const {colors} = useThemeVariant();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
  });

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "El nombre del servicio es requerido");
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert("Error", "La descripción del servicio es requerida");
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
        description: formData.description.trim(),
        price: Number(formData.price),
        duration_minutes: Number(formData.duration_minutes),
      });

      Alert.alert("Éxito", "Servicio creado correctamente", [
        {text: "OK", onPress: () => router.back()},
      ]);
    } catch (error) {
      console.error("Error creating service:", error);
      Alert.alert("Error", "No se pudo crear el servicio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Nuevo Servicio</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveButton, {color: colors.primary}]}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
});
