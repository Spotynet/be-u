import React, {useState} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import {useRouter, useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {errorUtils} from "@/lib/api";
import {AddressSearch} from "@/components/location/AddressSearch";
import {useAuth} from "@/features/auth/hooks/useAuth";

export default function RegisterClient() {
  const router = useRouter();
  const {register} = useAuth();
  const params = useLocalSearchParams<{
    googleEmail?: string;
    googleFirstName?: string;
    googleLastName?: string;
    googlePicture?: string;
    googleId?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
  }>();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState({
    email: params.googleEmail || "",
    firstName: params.googleFirstName || "",
    lastName: params.googleLastName || "",
    username: params.googleEmail ? params.googleEmail.split("@")[0] : "",
    address: "",
    country: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    role: "client" as "client",
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = {
      email: values.email.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      username: values.username.trim(),
    };
    if (!trimmed.email || !trimmed.firstName || !trimmed.username) {
      Alert.alert(
        "Campos requeridos",
        "Completa nombre, usuario y correo electrónico para continuar."
      );
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed.email)) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }
    try {
      setLoading(true);
      const registerData = {
        ...values,
        ...trimmed,
        address: values.address || undefined,
        country: values.country || undefined,
        latitude: values.latitude,
        longitude: values.longitude,
      };
      await register(registerData);
      router.replace("/(tabs)/perfil");
    } catch (err) {
      Alert.alert("Error", errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof values) => (t: string) => setValues((s) => ({...s, [k]: t}));

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
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
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Registro · Cliente</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + 40}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={[styles.sectionLabel, {color: colors.mutedForeground}]}>
            Datos personales
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Nombre</Text>
            <View style={[styles.inputBox, {backgroundColor: colors.input, borderColor: colors.border}]}>
              <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
              <TextInput
                placeholder="Tu nombre"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {color: colors.foreground}]}
                value={values.firstName}
                onChangeText={set("firstName")}
                editable={!loading}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Apellido</Text>
            <View style={[styles.inputBox, {backgroundColor: colors.input, borderColor: colors.border}]}>
              <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
              <TextInput
                placeholder="Tu apellido"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {color: colors.foreground}]}
                value={values.lastName}
                onChangeText={set("lastName")}
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

          <Text style={[styles.sectionLabel, {color: colors.mutedForeground}, styles.sectionLabelTop]}>
            Dirección (opcional)
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
  scrollView: {flex: 1},
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
