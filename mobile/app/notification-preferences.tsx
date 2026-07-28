import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useMemo, useEffect} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {UserRole} from "@/types/global";
import {notificationApi} from "@/lib/api";

interface PrefItem {
  key: string;
  label: string;
  description: string;
  defaultOn: boolean;
  /** Items marked soon are display-only; their toggle is disabled */
  soon?: boolean;
}

interface PrefSection {
  title: string;
  icon: string;
  iconColor: string;
  items: PrefItem[];
}

// ─── CLIENT ──────────────────────────────────────────────────────────────────
// Clients book services; they don't *receive* booking requests.
// They leave reviews; they don't *receive* reviews.
const CLIENT_SECTIONS: PrefSection[] = [
  {
    title: "Mis Reservas",
    icon: "calendar",
    iconColor: "#3b82f6",
    items: [
      {
        key: "booking_confirmed",
        label: "Reserva confirmada",
        description: "El profesional aceptó tu solicitud de cita",
        defaultOn: true,
      },
      {
        key: "booking_cancelled",
        label: "Reserva cancelada",
        description: "Una cita tuya fue cancelada",
        defaultOn: true,
      },
      {
        key: "booking_reminder",
        label: "Recordatorio de cita",
        description: "Aviso 24 h antes de tu próxima cita",
        defaultOn: true,
      },
    ],
  },
  {
    title: "Actividad Social",
    icon: "heart",
    iconColor: "#ec4899",
    items: [
      {
        key: "social_like",
        label: "Me gusta en tu publicación",
        description: "Alguien marcó tu post como favorito",
        defaultOn: false,
      },
      {
        key: "social_comment",
        label: "Comentario en tu publicación",
        description: "Alguien comentó en tu contenido",
        defaultOn: true,
      },
      {
        key: "social_follow",
        label: "Nuevo seguidor",
        description: "Alguien comenzó a seguirte",
        defaultOn: true,
        soon: true,
      },
      {
        key: "social_mention",
        label: "Mención",
        description: "Te mencionaron en un comentario o publicación",
        defaultOn: true,
      },
    ],
  },
  {
    title: "Mis Reseñas",
    icon: "star",
    iconColor: "#f59e0b",
    items: [
      {
        key: "review_reply",
        label: "Respuesta a tu reseña",
        description: "El profesional respondió la reseña que dejaste",
        defaultOn: true,
      },
    ],
  },
  {
    title: "Descubrimiento",
    icon: "sparkles",
    iconColor: "#10b981",
    items: [
      {
        key: "discover_nearby",
        label: "Nuevos profesionales cerca de ti",
        description: "Profesionales o lugares destacados en tu zona",
        defaultOn: true,
        soon: true,
      },
      {
        key: "discover_offers",
        label: "Ofertas y descuentos",
        description: "Promociones especiales de profesionales que sigues",
        defaultOn: false,
        soon: true,
      },
    ],
  },
  {
    title: "Promociones y Novedades",
    icon: "megaphone",
    iconColor: "#f97316",
    items: [
      {
        key: "promo_news",
        label: "Novedades de la app",
        description: "Nuevas funciones y actualizaciones importantes",
        defaultOn: true,
        soon: true,
      },
      {
        key: "promo_tips",
        label: "Consejos personalizados",
        description: "Tips para sacar el máximo provecho de la app",
        defaultOn: false,
        soon: true,
      },
    ],
  },
  {
    title: "Canales de Entrega",
    icon: "settings",
    iconColor: "#6b7280",
    items: [
      {
        key: "channel_push",
        label: "Notificaciones push",
        description: "Alertas en tiempo real en este dispositivo",
        defaultOn: true,
      },
      {
        key: "channel_email",
        label: "Resumen por correo",
        description: "Resumen semanal de actividad en tu email",
        defaultOn: false,
      },
    ],
  },
];

