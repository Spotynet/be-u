import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useAuth} from "@/features/auth";
import {useServiceManagement} from "@/features/services";
import {useRouter} from "expo-router";
import {serviceApi, errorUtils} from "@/lib/api";

export default function CreateServiceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const {createService, isLoading: creating} = useServiceManagement();

  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const [formData, setFormData] = useState({
    service: 0,
    description: "",
    duration: 60,
    price: 0,
    is_active: true,
  });

  const [errors, setErrors] = useState({
    service: "",
    price: "",
    duration: "",
  });

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await serviceApi.getServiceTypes();
      setServiceTypes(response.data.results || []);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
    } finally {
      setLoadingTypes(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {service: "", price: "", duration: ""};
    let isValid = true;

    if (formData.service === 0) {
      newErrors.service = "Selecciona un tipo de servicio";
      isValid = false;
    }

    if (formData.price <= 0) {
      newErrors.price = "El precio debe ser mayor a 0";
      isValid = false;
    }

    if (formData.duration <= 0) {
      newErrors.duration = "La duración debe ser mayor a 0";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createService(formData);
      router.back();
    } catch (err) {
      // Error already handled in hook
    }
  };

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
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
          <Ionicons name="close" color={colors.foreground} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Nuevo Servicio</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Service Type Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Tipo de Servicio *</Text>
            {loadingTypes ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.serviceTypesScroll}>
                {serviceTypes.map((type) => {
                  const isSelected = formData.service === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.serviceTypeCard,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setFormData({...formData, service: type.id})}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.serviceTypeName,
                          {color: isSelected ? "#ffffff" : colors.foreground},
                        ]}>
                        {type.name}
                      </Text>
                      <Text
                        style={[
                          styles.serviceTypeCategory,
                          {color: isSelected ? "#ffffff" : colors.mutedForeground},
                        ]}>
                        {type.category_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {errors.service ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.service}</Text>
            ) : null}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Descripción (Opcional)</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
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

          {/* Duration */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Duración (minutos) *</Text>
            <View
              style={[
                styles.inputContainer,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Ionicons name="time-outline" size={20} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, {color: colors.foreground}]}
                value={formData.duration.toString()}
                onChangeText={(text) => setFormData({...formData, duration: parseInt(text) || 0})}
                placeholder="60"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
              />
              <Text style={[styles.inputSuffix, {color: colors.mutedForeground}]}>min</Text>
            </View>
            {errors.duration ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.duration}</Text>
            ) : null}
          </View>

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Precio *</Text>
            <View
              style={[
                styles.inputContainer,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Ionicons name="cash-outline" size={20} color={colors.mutedForeground} />
              <Text style={[styles.inputPrefix, {color: colors.mutedForeground}]}>$</Text>
              <TextInput
                style={[styles.input, {color: colors.foreground}]}
                value={formData.price.toString()}
                onChangeText={(text) => setFormData({...formData, price: parseFloat(text) || 0})}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>
            {errors.price ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.price}</Text>
            ) : null}
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, {backgroundColor: colors.primary + "10"}]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoText, {color: colors.primary}]}>
              Este servicio estará disponible para que los clientes lo reserven según tu
              disponibilidad configurada.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View
        style={[
          styles.footer,
          {backgroundColor: colors.background, borderTopColor: colors.border},
        ]}>
        <TouchableOpacity
          style={[styles.createButton, {backgroundColor: colors.primary}]}
          onPress={handleSubmit}
          disabled={creating}
          activeOpacity={0.9}>
          {creating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
              <Text style={styles.createButtonText}>Crear Servicio</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  serviceTypesScroll: {
    gap: 12,
  },
  serviceTypeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 140,
  },
  serviceTypeName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  serviceTypeCategory: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: "500",
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});






















