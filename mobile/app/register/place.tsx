import React, {useMemo, useState} from "react";
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
} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {errorUtils, profileCustomizationApi} from "@/lib/api";
import {AddressSearch} from "@/components/location/AddressSearch";
import {useCategory} from "@/contexts/CategoryContext";
import {Dropdown} from "@/components/ui/Dropdown";
import {MultiCategorySelector} from "@/components/profile/MultiCategorySelector";
import {useAuth} from "@/features/auth/hooks/useAuth";

export default function RegisterPlace() {
  const router = useRouter();
  const {register} = useAuth();
  const params = useLocalSearchParams<{googleEmail?: string}>();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {subcategoriesByMainCategory} = useCategory();
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
    if (!values.email || !values.username || !values.placeName) {
      Alert.alert("Campos requeridos", "Ingresa al menos email, usuario y nombre del lugar");
      return;
    }
    if (selectedCategories.length === 0 || selectedSubCategories.length === 0) {
      Alert.alert("Campos requeridos", "Selecciona al menos una categoría y una subcategoría");
      return;
    }
    try {
      setLoading(true);
      const registerData = {
        ...values,
        // Include address, country, and coordinates for User model
        address: values.address || undefined,
        country: values.country || undefined,
        latitude: values.latitude,
        longitude: values.longitude,
      };
      await register(registerData);

      // Ensure PublicProfile exists (auto-creates if missing) and update it.
      // If update fails, don't block successful registration and navigation.
      try {
        await profileCustomizationApi.getProfileImages();
        // Always update with category/subcategory and address if provided
        const updateData: any = {
          category: selectedCategories,
          sub_categories: selectedSubCategories,
        };
        if (values.address && values.latitude && values.longitude) {
          updateData.street = values.address;
          updateData.city = values.city;
          updateData.country = values.country;
          updateData.latitude = values.latitude;
          updateData.longitude = values.longitude;
        }
        // Always update to ensure category/subcategory are saved
        await profileCustomizationApi.updatePublicProfile(updateData);
      } catch (profileErr) {
        console.warn("PublicProfile update skipped due to error:", profileErr);
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
            paddingTop: Math.max(insets.top + 16, 20),
          },
        ]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Registro (Lugar)</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, {padding: 16}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TextInput
          placeholder="Nombre del lugar"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.placeName}
          onChangeText={set("placeName")}
        />
        <TextInput
          placeholder="Nombre de usuario"
          autoCapitalize="none"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.username}
          onChangeText={set("username")}
        />
        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.email}
          onChangeText={set("email")}
        />
        <TextInput
          placeholder="Teléfono"
          keyboardType="phone-pad"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.phone}
          onChangeText={set("phone")}
        />
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Dirección</Text>
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

        <MultiCategorySelector
          selectedCategories={selectedCategories}
          selectedSubCategories={selectedSubCategories}
          onCategoriesChange={setSelectedCategories}
          onSubCategoriesChange={setSelectedSubCategories}
        />

        <TouchableOpacity
          style={[styles.submit, {backgroundColor: colors.primary}]}
          onPress={onSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {width: 32, height: 32, alignItems: "center", justifyContent: "center"},
  headerTitle: {fontSize: 18, fontWeight: "700"},
  scrollContent: {paddingBottom: 40},
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  inputHalf: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  sectionTitle: {fontSize: 14, fontWeight: "700", marginTop: 4, marginBottom: 6},
  submit: {marginTop: 4, borderRadius: 12, alignItems: "center", paddingVertical: 14},
  submitText: {color: "#fff", fontSize: 15, fontWeight: "700"},
});
