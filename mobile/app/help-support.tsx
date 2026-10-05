import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  Linking,
} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {useState, useEffect} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {supportApi, errorUtils} from "@/lib/api";
import {FeedbackToast, FeedbackToastType} from "@/components/FeedbackToast";
import {AppHeader} from "@/components/ui/AppHeader";
import {CONTACT_EMAIL, CONTACT_URL} from "@/constants/legal";

const MINT_GREEN = "#5eead4";
const MAX_MESSAGE_LENGTH = 500;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB

type ThemeKey = "error" | "sugerencia" | "cita" | "queja" | "otro";

const THEME_OPTIONS: { key: ThemeKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "error", label: "Reportar un Error", icon: "bug" },
  { key: "sugerencia", label: "Sugerencia", icon: "bulb" },
  { key: "cita", label: "Problema con una Cita", icon: "calendar" },
  { key: "queja", label: "Queja", icon: "chatbubble-ellipses" },
  { key: "otro", label: "Otro", icon: "ellipse" },
];

// Micro-copy for toasts
const FEEDBACK_MESSAGES = {
  connection: { title: "Sin señal.", message: "Nabbi no puede conectar con la base. Revisa tu WiFi o datos y vuelve a intentar." },
  emptyFields: { title: "Faltan detalles.", message: "No nos dejes en visto. Escribe al menos una línea para saber cómo ayudarte." },
  fileTooBig: { title: "Imagen muy grande.", message: "Esa captura pesa mucho (Máx 5MB). Intenta recortarla o subirla en otro formato." },
  serverError: { title: "Ups, tuvimos un corto circuito.", message: "Algo falló de nuestro lado. Dale unos segundos y prueba enviar de nuevo." },
  success: (ticketId: string) => ({ title: "¡Recibido!", message: `El equipo ya tiene tu reporte (Ticket #${ticketId}). Te responderemos a tu correo pronto.` }),
};

