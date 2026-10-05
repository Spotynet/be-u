import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useCallback} from "react";
import {useRouter} from "expo-router";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {notificationApi} from "@/lib/api";
import {PRIVACY_POLICY_URL, TERMS_URL} from "@/constants/legal";

interface Session {
  id: number;
  platform: string;
  created_at: string;
  last_seen_at: string | null;
}

function platformLabel(platform: string): string {
  switch (platform.toLowerCase()) {
    case "ios":     return "iPhone / iPad";
    case "android": return "Android";
    case "web":     return "Web";
    default:        return "Dispositivo desconocido";
  }
}

function platformIcon(platform: string): keyof typeof Ionicons.glyphMap {
  switch (platform.toLowerCase()) {
    case "ios":     return "logo-apple";
    case "android": return "logo-android";
    case "web":     return "globe-outline";
    default:        return "phone-portrait-outline";
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {day: "numeric", month: "short", year: "numeric"}) +
    " " + d.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"});
}

export default function PrivacySecurity() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {logout} = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const res = await notificationApi.getActiveSessions();
      const data: Session[] = Array.isArray(res.data) ? res.data : [];
      setSessions(data);
    } catch {
      // Non-fatal — show empty state
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = (session: Session) => {
    Alert.alert(
      "Cerrar sesión en este dispositivo",
      `¿Cerrar la sesión en ${platformLabel(session.platform)}? El dispositivo dejará de recibir notificaciones.`,
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            setRevokingId(session.id);
            try {
              await notificationApi.revokeSession(session.id);
              setSessions(prev => prev.filter(s => s.id !== session.id));
            } catch {
              Alert.alert("Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRevokeAll = () => {
    Alert.alert(
      "Cerrar todas las sesiones",
      "Se cerrará la sesión en todos tus dispositivos y dejarán de recibir notificaciones. Tendrás que volver a iniciar sesión.",
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Cerrar todas",
          style: "destructive",
          onPress: async () => {
            setIsRevokingAll(true);
            try {
              await notificationApi.revokeAllSessions();
              setSessions([]);
              await logout();
              router.replace("/login");
            } catch {
              Alert.alert("Error", "No se pudo cerrar todas las sesiones. Inténtalo de nuevo.");
              setIsRevokingAll(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
      <AppHeader
        title="Seguridad y Privacidad"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── SESIONES ACTIVAS ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, {backgroundColor: "#3b82f6" + "18"}]}>
              <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
            </View>
            <Text style={[s.sectionTitle, {color: colors.foreground}]}>Sesiones Activas</Text>
          </View>
          <Text style={[s.sectionDesc, {color: colors.mutedForeground}]}>
            Dispositivos que tienen acceso a tu cuenta y recibirán notificaciones.
          </Text>

          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {isLoadingSessions ? (
              <View style={s.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[s.loadingText, {color: colors.mutedForeground}]}>Cargando dispositivos…</Text>
              </View>
            ) : sessions.length === 0 ? (
              <View style={s.emptyRow}>
                <Ionicons name="phone-portrait-outline" size={28} color={colors.mutedForeground} />
                <Text style={[s.emptyText, {color: colors.mutedForeground}]}>
                  No hay sesiones activas registradas
                </Text>
              </View>
            ) : (
              sessions.map((session, idx) => (
                <View key={session.id}>
                  {idx > 0 && <View style={[s.divider, {backgroundColor: colors.border}]} />}
                  <View style={s.sessionRow}>
                    <View style={[s.sessionIconWrap, {backgroundColor: colors.muted}]}>
                      <Ionicons name={platformIcon(session.platform)} size={20} color={colors.mutedForeground} />
                    </View>
                    <View style={s.sessionInfo}>
                      <Text style={[s.sessionLabel, {color: colors.foreground}]}>
                        {platformLabel(session.platform)}
                      </Text>
                      <Text style={[s.sessionDate, {color: colors.mutedForeground}]}>
                        Última actividad: {formatDate(session.last_seen_at ?? session.created_at)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRevokeSession(session)}
                      disabled={revokingId === session.id}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                      style={s.revokeBtn}>
                      {revokingId === session.id ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {sessions.length > 1 && (
            <TouchableOpacity
              style={[s.revokeAllBtn, {borderColor: colors.error + "60", backgroundColor: colors.error + "0D"}]}
              onPress={handleRevokeAll}
              disabled={isRevokingAll}
              activeOpacity={0.75}>
              {isRevokingAll ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Ionicons name="log-out-outline" size={16} color={colors.error} />
              )}
              <Text style={[s.revokeAllText, {color: colors.error}]}>
                {isRevokingAll ? "Cerrando sesiones…" : "Cerrar todas las sesiones"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── CUENTA ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, {backgroundColor: "#ef4444" + "18"}]}>
              <Ionicons name="person" size={16} color="#ef4444" />
            </View>
            <Text style={[s.sectionTitle, {color: colors.foreground}]}>Cuenta</Text>
          </View>

          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <TouchableOpacity
              style={s.linkRow}
              onPress={() => router.push("/delete-account")}
              activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[s.linkLabel, {color: colors.error}]}>Eliminar mi cuenta</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LEGAL ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, {backgroundColor: "#6b7280" + "18"}]}>
              <Ionicons name="document-text" size={16} color="#6b7280" />
            </View>
            <Text style={[s.sectionTitle, {color: colors.foreground}]}>Legal</Text>
          </View>

          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <TouchableOpacity
              style={s.linkRow}
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              activeOpacity={0.7}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.foreground} />
              <Text style={[s.linkLabel, {color: colors.foreground}]}>Política de Privacidad</Text>
              <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[s.divider, {backgroundColor: colors.border}]} />

            <TouchableOpacity
              style={s.linkRow}
              onPress={() => Linking.openURL(TERMS_URL)}
              activeOpacity={0.7}>
              <Ionicons name="reader-outline" size={20} color={colors.foreground} />
              <Text style={[s.linkLabel, {color: colors.foreground}]}>Términos y Condiciones</Text>
              <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 12},

  section: {marginBottom: 24},
  sectionHeader: {flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6, paddingHorizontal: 2},
  sectionIcon: {width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center"},
  sectionTitle: {fontSize: 14, fontWeight: "700", letterSpacing: 0.1},
  sectionDesc: {fontSize: 12, lineHeight: 17, marginBottom: 10, paddingHorizontal: 2},

  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  divider: {height: StyleSheet.hairlineWidth, marginHorizontal: 16},

  loadingRow: {flexDirection: "row", alignItems: "center", gap: 10, padding: 20, justifyContent: "center"},
  loadingText: {fontSize: 14},
  emptyRow: {alignItems: "center", gap: 8, paddingVertical: 28},
  emptyText: {fontSize: 13, textAlign: "center"},

  sessionRow: {flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12},
  sessionIconWrap: {width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center"},
  sessionInfo: {flex: 1},
  sessionLabel: {fontSize: 14, fontWeight: "600"},
  sessionDate: {fontSize: 12, marginTop: 2},
  revokeBtn: {padding: 4},

  revokeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  revokeAllText: {fontSize: 14, fontWeight: "600"},

  linkRow: {flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15, gap: 12},
  linkLabel: {flex: 1, fontSize: 15, fontWeight: "500"},

  bottomPad: {height: 32},
});