// ─── PROFESSIONAL ─────────────────────────────────────────────────────────────
// Pros receive booking requests, get reviewed, and manage their business.
const PROFESSIONAL_SECTIONS: PrefSection[] = [
  {
    title: "Reservas y Agenda",
    icon: "calendar",
    iconColor: "#3b82f6",
    items: [
      {
        key: "booking_new",
        label: "Nueva solicitud de reserva",
        description: "Un cliente envió una solicitud de cita",
        defaultOn: true,
      },
      {
        key: "booking_confirmed",
        label: "Reserva confirmada",
        description: "Una cita quedó confirmada en tu agenda",
        defaultOn: true,
      },
      {
        key: "booking_cancelled",
        label: "Reserva cancelada",
        description: "Un cliente canceló una cita agendada",
        defaultOn: true,
      },
      {
        key: "booking_reminder",
        label: "Recordatorio de cita",
        description: "Aviso 1 h antes de tu próxima cita",
        defaultOn: true,
      },
    ],
  },
  {
    title: "Reseñas y Valoraciones",
    icon: "star",
    iconColor: "#f59e0b",
    items: [
      {
        key: "review_new",
        label: "Nueva reseña",
        description: "Un cliente dejó una reseña de tu servicio",
        defaultOn: true,
      },
      {
        key: "review_reply",
        label: "Respuesta a tu comentario",
        description: "Alguien respondió a tu respuesta en una reseña",
        defaultOn: true,
      },
    ],
  },
  {
    title: "Actividad Social",
    icon: "heart",
    iconColor: "#ec4899",
    items: [
      {
        key: "social_like",
        label: "Me gusta en tu publicación",
        description: "Alguien marcó tu post como favorito",
        defaultOn: false,
      },
      {
        key: "social_comment",
        label: "Comentario en tu publicación",
        description: "Alguien comentó en tu contenido",
        defaultOn: true,
      },
      {
        key: "social_follow",
        label: "Nuevo seguidor",
        description: "Alguien comenzó a seguir tu perfil profesional",
        defaultOn: true,
        soon: true,
      },
      {
        key: "social_mention",
        label: "Mención",
        description: "Te mencionaron en un comentario o publicación",
        defaultOn: true,
      },
      {
        key: "social_saved",
        label: "Guardado en favoritos",
        description: "Un usuario guardó tu perfil en sus favoritos",
        defaultOn: false,
      },
    ],
  },
  {
    title: "Rendimiento y Negocio",
    icon: "trending-up",
    iconColor: "#10b981",
    items: [
      {
        key: "business_weekly",
        label: "Resumen semanal",
        description: "Estadísticas de visitas, reservas y valoración de la semana",
        defaultOn: true,
        soon: true,
      },
      {
        key: "business_milestone",
        label: "Hitos alcanzados",
        description: "Cuando alcanzas un número destacado de reseñas o reservas",
        defaultOn: true,
        soon: true,
      },
    ],
  },
  {
    title: "Promociones y Novedades",
    icon: "megaphone",
    iconColor: "#f97316",
    items: [
      {
        key: "promo_news",
        label: "Novedades de la plataforma",
        description: "Nuevas herramientas y funciones para profesionales",
        defaultOn: true,
        soon: true,
      },
      {
        key: "promo_tips",
        label: "Consejos para tu negocio",
        description: "Tips para aumentar reservas y visibilidad",
        defaultOn: false,
        soon: true,
      },
    ],
  },
  {
    title: "Canales de Entrega",
    icon: "settings",
    iconColor: "#6b7280",
    items: [
      {
        key: "channel_push",
        label: "Notificaciones push",
        description: "Alertas en tiempo real en este dispositivo",
        defaultOn: true,
      },
      {
        key: "channel_email",
        label: "Resumen por correo",
        description: "Resumen diario de reservas y actividad en tu email",
        defaultOn: true,
      },
    ],
  },
];

// PLACE uses the same set as PROFESSIONAL but with place-specific copy
const PLACE_SECTIONS: PrefSection[] = PROFESSIONAL_SECTIONS.map(section => {
  if (section.title !== "Reservas y Agenda") return section;
  return {
    ...section,
    items: section.items.map(item => {
      if (item.key === "booking_new")
        return {...item, label: "Nueva solicitud de visita", description: "Un cliente solicitó una visita o reserva en tu lugar"};
      if (item.key === "booking_reminder")
        return {...item, description: "Aviso antes de la apertura del lugar o una visita programada"};
      return item;
    }),
  };
});

function getSections(role: UserRole | undefined): PrefSection[] {
  if (role === "PROFESSIONAL") return PROFESSIONAL_SECTIONS;
  if (role === "PLACE") return PLACE_SECTIONS;
  return CLIENT_SECTIONS;
}

