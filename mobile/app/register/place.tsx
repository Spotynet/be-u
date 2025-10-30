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
} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {authApi, errorUtils, profileCustomizationApi, tokenUtils} from "@/lib/api";
import AddressAutocomplete from "@/components/address/AddressAutocomplete";

export default function RegisterPlace() {
  const router = useRouter();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    username: "",
    placeName: "",
    phone: "",
    city: "",
    address: "",
    postal_code: "",
    country: "México",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof values) => (t: string) => setValues((s) => ({...s, [k]: t}));

  const onSubmit = async () => {
    if (!values.email || !values.password || !values.placeName) {
      Alert.alert("Campos requeridos", "Ingresa al menos email, contraseña y nombre del lugar");
      return;
    }
    try {
      setLoading(true);
      const {data} = await authApi.register(values);
      await tokenUtils.setTokens(data.access, data.refresh);

      // Ensure PublicProfile exists (auto-creates if missing)
      await profileCustomizationApi.getProfileImages();
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

      router.replace("/(tabs)/index");
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
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Registro (Lugar)</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={{padding: 16}} showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Nombre del lugar"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.placeName}
          onChangeText={set("placeName")}
        />
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
          placeholder="Teléfono"
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
          placeholder="Código postal"
          keyboardType="number-pad"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.postal_code}
          onChangeText={set("postal_code")}
        />
        <TextInput
          placeholder="País"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
          value={values.country}
          onChangeText={set("country")}
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
  inputHalf: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  submit: {marginTop: 4, borderRadius: 12, alignItems: "center", paddingVertical: 14},
  submitText: {color: "#fff", fontSize: 15, fontWeight: "700"},
});
