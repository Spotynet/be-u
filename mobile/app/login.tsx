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
  Pressable,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useRef} from "react";
import {useAuth} from "@/features/auth";
import {useGoogleAuth} from "@/hooks/useGoogleAuth";
import {useNavigation} from "@/hooks/useNavigation";

export default function Login() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {goBack} = useNavigation();
  const {requestEmailCode, isLoading} = useAuth();
  const {connectWithGoogle, isConnecting, error: googleAuthError} = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({email: ""});
  const [successMessage, setSuccessMessage] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  const logoScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (): boolean => {
    const newErrors = {email: ""};
    let isValid = true;

    if (!email) {
      newErrors.email = "El email es requerido";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email inválido";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendCode = async () => {
    // Clear previous messages
    setSuccessMessage("");
    setGeneralError("");
    setErrors({email: ""});

    if (!validateEmail()) return;

    try {
      await requestEmailCode(email);
      // Navigate to email code entry screen
      router.push({
        pathname: "/email-code",
        params: {email},
      });
    } catch (error: any) {
      // Handle specific error types with beautiful inline messages
      if (error.message?.includes("Network") || error.message?.includes("timeout")) {
        setGeneralError("Error de conexión. Verifica tu internet e intenta nuevamente.");
      } else if (error.message?.includes("Server") || error.message?.includes("500")) {
        setGeneralError("Error del servidor. Por favor intenta más tarde.");
      } else {
        setGeneralError(error.message || "Ocurrió un error inesperado. Intenta nuevamente.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    setSuccessMessage("");
    setGeneralError("");

    const result = await connectWithGoogle();
    if (result === true) {
      setSuccessMessage("¡Inicio de sesión con Google exitoso!");
      setTimeout(() => {
        router.replace("/(tabs)/perfil");
      }, 800);
      return;
    } else if (result === "requires_registration") {
      // User will be redirected to register page by the hook
      return;
    }

    if (googleAuthError) {
      setGeneralError(googleAuthError);
    } else {
      setGeneralError("No se pudo completar el inicio de sesión con Google.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      {/* Minimal header */}
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
          style={styles.backButton}
          onPress={() => goBack("/(tabs)/")}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Iniciar sesión</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + 48}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={{opacity: contentOpacity}}>
          {/* Logo + brand */}
          <View style={styles.hero}>
            <Animated.View style={[styles.logoWrap, {transform: [{scale: logoScale}]}]}>
              <View style={[styles.logoCircle, {backgroundColor: colors.primary}]}>
                <Ionicons name="sparkles" color={colors.primaryForeground} size={28} />
              </View>
            </Animated.View>
            <Text style={[styles.brandName, {color: colors.foreground}]}>nabbi</Text>
            <Text style={[styles.heroSubtitle, {color: colors.mutedForeground}]}>
              Ingresa tu correo y te enviamos un código para iniciar sesión
            </Text>
          </View>

          {/* Messages */}
          {successMessage ? (
            <View style={[styles.banner, styles.bannerSuccess, {backgroundColor: colors.success}]}>
              <Ionicons name="checkmark-circle" color={colors.successForeground} size={20} />
              <Text style={[styles.bannerText, {color: colors.successForeground}]}>
                {successMessage}
              </Text>
            </View>
          ) : null}
          {generalError ? (
            <View style={[styles.banner, styles.bannerError, {backgroundColor: colors.destructive}]}>
              <Ionicons name="alert-circle" color={colors.destructiveForeground} size={20} />
              <Text style={[styles.bannerText, {color: colors.destructiveForeground}]}>
                {generalError}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.label, {color: colors.foreground}]}>Correo electrónico</Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: colors.input,
                  borderColor: inputFocused ? colors.primary : colors.border,
                  borderWidth: inputFocused ? 2 : 1.5,
                },
              ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={inputFocused ? colors.primary : colors.mutedForeground}
              />
              <TextInput
                style={[styles.input, {color: colors.foreground}]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                editable={!isLoading}
              />
            </View>
            {errors.email ? (
              <Text style={[styles.fieldError, {color: colors.destructive}]}>{errors.email}</Text>
            ) : null}

            <Pressable
              style={({pressed}) => [
                styles.primaryBtn,
                {backgroundColor: colors.primary},
                isLoading && styles.primaryBtnDisabled,
                pressed && !isLoading && styles.primaryBtnPressed,
              ]}
              onPress={handleSendCode}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.primaryBtnText, {color: colors.primaryForeground}]}>
                  Enviar código
                </Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, {backgroundColor: colors.border}]} />
              <Text style={[styles.dividerLabel, {color: colors.mutedForeground}]}>o</Text>
              <View style={[styles.dividerLine, {backgroundColor: colors.border}]} />
            </View>

            <Pressable
              style={({pressed}) => [
                styles.secondaryBtn,
                {backgroundColor: colors.card, borderColor: colors.border},
                isConnecting && styles.primaryBtnDisabled,
                pressed && !isConnecting && styles.secondaryBtnPressed,
              ]}
              onPress={handleGoogleLogin}
              disabled={isConnecting}>
              {isConnecting ? (
                <ActivityIndicator color={colors.foreground} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.foreground} />
                  <Text style={[styles.secondaryBtnText, {color: colors.foreground}]}>
                    Continuar con Google
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoWrap: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  bannerSuccess: {},
  bannerError: {},
  bannerText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  form: {},
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  fieldError: {
    fontSize: 13,
    marginTop: 6,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryBtnPressed: {
    opacity: 0.85,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
