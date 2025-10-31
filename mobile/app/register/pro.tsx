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
} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {authApi, errorUtils, profileCustomizationApi, tokenUtils} from "@/lib/api";
import AddressAutocomplete from "@/components/address/AddressAutocomplete";
import {useCategory} from "@/contexts/CategoryContext";

export default function RegisterPro() {
  const router = useRouter();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {subcategoriesByMainCategory} = useCategory();

  const [values, setValues] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    city: "",
    bio: "",
    address: "",
    postal_code: "",
    country: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    role: "PROFESSIONAL" as "PROFESSIONAL",
  });
  const [mainCategory, setMainCategory] = useState<"belleza" | "bienestar" | "mascotas">("belleza");
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const subs = useMemo(
    () => subcategoriesByMainCategory[mainCategory].filter((s) => s.id !== "todos"),
    [mainCategory, subcategoriesByMainCategory]
  );
  const toggleSub = (id: string) =>
    setSelectedSubs((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  const set = (k: keyof typeof values) => (t: string) => setValues((s) => ({...s, [k]: t}));

  const onSubmit = async () => {
    if (!values.email || !values.password || !values.firstName) {
      Alert.alert("Campos requeridos", "Ingresa al menos email, contraseña y nombre");
      return;
    }
    try {
      setLoading(true);
      const {data} = await authApi.register(values);
      await tokenUtils.setTokens(data.access, data.refresh);

      // Ensure PublicProfile exists (auto-creates if missing)
      await profileCustomizationApi.getProfileImages();
      // Save address + coordinates if provided
      if (values.address && values.latitude && values.longitude) {
        await profileCustomizationApi.updatePublicProfile({
          street: values.address,
          city: values.city,
          country: values.country,
          postal_code: values.postal_code,
          latitude: values.latitude,
          longitude: values.longitude,
        });
      }

      router.replace("/(tabs)/perfil");
    } catch (err) {
      Alert.alert("Error", errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top + 24}]}>
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Registro (Profesional)</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={{padding: 16}} showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Nombre"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.firstName}
          onChangeText={set("firstName")}
        />
        <TextInput
          placeholder="Apellido"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.lastName}
          onChangeText={set("lastName")}
        />
        <TextInput
          placeholder="Usuario"
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
          placeholder="Contraseña"
          secureTextEntry
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.password}
          onChangeText={set("password")}
        />
        <TextInput
          placeholder="Teléfono (opcional)"
          keyboardType="phone-pad"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.phone}
          onChangeText={set("phone")}
        />
        <TextInput
          placeholder="Ciudad"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.city}
          onChangeText={set("city")}
        />
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Dirección</Text>
        <AddressAutocomplete
          value={values.address}
          onChangeText={(t) => setValues((s) => ({...s, address: t}))}
          onSelected={(p) =>
            setValues((s) => ({
              ...s,
              address: p.address,
              city: p.city || s.city,
              country: p.country || s.country,
              postal_code: p.postal_code || s.postal_code,
              latitude: p.latitude,
              longitude: p.longitude,
            }))
          }
          placeholder="Buscar dirección"
        />
        <TextInput
          placeholder="Bio corta"
          multiline
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {borderColor: colors.border, color: colors.foreground, minHeight: 80},
          ]}
          value={values.bio}
          onChangeText={set("bio")}
        />

        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Categoría</Text>
        <View style={styles.row}>
          {(["belleza", "bienestar", "mascotas"] as const).map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.badge,
                {
                  borderColor: colors.border,
                  backgroundColor: mainCategory === c ? colors.muted : colors.card,
                },
              ]}
              onPress={() => setMainCategory(c)}>
              <Text style={{color: colors.foreground}}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Subcategorías</Text>
        <View style={styles.wrap}>
          {subs.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.chip,
                {
                  borderColor: colors.border,
                  backgroundColor: selectedSubs.includes(s.id)
                    ? s.color || colors.muted
                    : colors.card,
                },
              ]}
              onPress={() => toggleSub(s.id)}>
              <Text style={{color: colors.foreground}}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
    </View>
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  sectionTitle: {fontSize: 14, fontWeight: "700", marginTop: 4, marginBottom: 6},
  row: {flexDirection: "row", gap: 8, marginBottom: 10},
  badge: {borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8},
  wrap: {flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12},
  chip: {borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8},
  submit: {marginTop: 4, borderRadius: 12, alignItems: "center", paddingVertical: 14},
  submitText: {color: "#fff", fontSize: 15, fontWeight: "700"},
});
