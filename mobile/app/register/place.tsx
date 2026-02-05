import React, {useState} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {errorUtils, profileCustomizationApi} from "@/lib/api";
import {AddressSearch} from "@/components/location/AddressSearch";
import {MultiCategorySelector} from "@/components/profile/MultiCategorySelector";
import {useAuth} from "@/features/auth/hooks/useAuth";

export default function RegisterPlace() {
  const router = useRouter();
  const {register} = useAuth();
  const params = useLocalSearchParams<{googleEmail?: string}>();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState({
    email: params.googleEmail || "",
    username: params.googleEmail ? params.googleEmail.split("@")[0] : "",
    placeName: "",
    phone: "",
    city: "",
    address: "",
    country: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    role: "place" as "place",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof values) => (t: string) => setValues((s) => ({...s, [k]: t}));

  const onSubmit = async () => {
    const trimmed = {
      email: values.email.trim(),
      username: values.username.trim(),
      placeName: values.placeName.trim(),
    };
    if (!trimmed.email || !trimmed.username || !trimmed.placeName) {
      Alert.alert(
        "Campos requeridos",
        "Completa nombre del lugar, usuario y correo electrónico."
      );
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed.email)) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }
    if (selectedCategories.length === 0 || selectedSubCategories.length === 0) {
      Alert.alert(
        "Categoría requerida",
        "Selecciona al menos una categoría y una subcategoría para tu negocio."
      );
      return;
    }
    try {
      setLoading(true);
      const registerData = {
        ...values,
        ...trimmed,
        // Backend register endpoint expects singular strings: `category` and `subcategory`
        category: selectedCategories[0],
        subcategory: selectedSubCategories[0],
        address: values.address || undefined,
        country: values.country || undefined,
        latitude: values.latitude,
        longitude: values.longitude,
      };
      await register(registerData);

      try {
        await profileCustomizationApi.getProfileImages();
        const updateData: any = {
          category: selectedCategories,
          sub_categories: selectedSubCategories,
        };
        if (values.address && values.latitude != null && values.longitude != null) {
          updateData.street = values.address;
          updateData.city = values.city;
          updateData.country = values.country;
          updateData.latitude = values.latitude;
          updateData.longitude = values.longitude;
        }
        await profileCustomizationApi.updatePublicProfile(updateData);
      } catch (profileErr) {
        console.warn("PublicProfile update skipped:", profileErr);
      }

      router.replace("/(tabs)/perfil");
    } catch (err) {
      Alert.alert("Error", errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 12),
          },
        ]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Registro · Lugar</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + 40}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={[styles.sectionLabel, {color: colors.mutedForeground}]}>
            Datos del negocio
          </Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Nombre del lugar</Text>
            <View style={[styles.inputBox, {backgroundColor: colors.input, borderColor: colors.border}]}>
              <Ionicons name="business-outline" size={20} color={colors.mutedForeground} />
              <TextInput
                placeholder="Ej. Salón Bella, Spa Central"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {color: colors.foreground}]}
                value={values.placeName}
                onChangeText={set("placeName")}
                editable={!loading}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Usuario</Text>
            <View style={[styles.inputBox, {backgroundColor: colors.input, borderColor: colors.border}]}>
              <Ionicons name="at" size={20} color={colors.mutedForeground} />
              <TextInput
                placeholder="nombre_usuario"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {color: colors.foreground}]}
                value={values.username}
                onChangeText={set("username")}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Correo electrónico</Text>
            <View style={[styles.inputBox, {backgroundColor: colors.input, borderColor: colors.border}]}>
              <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />
              <TextInput
                placeholder="tu@correo.com"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {color: colors.foreground}]}
                value={values.email}
                onChangeText={set("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Teléfono</Text>
            <View style={[styles.inputBox, {backgroundColor: colors.input, borderColor: colors.border}]}>
              <Ionicons name="call-outline" size={20} color={colors.mutedForeground} />
              <TextInput
                placeholder="+52 55 1234 5678"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {color: colors.foreground}]}
                value={values.phone}
                onChangeText={set("phone")}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, {color: colors.mutedForeground}, styles.sectionLabelTop]}>
            Dirección
          </Text>
          <AddressSearch
            placeholder="Buscar dirección"
            value={values.address}
            onSelect={(location) => {
              setValues((s) => ({
                ...s,
                address: location.address || "",
                country: location.country || "",
                latitude: location.latitude,
                longitude: location.longitude,
              }));
            }}
          />

          <Text style={[styles.sectionLabel, {color: colors.mutedForeground}, styles.sectionLabelTop]}>
            Categorías
          </Text>
          <MultiCategorySelector
            selectedCategories={selectedCategories}
            selectedSubCategories={selectedSubCategories}
            onCategoriesChange={setSelectedCategories}
            onSubCategoriesChange={setSelectedSubCategories}
          />

          <Pressable
            style={({pressed}) => [
              styles.submit,
              {backgroundColor: colors.primary},
              loading && styles.submitDisabled,
              pressed && !loading && {opacity: 0.9},
            ]}
            onPress={onSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, {color: colors.primaryForeground}]}>
                Crear cuenta
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {width: 44, minHeight: 44, alignItems: "flex-start", justifyContent: "center"},
  headerTitle: {fontSize: 17, fontWeight: "600", flex: 1, textAlign: "center"},
  scrollContent: {},
  form: {padding: 20, paddingBottom: 24},
  sectionLabel: {fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5},
  sectionLabelTop: {marginTop: 24},
  inputGroup: {marginBottom: 18},
  label: {fontSize: 15, fontWeight: "500", marginBottom: 8},
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  input: {flex: 1, fontSize: 16, paddingVertical: 0},
  submit: {marginTop: 28, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 16},
  submitDisabled: {opacity: 0.6},
  submitText: {fontSize: 16, fontWeight: "600"},
});
