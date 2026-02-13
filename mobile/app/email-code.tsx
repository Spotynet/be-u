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
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter, useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef} from "react";
import {useAuth} from "@/features/auth";
import {AppHeader} from "@/components/ui/AppHeader";
import {AppLogo} from "@/components/AppLogo";

export default function EmailCode() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const params = useLocalSearchParams<{email: string}>();
  const {loginWithEmailCode, requestEmailCode, isLoading} = useAuth();

  const email = params.email || "";
  const [emailCode, setEmailCode] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [errors, setErrors] = useState({code: ""});
  const [successMessage, setSuccessMessage] = useState("");
  const [generalError, setGeneralError] = useState("");

  const logoScale = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const codeDigits = emailCode.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleCodeDigitChange = (index: number, digit: string) => {
    const num = digit.replace(/[^0-9]/g, "");
    if (num.length > 1) {
      const paste = num.slice(0, 6);
      const newCode = (emailCode.slice(0, index) + paste).slice(0, 6);
      setEmailCode(newCode);
      const next = Math.min(index + paste.length, 5);
      inputRefs.current[next]?.focus();
      return;
    }
    const newCode = emailCode.slice(0, index) + num + emailCode.slice(index + 1);
    setEmailCode(newCode);
    if (num && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !codeDigits[index] && index > 0) {
      setEmailCode(emailCode.slice(0, index - 1) + emailCode.slice(index));
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [logoScale]);

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
      <AppHeader
        title="Verificar código"
        showBackButton
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Animated Logo */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[styles.logoWrapper, {transform: [{scale: logoScale}]}]}>
            <View
              style={[
                styles.logoBox,
                {
                  backgroundColor: "#FFFFFF",
                  shadowColor: colors.primary,
                  ...Platform.select({
                    ios: {
                      shadowOffset: {width: 0, height: 0},
                      shadowOpacity: 0.35,
                      shadowRadius: 18,
                    },
                    android: {elevation: 12},
                  }),
                },
              ]}>
              <AppLogo style={styles.heroLogo} resizeMode="contain" />
            </View>
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
            <Text style={[styles.emailHighlight, {color: colors.foreground}]}>{email}</Text>
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
          <View style={styles.codeBoxesRow}>
            {codeDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                style={[
                  styles.codeBox,
                  styles.codeBoxText,
                  {
                    backgroundColor: "#FFFFFF",
                    borderColor: focusedIndex === index ? colors.primary : colors.border,
                    borderWidth: focusedIndex === index ? 2.5 : 1.5,
                    color: colors.foreground,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleCodeDigitChange(index, text)}
                onKeyPress={({nativeEvent}) => handleCodeKeyPress(index, nativeEvent.key)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={index === 0}
                editable={!isLoading}
                selectTextOnFocus
                textAlign="center"
                placeholder=""
                placeholderTextColor={colors.mutedForeground}
                selectionColor={colors.primary}
              />
            ))}
          </View>
          {errors.code ? (
            <Text style={[styles.errorText, {color: colors.destructive}]}>{errors.code}</Text>
          ) : null}

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
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.loginButtonText, {color: colors.primaryForeground}]}>
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
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  heroLogo: {
    width: 52,
    height: 52,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
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
  emailHighlight: {
    fontWeight: "600",
  },
  formContainer: {
    marginBottom: 32,
  },
  codeBoxesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    fontSize: 22,
    fontWeight: "700",
  },
  codeBoxText: {
    padding: 0,
    textAlign: "center",
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
