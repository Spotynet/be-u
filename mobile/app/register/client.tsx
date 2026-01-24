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
} from "react-native";
import {useRouter, useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {authApi, errorUtils, tokenUtils} from "@/lib/api";
import {useEffect} from "react";

export default function RegisterClient() {
  const router = useRouter();
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
    password: "",
    firstName: params.googleFirstName || "",
    lastName: params.googleLastName || "",
    username: params.googleEmail ? params.googleEmail.split("@")[0] : "",
    role: "client" as "client",
  });
  const [loading, setLoading] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<{
    googleId?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
  } | null>(
    params.googleId
      ? {
          googleId: params.googleId,
          googleAccessToken: params.googleAccessToken,
          googleRefreshToken: params.googleRefreshToken,
        }
      : null
  );

  const onSubmit = async () => {
    if (!values.email || !values.password || !values.firstName) {
      Alert.alert("Campos requeridos", "Ingresa al menos email, contraseña y nombre");
      return;
    }
    try {
      setLoading(true);
      const {data} = await authApi.register(values);
      await tokenUtils.setTokens(data.access, data.refresh);
      
      // Note: Google account linking will be handled separately
      // The user can link their Google account from settings if needed
      
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
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 16, 20),
          },
        ]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Registro (Cliente)</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
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
  scrollView: {flex: 1},
  scrollContent: {paddingBottom: 40},
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