function buildDefaults(sections: PrefSection[]): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const section of sections) {
    for (const item of section.items) {
      defaults[item.key] = item.defaultOn;
    }
  }
  return defaults;
}

export default function NotificationPreferences() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {user} = useAuth();

  const sections = useMemo(() => getSections(user?.role), [user?.role]);
  const defaults = useMemo(() => buildDefaults(sections), [sections]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved preferences from backend on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await notificationApi.getPreferences();
        if (!cancelled && res.data?.preferences) {
          // Merge server values over defaults so new keys always have a sensible default
          setPrefs({...defaults, ...res.data.preferences});
        }
      } catch {
        // Network error — fall back to defaults silently
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (key: string) =>
    setPrefs(prev => ({...prev, [key]: !prev[key]}));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await notificationApi.savePreferences(prefs);
      router.push("/(tabs)/perfil");
    } catch (err) {
      console.error("Error saving notification preferences:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
        <AppHeader title="Notificaciones" showBackButton onBackPress={() => router.back()} />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, {color: colors.mutedForeground}]}>Cargando preferencias…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
      <AppHeader
        title="Notificaciones"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>

        {sections.map(section => (
          <View key={section.title} style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionIcon, {backgroundColor: section.iconColor + "18"}]}>
                <Ionicons name={section.icon as any} size={16} color={section.iconColor} />
              </View>
              <Text style={[s.sectionTitle, {color: colors.foreground}]}>{section.title}</Text>
            </View>

            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              {section.items.map((item, idx) => (
                <View key={item.key}>
                  {idx > 0 && <View style={[s.divider, {backgroundColor: colors.border}]} />}
                  <TouchableOpacity
                    style={[s.row, item.soon && s.rowDisabled]}
                    onPress={item.soon ? undefined : () => toggle(item.key)}
                    activeOpacity={item.soon ? 1 : 0.7}>
                    <View style={s.rowText}>
                      <View style={s.rowLabelRow}>
                        <Text style={[s.rowLabel, {color: item.soon ? colors.mutedForeground : colors.foreground}]}>
                          {item.label}
                        </Text>
                        {item.soon && (
                          <View style={[s.soonBadge, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                            <Text style={[s.soonText, {color: colors.mutedForeground}]}>Próximamente</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.rowDesc, {color: colors.mutedForeground}]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    <Switch
                      value={item.soon ? false : (prefs[item.key] ?? false)}
                      onValueChange={item.soon ? undefined : () => toggle(item.key)}
                      disabled={item.soon}
                      trackColor={{false: colors.border, true: colors.primary + "80"}}
                      thumbColor={(prefs[item.key] && !item.soon) ? colors.primary : colors.muted}
                      ios_backgroundColor={colors.border}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={s.bottomPad} />
      </ScrollView>

      <View
        style={[
          s.fixedFooter,
          {
            backgroundColor: colors.contentBackground,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <TouchableOpacity
          style={[s.saveBtn, {backgroundColor: isSaving ? colors.muted : colors.primary}]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}>
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color={colors.primaryForeground} />
              <Text style={[s.saveBtnText, {color: colors.primaryForeground}]}>Guardando…</Text>
            </>
          ) : (
            <Text style={[s.saveBtnText, {color: colors.primaryForeground}]}>Guardar Preferencias</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},

  loadingContainer: {flex: 1, justifyContent: "center", alignItems: "center", gap: 12},
  loadingText: {fontSize: 14},

  section: {marginBottom: 20},
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {fontSize: 14, fontWeight: "700", letterSpacing: 0.1},

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

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowText: {flex: 1},
  rowDisabled: {opacity: 0.6},
  rowLabelRow: {flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2},
  rowLabel: {fontSize: 15, fontWeight: "500"},
  rowDesc: {fontSize: 12, lineHeight: 16},
  soonBadge: {paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1},
  soonText: {fontSize: 10, fontWeight: "600", letterSpacing: 0.3},

  fixedFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.08, shadowRadius: 8},
      android: {elevation: 5},
    }),
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {fontSize: 16, fontWeight: "700"},
  bottomPad: {height: 16},
});
