import React, {useState} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {authApi, errorUtils, tokenUtils} from "@/lib/api";

export default function RegisterClient() {
  const router = useRouter();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!values.email || !values.password || !values.firstName) {
      Alert.alert("Campos requeridos", "Ingresa al menos email, contraseña y nombre");
      return;
    }
    try {
      setLoading(true);
      const {data} = await authApi.register(values);
      await tokenUtils.setTokens(data.access, data.refresh);
      router.replace("/(tabs)/index");
    } catch (err) {
      Alert.alert("Error", errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof values) => (t: string) => setValues((s) => ({...s, [k]: t}));

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top + 24}]}>
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Registro (Cliente)</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.form}>
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
      </View>
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
  form: {padding: 16, gap: 10},
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  submit: {marginTop: 12, borderRadius: 12, alignItems: "center", paddingVertical: 14},
  submitText: {color: "#fff", fontSize: 15, fontWeight: "700"},
});
