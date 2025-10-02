import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function Login() {
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
        <Text style={[styles.headerTitle, {color: "#ffffff"}]}>Iniciar Sesión</Text>
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
          <Text style={[styles.welcomeTitle, {color: colors.foreground}]}>
            ¡Bienvenido de vuelta!
          </Text>
          <Text style={[styles.welcomeSubtitle, {color: colors.mutedForeground}]}>
            Inicia sesión para acceder a todos los servicios
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
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
                placeholder="Tu contraseña"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
              <TouchableOpacity>
                <Ionicons name="eye" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, {color: colors.primary}]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, {backgroundColor: colors.primary}]}
            onPress={() => {
              // TODO: Add login functionality
              console.log("Login pressed");
            }}>
            <Text style={[styles.loginButtonText, {color: "#ffffff"}]}>Iniciar Sesión</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, {backgroundColor: colors.border}]} />
            <Text style={[styles.dividerText, {color: colors.mutedForeground}]}>o</Text>
            <View style={[styles.divider, {backgroundColor: colors.border}]} />
          </View>

          {/* Social Login */}
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

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, {color: colors.mutedForeground}]}>
            ¿No tienes cuenta?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={[styles.registerLink, {color: colors.primary}]}>Crear cuenta</Text>
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
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
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 32,
  },
  registerText: {
    fontSize: 16,
  },
  registerLink: {
    fontSize: 16,
    fontWeight: "600",
  },
});
