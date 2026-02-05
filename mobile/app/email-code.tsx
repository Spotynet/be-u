import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter, useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef} from "react";
import {useAuth} from "@/features/auth";

export default function EmailCode() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{email: string}>();
  const {loginWithEmailCode, requestEmailCode, isLoading} = useAuth();

  const email = params.email || "";
  const [emailCode, setEmailCode] = useState("");
  const [errors, setErrors] = useState({code: ""});
  const [successMessage, setSuccessMessage] = useState("");
  const [generalError, setGeneralError] = useState("");

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity1 = useRef(new Animated.Value(0)).current;
  const sparkleOpacity2 = useRef(new Animated.Value(0)).current;
  const sparkleOpacity3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.spring(logoScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Continuous subtle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sparkle animations with staggered delays
    const sparkleAnimation = (opacity: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    sparkleAnimation(sparkleOpacity1, 0);
    sparkleAnimation(sparkleOpacity2, 400);
    sparkleAnimation(sparkleOpacity3, 800);
  }, []);

  const rotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  const validateCode = (): boolean => {
    const newErrors = {code: ""};
    let isValid = true;

    if (!emailCode) {
      newErrors.code = "El código es requerido";
      isValid = false;
    } else if (!/^\d{6}$/.test(emailCode)) {
      newErrors.code = "El código debe tener 6 dígitos";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleVerifyCode = async () => {
    // Clear previous messages
    setSuccessMessage("");
    setGeneralError("");
    setErrors({code: ""});

    if (!validateCode()) return;

    try {
      const result = await loginWithEmailCode({email, code: emailCode});
      if (result === "requires_registration") {
        router.replace({
          pathname: "/register",
          params: {
            googleEmail: email,
          },
        });
        return;
      }

      setSuccessMessage("¡Inicio de sesión exitoso!");
      setTimeout(() => router.replace("/(tabs)"), 800);
    } catch (error: any) {
      // Handle specific error types with beautiful inline messages
      if (
        error.message?.includes("Código inválido") ||
        error.message?.includes("Invalid code")
      ) {
        setGeneralError("El código ingresado no es correcto. Verifica e intenta nuevamente.");
      } else if (error.message?.includes("expirado") || error.message?.includes("expired")) {
        setGeneralError("El código ha expirado. Solicita un nuevo código.");
      } else if (error.message?.includes("Network") || error.message?.includes("timeout")) {
        setGeneralError("Error de conexión. Verifica tu internet e intenta nuevamente.");
      } else if (error.message?.includes("Server") || error.message?.includes("500")) {
        setGeneralError("Error del servidor. Por favor intenta más tarde.");
      } else {
        setGeneralError(error.message || "Ocurrió un error inesperado. Intenta nuevamente.");
      }
    }
  };

  const handleResendCode = async () => {
    setSuccessMessage("");
    setGeneralError("");
    setEmailCode("");

    try {
      await requestEmailCode(email);
      setSuccessMessage("Te enviamos un nuevo código a tu correo.");
    } catch (error: any) {
      if (error.message?.includes("Network") || error.message?.includes("timeout")) {
        setGeneralError("Error de conexión. Verifica tu internet e intenta nuevamente.");
      } else if (error.message?.includes("Server") || error.message?.includes("500")) {
        setGeneralError("Error del servidor. Por favor intenta más tarde.");
      } else {
        setGeneralError(error.message || "Ocurrió un error inesperado. Intenta nuevamente.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: Math.max(insets.top + 16, 20),
          },
        ]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: "#ffffff"}]}>Verificar código</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Animated Logo */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                transform: [{scale: logoScale}, {rotate: rotateInterpolate}],
              },
            ]}>
            <View style={[styles.logoBg, {backgroundColor: colors.primary}]}>
              <Ionicons name="key" color="#ffffff" size={32} />
            </View>
            {/* Floating sparkles */}
            <Animated.View style={[styles.sparkle, styles.sparkle1, {opacity: sparkleOpacity1}]}>
              <Ionicons name="sparkles" color={colors.primary} size={16} />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, {opacity: sparkleOpacity2}]}>
              <Ionicons name="sparkles" color={colors.primary} size={14} />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, {opacity: sparkleOpacity3}]}>
              <Ionicons name="sparkles" color={colors.primary} size={12} />
            </Animated.View>
          </Animated.View>
          <Text style={[styles.logoText, {color: colors.foreground}]}>nabbi</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, {color: colors.foreground}]}>
            Ingresa el código
          </Text>
          <Text style={[styles.welcomeSubtitle, {color: colors.mutedForeground}]}>
            Te enviamos un código de 6 dígitos a{"\n"}
            <Text style={{fontWeight: "600"}}>{email}</Text>
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

        {/* Code Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, {color: colors.foreground}]}>Código</Text>
            <View
              style={[
                styles.inputWrapper,
                {backgroundColor: colors.input, borderColor: colors.border},
              ]}>
              <Ionicons name="key" color={colors.mutedForeground} size={20} />
              <TextInput
                style={[styles.textInput, {color: colors.foreground}]}
                placeholder="123456"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                value={emailCode}
                onChangeText={(text) => {
                  // Only allow numeric input and limit to 6 digits
                  const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
                  setEmailCode(numericText);
                }}
                editable={!isLoading}
                maxLength={6}
                autoFocus
              />
            </View>
            {errors.code ? (
              <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.code}</Text>
            ) : null}
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              {backgroundColor: colors.primary},
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[styles.loginButtonText, {color: "#ffffff"}]}>
                Verificar código
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend code */}
          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResendCode}
            disabled={isLoading}>
            <Text style={[styles.resendText, {color: colors.primary}]}>
              ¿No recibiste el código?{" "}
              <Text style={styles.resendLink}>Reenviar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-start",
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
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 20,
  },
  logoWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sparkle: {
    position: "absolute",
  },
  sparkle1: {
    top: -8,
    right: -8,
  },
  sparkle2: {
    bottom: -4,
    left: -8,
  },
  sparkle3: {
    top: 8,
    left: -12,
  },
  welcomeContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
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
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: "600",
  },
  loginButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "500",
  },
  resendLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
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
});
