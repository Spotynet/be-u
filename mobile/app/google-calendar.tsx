import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useCallback} from "react";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {calendarApi} from "@/lib/api";

const GOOGLE_GREEN = "#34a853";

type Status = {
  is_connected: boolean;
  calendar_id: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  is_active: boolean;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {day: "numeric", month: "short", year: "numeric"}) +
    " · " + d.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"});
}

export default function GoogleCalendarScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {user} = useAuth();
  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  const [status, setStatus] = useState<Status | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await calendarApi.getStatus();
      setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const res = await calendarApi.getAuthUrl();
      const authUrl = res.data?.auth_url;
      if (!authUrl) throw new Error("No auth URL returned");
      await Linking.openURL(authUrl);
      // After returning from browser, reload status
      setTimeout(loadStatus, 2000);
    } catch {
      Alert.alert("Error", "No se pudo iniciar la conexión con Google Calendar.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await calendarApi.syncAvailability();
      await loadStatus();
      Alert.alert("Sincronizado", "Tu disponibilidad fue sincronizada con Google Calendar.");
    } catch {
      Alert.alert("Error", "No se pudo sincronizar. Inténtalo de nuevo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Desconectar Google Calendar",
      "¿Deseas desconectar tu cuenta de Google Calendar? Perderás la sincronización automática.",
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Desconectar",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDisconnecting(true);
              await calendarApi.disconnect();
              await loadStatus();
            } catch {
              Alert.alert("Error", "No se pudo desconectar. Inténtalo de nuevo.");
            } finally {
              setIsDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  const connected = status?.is_connected ?? false;

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
      <AppHeader title="Google Calendar" showBackButton onBackPress={() => router.back()} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[s.heroCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={[s.heroIcon, {backgroundColor: GOOGLE_GREEN + "18"}]}>
            <Ionicons name="calendar" size={32} color={GOOGLE_GREEN} />
          </View>
          <Text style={[s.heroTitle, {color: colors.foreground}]}>Google Calendar</Text>
          <Text style={[s.heroDesc, {color: colors.mutedForeground}]}>
            {isProvider
              ? "Conecta tu cuenta de Google para sincronizar tus reservas y disponibilidad automáticamente."
              : "Conecta tu cuenta de Google para que tus reservas aparezcan directamente en tu calendario."}
          </Text>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{marginTop: 8}} />
          ) : (
            <View style={[s.statusPill, {
              backgroundColor: connected ? GOOGLE_GREEN + "18" : colors.muted,
              borderColor: connected ? GOOGLE_GREEN + "40" : colors.border,
            }]}>
              <View style={[s.statusDot, {backgroundColor: connected ? GOOGLE_GREEN : colors.mutedForeground}]} />
              <Text style={[s.statusLabel, {color: connected ? GOOGLE_GREEN : colors.mutedForeground}]}>
                {connected ? "Conectado" : "No conectado"}
              </Text>
            </View>
          )}
        </View>

        {/* Details when connected */}
        {connected && status && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionIcon, {backgroundColor: GOOGLE_GREEN + "18"}]}>
                <Ionicons name="information-circle" size={16} color={GOOGLE_GREEN} />
              </View>
              <Text style={[s.sectionTitle, {color: colors.foreground}]}>Detalles de conexión</Text>
            </View>

            <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              {status.calendar_id && (
                <View style={s.detailRow}>
                  <Text style={[s.detailLabel, {color: colors.mutedForeground}]}>Calendario</Text>
                  <Text style={[s.detailValue, {color: colors.foreground}]} numberOfLines={1}>
                    {status.calendar_id}
                  </Text>
                </View>
              )}
              <View style={[s.divider, {backgroundColor: colors.border}]} />
              <View style={s.detailRow}>
                <Text style={[s.detailLabel, {color: colors.mutedForeground}]}>Última sincronización</Text>
                <Text style={[s.detailValue, {color: colors.foreground}]}>
                  {formatDate(status.last_sync_at)}
                </Text>
              </View>
              {status.sync_error && (
                <>
                  <View style={[s.divider, {backgroundColor: colors.border}]} />
                  <View style={s.detailRow}>
                    <Text style={[s.detailLabel, {color: "#ef4444"}]}>Error</Text>
                    <Text style={[s.detailValue, {color: "#ef4444"}]} numberOfLines={2}>
                      {status.sync_error}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Benefits */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, {backgroundColor: "#3b82f6" + "18"}]}>
              <Ionicons name="sparkles" size={16} color="#3b82f6" />
            </View>
            <Text style={[s.sectionTitle, {color: colors.foreground}]}>Beneficios</Text>
          </View>

          <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {(isProvider ? [
              {icon: "sync", text: "Tus reservas se añaden automáticamente a Google Calendar"},
              {icon: "eye-off", text: "Tu disponibilidad se bloquea cuando tienes eventos en Google Calendar"},
              {icon: "notifications", text: "Recibe recordatorios directamente en tu calendario"},
            ] : [
              {icon: "calendar", text: "Tus reservas confirmadas aparecen automáticamente en Google Calendar"},
              {icon: "notifications", text: "Recibe recordatorios de tus citas directamente en tu calendario"},
              {icon: "phone-portrait", text: "Accede a tus reservas desde cualquier dispositivo con Google Calendar"},
            ]).map((item, idx, arr) => (
              <View key={item.text}>
                <View style={s.benefitRow}>
                  <View style={[s.benefitIcon, {backgroundColor: "#3b82f6" + "12"}]}>
                    <Ionicons name={item.icon as any} size={16} color="#3b82f6" />
                  </View>
                  <Text style={[s.benefitText, {color: colors.foreground}]}>{item.text}</Text>
                </View>
                {idx < arr.length - 1 && <View style={[s.divider, {backgroundColor: colors.border}]} />}
              </View>
            ))}
          </View>
        </View>

        <View style={s.bottomPad} />
      </ScrollView>

      {/* Fixed footer actions */}
      <View style={[s.footer, {
        backgroundColor: colors.contentBackground,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16),
      }]}>
        {!isLoading && connected && isProvider && (
          <TouchableOpacity
            style={[s.syncBtn, {borderColor: colors.border, backgroundColor: colors.card}]}
            onPress={handleSync}
            disabled={isSyncing}
            activeOpacity={0.8}>
            {isSyncing
              ? <ActivityIndicator size="small" color={colors.foreground} />
              : <Ionicons name="sync" size={18} color={colors.foreground} />
            }
            <Text style={[s.syncBtnText, {color: colors.foreground}]}>
              {isSyncing ? "Sincronizando…" : "Sincronizar ahora"}
            </Text>
          </TouchableOpacity>
        )}

        {!isLoading && !connected && (
          <TouchableOpacity
            style={[s.connectBtn, {backgroundColor: isConnecting ? colors.muted : GOOGLE_GREEN}]}
            onPress={handleConnect}
            disabled={isConnecting}
            activeOpacity={0.85}>
            {isConnecting
              ? <ActivityIndicator size="small" color="#ffffff" />
              : <Ionicons name="logo-google" size={18} color="#ffffff" />
            }
            <Text style={s.connectBtnText}>
              {isConnecting ? "Conectando…" : "Conectar con Google"}
            </Text>
          </TouchableOpacity>
        )}

        {!isLoading && connected && (
          <TouchableOpacity
            style={[s.disconnectBtn, {borderColor: "#ef4444" + "50", backgroundColor: "#ef4444" + "0D"}]}
            onPress={handleDisconnect}
            disabled={isDisconnecting}
            activeOpacity={0.8}>
            {isDisconnecting
              ? <ActivityIndicator size="small" color="#ef4444" />
              : <Ionicons name="unlink" size={16} color="#ef4444" />
            }
            <Text style={[s.disconnectText]}>
              {isDisconnecting ? "Desconectando…" : "Desconectar Google Calendar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 12},

  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    padding: 24,
    marginBottom: 24,
    gap: 10,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  heroIcon: {width: 72, height: 72, borderRadius: 20, justifyContent: "center", alignItems: "center"},
  heroTitle: {fontSize: 20, fontWeight: "800"},
  heroDesc: {fontSize: 14, lineHeight: 20, textAlign: "center"},
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  statusDot: {width: 7, height: 7, borderRadius: 4},
  statusLabel: {fontSize: 13, fontWeight: "600"},

  section: {marginBottom: 24},
  sectionHeader: {flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, paddingHorizontal: 2},
  sectionIcon: {width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center"},
  sectionTitle: {fontSize: 14, fontWeight: "700"},

  detailCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  divider: {height: StyleSheet.hairlineWidth, marginHorizontal: 16},
  detailRow: {flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, gap: 12},
  detailLabel: {fontSize: 13, fontWeight: "500", flexShrink: 0},
  detailValue: {fontSize: 13, flex: 1, textAlign: "right"},

  benefitRow: {flexDirection: "row", alignItems: "center", gap: 12, padding: 14},
  benefitIcon: {width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center"},
  benefitText: {fontSize: 14, flex: 1, lineHeight: 19},

  bottomPad: {height: 16},

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.08, shadowRadius: 8},
      android: {elevation: 5},
    }),
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
  },
  connectBtnText: {color: "#ffffff", fontSize: 16, fontWeight: "700"},
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncBtnText: {fontSize: 14, fontWeight: "600"},
  disconnectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  disconnectText: {color: "#ef4444", fontSize: 14, fontWeight: "600"},
});