export default function HelpSupportScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {user} = useAuth();

  const [theme, setTheme] = useState<ThemeKey | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState((user as any)?.email ?? "");
  const [attachment, setAttachment] = useState<{ uri: string; fileSize?: number } | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const userEmail = (user as any)?.email ?? "";
    setEmail((prev) => (prev === "" ? userEmail : prev));
  }, [user]);

  const [toast, setToast] = useState<{
    visible: boolean;
    type: FeedbackToastType;
    title: string;
    message: string;
    onRetry?: () => void;
  }>({ visible: false, type: "success", title: "", message: "" });

  const showToast = (
    type: FeedbackToastType,
    title: string,
    message: string,
    onRetry?: () => void
  ) => {
    setToast({ visible: true, type, title, message, onRetry });
  };

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería para adjuntar capturas.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let fileSize: number | undefined;
      if (Platform.OS === "web" && asset.uri) {
        try {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          fileSize = blob.size;
        } catch (_) {}
      }
      if (fileSize !== undefined && fileSize > MAX_ATTACHMENT_BYTES) {
        showToast("warning", FEEDBACK_MESSAGES.fileTooBig.title, FEEDBACK_MESSAGES.fileTooBig.message);
        return;
      }
      setAttachment({ uri: asset.uri, fileSize });
    }
  };

  const removeAttachment = () => setAttachment(null);

  const validateAndSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      showToast("warning", FEEDBACK_MESSAGES.emptyFields.title, FEEDBACK_MESSAGES.emptyFields.message);
      return;
    }
    if (!theme) {
      showToast("warning", FEEDBACK_MESSAGES.emptyFields.title, "Elige un tema para tu mensaje.");
      return;
    }
    if (!acceptTerms) {
      showToast("warning", "Faltan detalles.", "Debes aceptar que el equipo de soporte revise los datos técnicos de tu sesión.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast("warning", "Faltan detalles.", "Indica tu correo para poder responderte.");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("theme", theme);
      formData.append("message", trimmedMessage);
      formData.append("email", trimmedEmail);
      formData.append("accept_terms", acceptTerms ? "true" : "false");

      if (attachment) {
        if (Platform.OS === "web") {
          const res = await fetch(attachment.uri);
          const blob = await res.blob();
          if (blob.size > MAX_ATTACHMENT_BYTES) {
            showToast("warning", FEEDBACK_MESSAGES.fileTooBig.title, FEEDBACK_MESSAGES.fileTooBig.message);
            setSending(false);
            return;
          }
          const ext = (blob.type?.split("/")[1] || "jpg").replace("jpeg", "jpg");
          formData.append("attachment", new File([blob], `screenshot.${ext}`, { type: blob.type || "image/jpeg" }));
        } else {
          const uriParts = attachment.uri.split(".");
          const fileType = uriParts[uriParts.length - 1] || "jpg";
          formData.append("attachment", {
            uri: attachment.uri,
            type: `image/${fileType}`,
            name: `screenshot.${fileType}`,
          } as any);
        }
      }

      const response = await supportApi.submitFeedback(formData);
      const ticketId = (response.data as any)?.ticket_id ?? "1234";
      showToast("success", FEEDBACK_MESSAGES.success(ticketId).title, FEEDBACK_MESSAGES.success(ticketId).message);
      setTheme(null);
      setMessage("");
      setEmail((user as any)?.email ?? "");
      setAttachment(null);
      setAcceptTerms(false);
    } catch (error: any) {
      if (errorUtils.isNetworkError(error)) {
        showToast(
          "error",
          FEEDBACK_MESSAGES.connection.title,
          FEEDBACK_MESSAGES.connection.message,
          validateAndSubmit
        );
      } else if (error?.status === 413 || error?.response?.status === 413) {
        showToast("warning", FEEDBACK_MESSAGES.fileTooBig.title, FEEDBACK_MESSAGES.fileTooBig.message);
      } else if (error?.status === 500 || error?.response?.status === 500) {
        showToast(
          "error",
          FEEDBACK_MESSAGES.serverError.title,
          FEEDBACK_MESSAGES.serverError.message,
          validateAndSubmit
        );
      } else if (error?.status === 404 || error?.response?.status === 404) {
        showToast(
          "warning",
          "Próximamente",
          "El envío de soporte no está disponible aún. Prueba más tarde."
        );
      } else {
        const msg = errorUtils.getErrorMessage(error);
        showToast("error", "Error", msg, validateAndSubmit);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.contentBackground}]}>
      <AppHeader
        title="Ayuda y Soporte"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={styles.introRow}>
          <View style={[styles.introIcon, {backgroundColor: MINT_GREEN + "22"}]}>
            <Ionicons name="headset" size={22} color={MINT_GREEN} />
          </View>
          <View style={styles.introText}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>¿Cómo te ayudamos?</Text>
            <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
              Tu opinión hace que Nabbi sea más rápido e inteligente.
            </Text>
          </View>
        </View>

        <View style={[styles.contactCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Contacto</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} activeOpacity={0.7}>
            <Text style={[styles.contactLink, {color: colors.primary}]}>{CONTACT_EMAIL}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(CONTACT_URL)} activeOpacity={0.7}>
            <Text style={[styles.contactLink, {color: colors.primary}]}>{CONTACT_URL}</Text>
          </TouchableOpacity>
        </View>

        {/* Theme */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Tema</Text>
          <View style={styles.chipRow}>
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setTheme(opt.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={selected ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[styles.chipText, {color: selected ? colors.primaryForeground : colors.foreground}]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {theme === "cita" && (
          <View style={[styles.interceptBox, {backgroundColor: colors.muted, borderColor: colors.border}]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} style={{marginTop: 1}} />
            <Text style={[styles.interceptText, {color: colors.foreground}]}>
              ¿Sabías qué? La mayoría de los problemas de agenda se deben a fallas en el portal del proveedor, no en Nabbi.{" "}
              <Text style={[styles.interceptLink, {color: colors.primary}]}>
                Ver estatus de servicios externos
              </Text>
            </Text>
          </View>
        )}

        {/* Message */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Cuéntanos más</Text>
          <TextInput
            style={[styles.textArea, {backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground}]}
            placeholder="Escribe aquí los detalles. Si es un error, dinos qué estabas haciendo cuando ocurrió..."
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={setMessage}
            maxLength={MAX_MESSAGE_LENGTH}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, {color: colors.mutedForeground}]}>
            {message.length}/{MAX_MESSAGE_LENGTH} caracteres
          </Text>
        </View>

        {/* Attachment */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Evidencia (opcional)</Text>
          <TouchableOpacity
            onPress={pickImage}
            style={[styles.attachButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          >
            <Ionicons name="image" size={20} color={colors.primary} />
            <Text style={[styles.attachButtonText, {color: colors.foreground}]}>
              Adjuntar Captura de Pantalla
            </Text>
          </TouchableOpacity>
          {attachment && (
            <View style={[styles.previewRow, {borderColor: colors.border, backgroundColor: colors.card}]}>
              <Image source={{uri: attachment.uri}} style={styles.previewImage} />
              <TouchableOpacity onPress={removeAttachment} style={styles.removeAttachment}>
                <Ionicons name="close-circle" size={24} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Correo de contacto</Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground}]}
            placeholder="tu@correo.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.hint, {color: colors.mutedForeground}]}>
            Te responderemos a este correo.
          </Text>
        </View>

        {/* Legal */}
        <TouchableOpacity
          onPress={() => setAcceptTerms(!acceptTerms)}
          style={[styles.legalRow, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {backgroundColor: acceptTerms ? colors.primary : "transparent", borderColor: acceptTerms ? colors.primary : colors.border},
            ]}
          >
            {acceptTerms && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
          </View>
          <Text style={[styles.legalText, {color: colors.mutedForeground}]}>
            Al enviar, aceptas que el equipo de soporte revise los datos técnicos de tu sesión para solucionar el problema.
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>

      <View
        style={[
          styles.fixedFooter,
          {
            backgroundColor: colors.contentBackground,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <TouchableOpacity
          onPress={validateAndSubmit}
          disabled={sending}
          style={[styles.submitButton, {backgroundColor: sending ? colors.muted : MINT_GREEN}]}
          activeOpacity={0.85}>
          {sending ? (
            <ActivityIndicator color="#065f46" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={16} color="#065f46" />
              <Text style={styles.submitButtonText}>Enviar Mensaje</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FeedbackToast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onRetry={toast.onRetry}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flex: 1},
  contentInner: {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40},

  introRow: {flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 24},
  introIcon: {width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 2},
  introText: {flex: 1},
  sectionTitle: {fontSize: 17, fontWeight: "700", marginBottom: 4},
  subtitle: {fontSize: 13, lineHeight: 19},

  fieldGroup: {marginBottom: 20},
  label: {fontSize: 14, fontWeight: "600", marginBottom: 8},

  chipRow: {flexDirection: "row", flexWrap: "wrap", gap: 8},
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {fontSize: 13, fontWeight: "500", flexShrink: 1},

  contactCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 6,
  },
  contactLink: {fontSize: 14, fontWeight: "600"},

  interceptBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  interceptText: {fontSize: 13, lineHeight: 20, flex: 1},
  interceptLink: {fontWeight: "600"},

  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    fontSize: 14,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 4},
      android: {elevation: 1},
    }),
  },
  charCount: {fontSize: 12, marginTop: 5, textAlign: "right"},

  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 4},
      android: {elevation: 1},
    }),
  },
  attachButtonText: {fontSize: 14, fontWeight: "600"},
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  previewImage: {width: 60, height: 60, borderRadius: 8},
  removeAttachment: {padding: 4},

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 4},
      android: {elevation: 1},
    }),
  },
  hint: {fontSize: 12, marginTop: 5},

  legalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  legalText: {fontSize: 13, lineHeight: 19, flex: 1},

  fixedFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.08, shadowRadius: 8},
      android: {elevation: 5},
    }),
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    minHeight: 52,
  },
  submitButtonText: {fontSize: 16, fontWeight: "700", color: "#065f46"},
  bottomPad: {height: 16},
});
