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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { supportApi, errorUtils } from "@/lib/api";
import { FeedbackToast, FeedbackToastType } from "@/components/FeedbackToast";

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
  const { colors } = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 12),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Ayuda y Soporte
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          ¿Cómo te ayudamos?
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Tu opinión hace que Nabbi sea más rápido e inteligente.
        </Text>

        {/* Theme chips */}
        <Text style={[styles.label, { color: colors.foreground }]}>Tema</Text>
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
                    backgroundColor: selected ? colors.primary : colors.input,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={selected ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? colors.primaryForeground : colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {theme === "cita" && (
          <View style={[styles.interceptBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.interceptText, { color: colors.foreground }]}>
              ¿Sabías qué? La mayoría de los problemas de agenda se deben a fallas en el portal del proveedor, no en Nabbi.{" "}
              <Text style={[styles.interceptLink, { color: colors.primary }]}>
                Ver estatus de servicios externos
              </Text>
            </Text>
          </View>
        )}

        {/* Message */}
        <Text style={[styles.label, { color: colors.foreground }]}>Cuéntanos más</Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.input,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Escribe aquí los detalles. Si es un error, dinos qué estabas haciendo cuando ocurrió..."
          placeholderTextColor={colors.mutedForeground}
          value={message}
          onChangeText={setMessage}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
          {message.length}/{MAX_MESSAGE_LENGTH} caracteres
        </Text>

        {/* Attachment */}
        <Text style={[styles.label, { color: colors.foreground }]}>Evidencia (opcional)</Text>
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.attachButton, { backgroundColor: colors.input, borderColor: colors.border }]}
        >
          <Ionicons name="image" size={22} color={colors.primary} />
          <Text style={[styles.attachButtonText, { color: colors.foreground }]}>
            Adjuntar Captura de Pantalla
          </Text>
        </TouchableOpacity>
        {attachment && (
          <View style={[styles.previewRow, { borderColor: colors.border }]}>
            <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
            <TouchableOpacity onPress={removeAttachment} style={styles.removeAttachment}>
              <Ionicons name="close-circle" size={24} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}

        {/* Email */}
        <Text style={[styles.label, { color: colors.foreground }]}>Correo</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
          ]}
          placeholder="tu@correo.com"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Te responderemos a este correo.
        </Text>

        {/* Legal */}
        <TouchableOpacity
          onPress={() => setAcceptTerms(!acceptTerms)}
          style={styles.legalRow}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: acceptTerms ? colors.primary : "transparent",
                borderColor: colors.border,
              },
            ]}
          >
            {acceptTerms && <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />}
          </View>
          <Text style={[styles.legalText, { color: colors.mutedForeground }]}>
            Al enviar, aceptas que el equipo de soporte revise los datos técnicos de tu sesión para solucionar el problema.
          </Text>
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          onPress={validateAndSubmit}
          disabled={sending}
          style={[styles.submitButton, { backgroundColor: MINT_GREEN }]}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#065f46" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar Mensaje</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSpacer: { width: 40 },
  content: { flex: 1 },
  contentInner: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 24 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    maxWidth: "100%",
  },
  chipText: { fontSize: 14, fontWeight: "500", flexShrink: 1 },
  interceptBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  interceptText: { fontSize: 13, lineHeight: 20 },
  interceptLink: { fontWeight: "600" },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
  },
  charCount: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  attachButtonText: { fontSize: 15, fontWeight: "600" },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  previewImage: { width: 64, height: 64, borderRadius: 8 },
  removeAttachment: { padding: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 4,
  },
  hint: { fontSize: 13, marginBottom: 16 },
  legalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  legalText: { fontSize: 13, lineHeight: 20, flex: 1 },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  submitButtonText: { fontSize: 16, fontWeight: "700", color: "#065f46" },
});
