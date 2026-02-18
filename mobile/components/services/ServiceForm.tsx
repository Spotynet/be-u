import React, {useState} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {ServiceFormData} from "@/types/global";
import {ServiceTypeSelector} from "./ServiceTypeSelector";
import {ProfessionalSelector} from "./ProfessionalSelector";
import {PhotoUploader} from "./PhotoUploader";

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData>;
  isPlaceUser: boolean;
  onSubmit: (data: ServiceFormData) => void;
  isSubmitting?: boolean;
  allowedCategoryIds?: string[];
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  initialData,
  isPlaceUser,
  onSubmit,
  isSubmitting = false,
  allowedCategoryIds = [],
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [formData, setFormData] = useState<Partial<ServiceFormData>>({
    service: initialData?.service,
    description: initialData?.description || "",
    duration: initialData?.duration || 60,
    price: initialData?.price || 0,
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    professional: initialData?.professional,
    photo: initialData?.photo,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.service) {
      newErrors.service = "Selecciona un tipo de servicio";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "El precio debe ser mayor a 0";
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = "La duración debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData as ServiceFormData);
    }
  };

  const formatPrice = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, "");
    return numericValue;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Service Type Selector */}
        <ServiceTypeSelector
          selectedServiceTypeId={formData.service}
          allowedCategoryIds={allowedCategoryIds}
          onSelect={(serviceTypeId) => {
            setFormData({...formData, service: serviceTypeId});
            setErrors({...errors, service: ""});
          }}
        />
        {errors.service && <Text style={styles.errorText}>{errors.service}</Text>}

        {/* Price Input */}
        <View style={styles.field}>
          <Text style={[styles.label, {color: colors.foreground}]}>
            Precio <Text style={{color: "#ef4444"}}>*</Text>
          </Text>
          <View
            style={[
              styles.priceContainer,
              {
                backgroundColor: colors.card,
                borderColor: errors.price ? "#ef4444" : colors.border,
              },
            ]}>
            <Text style={[styles.currencySymbol, {color: colors.foreground}]}>$</Text>
            <TextInput
              style={[styles.priceInput, {color: colors.foreground}]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              value={formData.price ? formData.price.toString() : ""}
              onChangeText={(text) => {
                const formatted = formatPrice(text);
                setFormData({...formData, price: formatted ? parseFloat(formatted) : 0});
                setErrors({...errors, price: ""});
              }}
              keyboardType="numeric"
            />
            <Text style={[styles.currency, {color: colors.mutedForeground}]}>MXN</Text>
          </View>
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>

        {/* Duration Input */}
        <View style={styles.field}>
          <Text style={[styles.label, {color: colors.foreground}]}>
            Duración <Text style={{color: "#ef4444"}}>*</Text>
          </Text>
          <View style={styles.durationRow}>
            <TouchableOpacity
              style={[
                styles.durationButton,
                {
                  backgroundColor: formData.duration === 30 ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFormData({...formData, duration: 30})}>
              <Text
                style={[
                  styles.durationButtonText,
                  {color: formData.duration === 30 ? "#ffffff" : colors.foreground},
                ]}>
                30 min
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.durationButton,
                {
                  backgroundColor: formData.duration === 60 ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFormData({...formData, duration: 60})}>
              <Text
                style={[
                  styles.durationButtonText,
                  {color: formData.duration === 60 ? "#ffffff" : colors.foreground},
                ]}>
                1 hora
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.durationButton,
                {
                  backgroundColor: formData.duration === 90 ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFormData({...formData, duration: 90})}>
              <Text
                style={[
                  styles.durationButtonText,
                  {color: formData.duration === 90 ? "#ffffff" : colors.foreground},
                ]}>
                1.5 horas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.durationButton,
                {
                  backgroundColor: formData.duration === 120 ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFormData({...formData, duration: 120})}>
              <Text
                style={[
                  styles.durationButtonText,
                  {color: formData.duration === 120 ? "#ffffff" : colors.foreground},
                ]}>
                2 horas
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.customDurationContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="time" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.customDurationInput, {color: colors.foreground}]}
              placeholder="Personalizar (minutos)"
              placeholderTextColor={colors.mutedForeground}
              value={
                [30, 60, 90, 120].includes(formData.duration || 0)
                  ? ""
                  : formData.duration?.toString()
              }
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                setFormData({...formData, duration: value});
                setErrors({...errors, duration: ""});
              }}
              keyboardType="numeric"
            />
          </View>
          {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
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
            placeholder="Describe el servicio que ofreces..."
            placeholderTextColor={colors.mutedForeground}
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Professional Selector (Place users only) */}
        {isPlaceUser && (
          <ProfessionalSelector
            selectedProfessionalId={formData.professional}
            onSelect={(professionalId) => setFormData({...formData, professional: professionalId})}
          />
        )}

        {/* Photo Uploader */}
        <PhotoUploader
          photo={formData.photo}
          onPhotoChange={(uri) => setFormData({...formData, photo: uri || undefined})}
        />

        {/* Active Status Toggle */}
        <View
          style={[
            styles.statusContainer,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, {color: colors.foreground}]}>Servicio activo</Text>
            <Text style={[styles.statusHint, {color: colors.mutedForeground}]}>
              Los clientes pueden ver y reservar este servicio
            </Text>
          </View>
          <Switch
            value={formData.is_active}
            onValueChange={(value) => setFormData({...formData, is_active: value})}
            trackColor={{false: colors.mutedForeground, true: colors.primary}}
            thumbColor="#ffffff"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {backgroundColor: colors.primary},
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Creando..." : "Crear Servicio"}
          </Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: 16,
  },
  currency: {
    fontSize: 14,
    fontWeight: "600",
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  customDurationContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  customDurationInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusHint: {
    fontSize: 13,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 4,
  },
});
