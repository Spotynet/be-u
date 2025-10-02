import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function Register() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: "#ffffff"}]}>Crear Cuenta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, {backgroundColor: colors.primary}]}>
            <Ionicons name="sparkles" color="#ffffff" size={40} />
          </View>
          <Text style={[styles.logoText, {color: colors.foreground}]}>BE-U</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, {color: colors.foreground}]}>¡Únete a BE-U!</Text>
          <Text style={[styles.welcomeSubtitle, {color: colors.mutedForeground}]}>
            Crea tu cuenta para acceder a todos nuestros servicios
          </Text>
        </View>

        {/* Register Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, {color: colors.foreground}]}>Nombre</Text>
            <View
              style={[
                styles.inputWrapper,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="person" color={colors.mutedForeground} size={20} />
              <TextInput
                style={[styles.textInput, {color: colors.foreground}]}
                placeholder="Tu nombre"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, {color: colors.foreground}]}>Apellido</Text>
            <View
              style={[
                styles.inputWrapper,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="person" color={colors.mutedForeground} size={20} />
              <TextInput
                style={[styles.textInput, {color: colors.foreground}]}
                placeholder="Tu apellido"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, {color: colors.foreground}]}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="mail" color={colors.mutedForeground} size={20} />
              <TextInput
                style={[styles.textInput, {color: colors.foreground}]}
                placeholder="tu@email.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, {color: colors.foreground}]}>Contraseña</Text>
            <View
              style={[
                styles.inputWrapper,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="lock-closed" color={colors.mutedForeground} size={20} />
              <TextInput
                style={[styles.textInput, {color: colors.foreground}]}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
              <TouchableOpacity>
                <Ionicons name="eye" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, {color: colors.foreground}]}>
              Confirmar Contraseña
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="lock-closed" color={colors.mutedForeground} size={20} />
              <TextInput
                style={[styles.textInput, {color: colors.foreground}]}
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
              <TouchableOpacity>
                <Ionicons name="eye" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <TouchableOpacity style={styles.checkboxContainer}>
              <View style={[styles.checkbox, {borderColor: colors.border}]}>
                <Ionicons name="checkmark" color={colors.primary} size={16} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.termsText, {color: colors.mutedForeground}]}>
              Acepto los{" "}
              <Text style={[styles.termsLink, {color: colors.primary}]}>
                Términos y Condiciones
              </Text>{" "}
              y la{" "}
              <Text style={[styles.termsLink, {color: colors.primary}]}>
                Política de Privacidad
              </Text>
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, {backgroundColor: colors.primary}]}
            onPress={() => {
              // TODO: Add register functionality
              console.log("Register pressed");
            }}>
            <Text style={[styles.registerButtonText, {color: "#ffffff"}]}>Crear Cuenta</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, {backgroundColor: colors.border}]} />
            <Text style={[styles.dividerText, {color: colors.mutedForeground}]}>o</Text>
            <View style={[styles.divider, {backgroundColor: colors.border}]} />
          </View>

          {/* Social Register */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="logo-google" color="#db4437" size={20} />
              <Text style={[styles.socialButtonText, {color: colors.foreground}]}>
                Continuar con Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialButton,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="logo-apple" color={colors.foreground} size={20} />
              <Text style={[styles.socialButtonText, {color: colors.foreground}]}>
                Continuar con Apple
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, {color: colors.mutedForeground}]}>
            ¿Ya tienes cuenta?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={[styles.loginLink, {color: colors.primary}]}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },
  checkboxContainer: {
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: "500",
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 32,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: "600",
  },
});
