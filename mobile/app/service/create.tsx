import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useAuth} from "@/features/auth";
import {useRouter} from "expo-router";
import {profileCustomizationApi, errorUtils} from "@/lib/api";
import {MAIN_CATEGORIES, getSubCategories} from "@/constants/categories";

const NAME_MAX_LENGTH = 100;

export default function CreateServiceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    is_active: true,
  });

  const [errors, setErrors] = useState({
    name: "",
    category: "",
    price: "",
    duration: "",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingCategories(true);
        const res = await profileCustomizationApi.getProfileImages();
        const raw = res?.data?.category;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        if (!mounted) return;
        if (list.length > 0) {
          setAllowedCategories(list);
          setSelectedCategory(list[0]);
          setSelectedSubcategory("");
        } else {
          setAllowedCategories(["belleza", "bienestar", "mascotas", "otros"]);
          setSelectedCategory("belleza");
        }
      } catch {
        if (!mounted) return;
        setAllowedCategories(["belleza", "bienestar", "mascotas", "otros"]);
        setSelectedCategory("belleza");
      } finally {
        if (mounted) setLoadingCategories(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = (): boolean => {
    const next = {name: "", category: "", price: "", duration: ""};
    let ok = true;
    if (!formData.name.trim()) {
      next.name = "El nombre es requerido";
      ok = false;
    } else if (formData.name.length > NAME_MAX_LENGTH) {
      next.name = `Máximo ${NAME_MAX_LENGTH} caracteres`;
      ok = false;
    }
    if (allowedCategories.length > 0 && !selectedCategory) {
      next.category = "Selecciona una categoría";
      ok = false;
    }
    if (formData.price <= 0) {
      next.price = "El precio debe ser mayor a 0";
      ok = false;
    }
    if (formData.duration <= 0) {
      next.duration = "La duración debe ser mayor a 0";
      ok = false;
    }
    setErrors(next);
    return ok;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (allowedCategories.length === 0) {
      Alert.alert(
        "Configura tus categorías",
        "Agrega al menos una categoría activa en tu perfil público antes de crear servicios.",
        [
          {text: "Cancelar", style: "cancel"},
          {text: "Ir a configuración", onPress: () => router.push("/profile/config")},
        ]
      );
      return;
    }

    setLoading(true);
    try {
      // Backend only accepts main categories (belleza, bienestar, mascotas) for validation
      await profileCustomizationApi.createCustomService({
        name: formData.name.trim().slice(0, NAME_MAX_LENGTH),
        description: formData.description.trim() || "",
        price: Number(formData.price),
        duration_minutes: Number(formData.duration),
        category: selectedCategory || "otros",
        is_active: true,
      });
      Alert.alert("Éxito", "Servicio creado correctamente", [
        {text: "OK", onPress: () => router.push("/services")},
      ]);
    } catch (err: any) {
      const msg = errorUtils.getErrorMessage(err);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
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

  const categoriesToShow =
    allowedCategories.length > 0 ? allowedCategories : ["belleza", "bienestar", "mascotas", "otros"];
  const subcategories = selectedCategory ? getSubCategories(selectedCategory) : [];

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Nombre — texto libre, máx 100 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>
            Nombre del servicio <Text style={{color: "#ef4444"}}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            value={formData.name}
            onChangeText={(text) =>
              setFormData({...formData, name: text.slice(0, NAME_MAX_LENGTH)})
            }
            placeholder="Ej: Corte de cabello"
            placeholderTextColor={colors.mutedForeground}
            maxLength={NAME_MAX_LENGTH}
          />
          <Text style={[styles.hint, {color: colors.mutedForeground}]}>
            {formData.name.length}/{NAME_MAX_LENGTH} caracteres
          </Text>
          {errors.name ? (
            <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.name}</Text>
          ) : null}
        </View>

        {/* Categoría */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>
            Categoría <Text style={{color: "#ef4444"}}>*</Text>
          </Text>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.chipsWrap}>
              {categoriesToShow.map((catId) => {
                const name =
                  MAIN_CATEGORIES.find((c) => c.id === (catId as any))?.name || catId;
                const active = selectedCategory === catId;
                return (
                  <TouchableOpacity
                    key={catId}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCategory(catId);
                      setSelectedSubcategory("");
                    }}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.chipText,
                        {color: active ? "#ffffff" : colors.foreground},
                      ]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {errors.category ? (
            <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.category}</Text>
          ) : null}
        </View>

        {/* Subcategoría */}
        {selectedCategory && subcategories.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Subcategoría</Text>
            <View style={styles.chipsWrap}>
              {subcategories.map((sub) => {
                const active = selectedSubcategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedSubcategory(active ? "" : sub.id)}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.chipText,
                        {color: active ? "#ffffff" : colors.foreground},
                      ]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Descripción */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Descripción (opcional)</Text>
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

        {/* Duración */}
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
              onChangeText={(text) => setFormData({...formData, duration: parseInt(text, 10) || 0})}
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

        {/* Precio */}
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
              onChangeText={(text) =>
                setFormData({...formData, price: parseFloat(text) || 0})
              }
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
          </View>
          {errors.price ? (
            <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.price}</Text>
          ) : null}
        </View>

        <View style={[styles.infoCard, {backgroundColor: colors.primary + "10"}]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, {color: colors.primary}]}>
            Este servicio estará disponible para que los clientes lo reserven según tu
            disponibilidad configurada.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {backgroundColor: colors.background, borderTopColor: colors.border},
        ]}>
        <TouchableOpacity
          style={[styles.createButton, {backgroundColor: colors.primary}]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
              <Text style={styles.createButtonText}>Crear Servicio</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
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
