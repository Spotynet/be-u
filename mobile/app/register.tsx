import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {useAuth} from "@/features/auth";

export default function Register() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {register, isLoading} = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [generalError, setGeneralError] = useState("");

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
      isValid = false;
    }

    if (!username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = "El nombre de usuario debe tener al menos 3 caracteres";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Solo letras, números y guión bajo";
      isValid = false;
    }

    if (!email) {
      newErrors.email = "El email es requerido";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email inválido";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    // Clear previous messages
    setSuccessMessage("");
    setGeneralError("");
    setErrors({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    if (!validateForm()) return;

    try {
      await register({email, password, firstName, lastName, username});
      setSuccessMessage("¡Cuenta creada exitosamente!");
      // Navigate to home after a brief success message
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error: any) {
      // Handle specific error types with beautiful inline messages
      if (
        error.message?.includes("User with this email already exists") ||
        error.message?.includes("already exists")
      ) {
        setGeneralError(
          "Ya existe una cuenta con este email. Intenta iniciar sesión o usa otro email."
        );
      } else if (
        error.message?.includes("Invalid email") ||
        error.message?.includes("Enter a valid email")
      ) {
        setGeneralError("Por favor ingresa un email válido con formato correcto.");
      } else if (error.message?.includes("Network") || error.message?.includes("timeout")) {
        setGeneralError("Error de conexión. Verifica tu internet e intenta nuevamente.");
      } else if (error.message?.includes("Server") || error.message?.includes("500")) {
        setGeneralError("Error del servidor. Por favor intenta más tarde.");
      } else if (error.message?.includes("Password") || error.message?.includes("password")) {
        setGeneralError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setGeneralError(error.message || "Ocurrió un error inesperado. Intenta nuevamente.");
      }
    }
  };

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
          <Text style={[styles.logoText, {color: colors.foreground}]}>Be-U</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, {color: colors.foreground}]}>¡Únete a Be-U!</Text>
          <Text style={[styles.welcomeSubtitle, {color: colors.mutedForeground}]}>
            Crea tu cuenta para acceder a todos nuestros servicios
          </Text>
        </View>

        {/* Success Message */}
        {successMessage ? (
          <View style={[styles.successContainer, {backgroundColor: colors.success}]}>
            <Ionicons name="checkmark-circle" color={colors.successForeground} size={20} />
            <Text style={[styles.successText, {color: colors.successForeground}]}>
              {successMessage}
            </Text>
          </View>
        ) : null}

        {/* General Error Message */}
        {generalError ? (
          <View style={[styles.errorContainer, {backgroundColor: colors.destructive}]}>
            <Ionicons name="alert-circle" color={colors.destructiveForeground} size={20} />
            <Text style={[styles.generalErrorText, {color: colors.destructiveForeground}]}>
              {generalError}
            </Text>
          </View>
        ) : null}

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
                value={firstName}
                onChangeText={setFirstName}
                editable={!isLoading}
              />
            </View>
            {errors.firstName ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>
                {errors.firstName}
              </Text>
            ) : null}
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
                value={lastName}
                onChangeText={setLastName}
                editable={!isLoading}
              />
            </View>
            {errors.lastName ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.lastName}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, {color: colors.foreground}]}>Nombre de Usuario</Text>
            <View
              style={[
                styles.inputWrapper,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="at" color={colors.mutedForeground} size={20} />
              <TextInput
                style={[styles.textInput, {color: colors.foreground}]}
                placeholder="Tu nombre de usuario"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                editable={!isLoading}
              />
            </View>
            {errors.username ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.username}</Text>
            ) : null}
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
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>
            {errors.email ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.email}</Text>
            ) : null}
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
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  color={colors.mutedForeground}
                  size={20}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.password}</Text>
            ) : null}
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
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  color={colors.mutedForeground}
                  size={20}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>
                {errors.confirmPassword}
              </Text>
            ) : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              {backgroundColor: colors.primary},
              isLoading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[styles.registerButtonText, {color: "#ffffff"}]}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>
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
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  generalErrorText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
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
