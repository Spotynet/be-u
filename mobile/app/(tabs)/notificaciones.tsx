import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  Animated,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useMemo, useRef, useCallback} from "react";
import {useRouter} from "expo-router";
import {NotificationCard} from "@/components/notifications";
import {useNotifications, NotificationType, Notification as NotifModel} from "@/features/notifications";
import {useAuth} from "@/features/auth";
import {linkApi, trackingApi} from "@/lib/api";
import {useIncomingReservations} from "@/features/reservations";
import {AppHeader} from "@/components/ui/AppHeader";

// ── Date grouping helpers ─────────────────────────────────────────────────────
function getDateGroupKey(timestamp: string): string {
  const d    = new Date(timestamp);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  const dDay  = new Date(d); dDay.setHours(0, 0, 0, 0);
  if (dDay.getTime() === today.getTime()) return "HOY";
  if (dDay.getTime() === yest.getTime())  return "AYER";
  return d.toLocaleDateString("es-ES", {day: "numeric", month: "short", year: "numeric"});
}

function groupByDate(items: NotifModel[]): {key: string; items: NotifModel[]}[] {
  const map = new Map<string, NotifModel[]>();
  for (const n of items) {
    const key = getDateGroupKey(n.timestamp);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  const order = ["HOY", "AYER"];
  const rest  = [...map.keys()].filter(k => !order.includes(k))
    .sort((a, b) => new Date(map.get(b)![0].timestamp).getTime() - new Date(map.get(a)![0].timestamp).getTime());
  return [...order.filter(k => map.has(k)), ...rest].map(k => ({key: k, items: map.get(k)!}));
}

// ── Tab config ────────────────────────────────────────────────────────────────
interface TabConfig {
  id: "all" | NotificationType;
  label: string;
}

const TABS: TabConfig[] = [
  {id: "all",     label: "Todas"},
  {id: "reserva", label: "Reservas"},
  {id: "reseña",  label: "Reseñas"},
  {id: "social",  label: "Social"},
  {id: "mensaje", label: "Mensajes"},
  {id: "sistema", label: "Sistema"},
];

// ── Sliding underline tab bar ─────────────────────────────────────────────────
function FilterTabBar({
  activeTab, onSelect, unreadByType, colors,
}: {
  activeTab: string;
  onSelect: (id: "all" | NotificationType) => void;
  unreadByType: Record<string, number>;
  colors: any;
}) {
  const tabWidths = useRef<Record<string, number>>({});
  const tabOffsets = useRef<Record<string, number>>({});
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback((id: string) => {
    const x = tabOffsets.current[id] ?? 0;
    const w = tabWidths.current[id] ?? 0;
    Animated.parallel([
      Animated.spring(underlineX, {toValue: x, useNativeDriver: false, tension: 280, friction: 28}),
      Animated.spring(underlineW, {toValue: w, useNativeDriver: false, tension: 280, friction: 28}),
    ]).start();
  }, []);

  const handleLayout = useCallback((id: string, x: number, w: number) => {
    tabOffsets.current[id] = x;
    tabWidths.current[id]  = w;
    if (id === activeTab) {
      underlineX.setValue(x);
      underlineW.setValue(w);
    }
  }, [activeTab]);

  return (
    <View style={[tb.wrapper, {borderBottomColor: colors.border}]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tb.row}>
        {TABS.map(tab => {
          const isActive  = activeTab === tab.id;
          const unread    = unreadByType[tab.id] ?? 0;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onLayout={e => handleLayout(tab.id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
              onPress={() => { onSelect(tab.id as any); animateTo(tab.id); }}
              style={tb.tab}>
              <Text style={[
                tb.label,
                {color: isActive ? colors.foreground : colors.mutedForeground},
                isActive && tb.labelActive,
              ]}>
                {tab.label}
              </Text>
              {unread > 0 && (
                <View style={[tb.badge, {backgroundColor: isActive ? colors.primary : colors.mutedForeground + "60"}]}>
                  <Text style={tb.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Sliding underline — lives inside the ScrollView so it tracks tab positions */}
        <Animated.View
          style={[tb.underline, {backgroundColor: colors.primary, left: underlineX, width: underlineW}]}
          pointerEvents="none"
        />
      </ScrollView>
    </View>
  );
}

const tb = StyleSheet.create({
  wrapper: {borderBottomWidth: StyleSheet.hairlineWidth},
  row:     {flexDirection: "row", paddingHorizontal: 8, alignItems: "center"},
  tab:     {paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 5},
  label:   {fontSize: 14, fontWeight: "500"},
  labelActive: {fontWeight: "700"},
  badge:   {minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: "center", justifyContent: "center"},
  badgeText: {fontSize: 9, fontWeight: "800", color: "#fff"},
  underline: {position: "absolute", bottom: 0, height: 2, borderRadius: 1},
});

const EMPTY_MSG: Record<string, {title: string; body: string}> = {
  all:     {title: "Todo en orden",     body: "Cuando recibas notificaciones aparecerán aquí"},
  reserva: {title: "Sin novedades",     body: "Las actualizaciones de tus reservas aparecerán aquí"},
  reseña:  {title: "Sin reseñas",       body: "Las reseñas que recibas aparecerán aquí"},
  social:  {title: "Sin actividad",     body: "Los me gusta, comentarios y menciones aparecerán aquí"},
  mensaje: {title: "Sin mensajes",      body: "Tus mensajes aparecerán aquí"},
  sistema: {title: "Sin alertas",       body: "Las alertas y avisos del sistema aparecerán aquí"},
};

export default function Notificaciones() {
  const {colors} = useThemeVariant();
  const router   = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | NotificationType>("all");

  const {
    notifications, isLoading, error, stats,
    markAsRead, markAllAsRead, deleteNotification, refreshNotifications,
  } = useNotifications();

  const {confirmReservation, rejectReservation, refreshReservations} = useIncomingReservations();

  // ── Unread counts per type (from local state for accuracy) ────────────────
  const unreadByType = useMemo(() => {
    const counts: Record<string, number> = {all: 0};
    for (const n of notifications) {
      if (n.status !== "unread") continue;
      counts.all = (counts.all || 0) + 1;
      counts[n.type] = (counts[n.type] || 0) + 1;
    }
    return counts;
  }, [notifications]);

  const totalUnread = unreadByType.all ?? 0;

  // ── Filtered + grouped list ───────────────────────────────────────────────
  const filtered = useMemo(
    () => activeTab === "all" ? notifications : notifications.filter(n => n.type === activeTab),
    [notifications, activeTab]
  );
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  // ── Navigation / action handlers ──────────────────────────────────────────
  const handlePress = (n: NotifModel) => {
    if (n.status === "unread") markAsRead(n.id);
    const rid = n.metadata?.reservation_id ?? n.metadata?.reservationId ?? n.relatedId;
    if (Number.isFinite(rid) && Number(rid) > 0) {
      router.push(`/reservation/${Number(rid)}` as any);
    }
  };

  const handleInviteAction = async (n: NotifModel, action: "accept" | "reject", linkId: number) => {
    try {
      if (!Number.isFinite(linkId)) { Alert.alert("Invitación inválida", "No pudimos identificar esta invitación."); return; }
      if (action === "accept") {
        await linkApi.acceptInvite(linkId);
        Alert.alert("Invitación aceptada", "Ahora estás vinculado con el establecimiento.");
      } else {
        await linkApi.rejectInvite(linkId);
        Alert.alert("Invitación rechazada", "Has rechazado la invitación.");
      }
      await markAsRead(n.id);
      n.metadata = {...n.metadata, status: action === "accept" ? "ACCEPTED" : "REJECTED"};
      await refreshNotifications();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo procesar la invitación.");
    }
  };

  const handleReservationAction = async (reservationId: number, action: "confirm" | "reject") => {
    try {
      if (action === "confirm") {
        await confirmReservation(reservationId);
      } else {
        Alert.alert("Rechazar Reserva", "¿Seguro que deseas rechazar esta solicitud?", [
          {text: "Cancelar", style: "cancel"},
          {text: "Rechazar", style: "destructive", onPress: async () => {
            try { await rejectReservation(reservationId); await refreshNotifications(); await refreshReservations(); }
            catch { /* handled in hook */ }
          }},
        ]);
        return;
      }
      await refreshNotifications();
      await refreshReservations();
    } catch { /* handled in hooks */ }
  };

  const handleTrackingAction = async (n: NotifModel, trackingId: number, action: "accept" | "reject") => {
    try {
      if (action === "accept") {
        await trackingApi.accept(trackingId);
        Alert.alert("Tracking activo", "Has aceptado compartir tu ubicación.");
      } else {
        await trackingApi.reject(trackingId);
      }
      await markAsRead(n.id);
      n.metadata = {...n.metadata, status: action === "accept" ? "ACCEPTED" : "REJECTED", action_required: false};
      await refreshNotifications();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo actualizar el tracking.");
    }
  };

  const isProfessional  = user?.role === "PROFESSIONAL";
  const isProviderRole  = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <View style={[s.flex, {backgroundColor: colors.background}]}>
        <AppHeader title="Notificaciones" showBackButton={false} />
        <View style={s.center}>
          <View style={[s.emptyIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="notifications-outline" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[s.emptyTitle, {color: colors.foreground}]}>Inicia sesión para continuar</Text>
          <Text style={[s.emptyBody, {color: colors.mutedForeground}]}>
            Recibe actualizaciones sobre tus reservas, reseñas y más
          </Text>
          <TouchableOpacity style={[s.cta, {backgroundColor: colors.primary}]} onPress={() => router.push("/login")} activeOpacity={0.85}>
            <Text style={[s.ctaText, {color: colors.primaryForeground}]}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading && notifications.length === 0) {
    return (
      <View style={[s.flex, {backgroundColor: colors.background}]}>
        <AppHeader title="Notificaciones" showBackButton={false} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.hint, {color: colors.mutedForeground}]}>Cargando notificaciones…</Text>
        </View>
      </View>
    );
  }

  const emptyMsg = EMPTY_MSG[activeTab] ?? EMPTY_MSG.all;

  return (
    <View style={[s.flex, {backgroundColor: colors.background}]}>
      <AppHeader title="Notificaciones" showBackButton={false} />

      {/* ── Header actions ─────────────────────────────────────────────────── */}
      {totalUnread > 0 && (
        <View style={[s.actionBar, {borderBottomColor: colors.border}]}>
          <Text style={[s.actionBarHint, {color: colors.mutedForeground}]}>
            {totalUnread} sin leer
          </Text>
          <Pressable onPress={markAllAsRead} style={({pressed}) => [s.markAllBtn, pressed && {opacity: 0.7}]}>
            <Ionicons name="checkmark-done-outline" size={15} color={colors.primary} />
            <Text style={[s.markAllText, {color: colors.primary}]}>Marcar todo como leído</Text>
          </Pressable>
        </View>
      )}

      {/* ── Filter tabs ───────────────────────────────────────────────────── */}
      <FilterTabBar
        activeTab={activeTab}
        onSelect={setActiveTab}
        unreadByType={unreadByType}
        colors={colors}
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {error ? (
        <View style={s.center}>
          <View style={[s.emptyIcon, {backgroundColor: "#ef4444" + "14"}]}>
            <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
          </View>
          <Text style={[s.emptyTitle, {color: colors.foreground}]}>Error al cargar</Text>
          <Text style={[s.emptyBody, {color: colors.mutedForeground}]}>{error}</Text>
          <TouchableOpacity style={[s.cta, {backgroundColor: colors.primary}]} onPress={refreshNotifications} activeOpacity={0.85}>
            <Text style={[s.ctaText, {color: colors.primaryForeground}]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyIcon, {backgroundColor: colors.muted}]}>
            <Ionicons name="notifications-outline" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[s.emptyTitle, {color: colors.foreground}]}>{emptyMsg.title}</Text>
          <Text style={[s.emptyBody, {color: colors.mutedForeground}]}>{emptyMsg.body}</Text>
        </View>
      ) : (
        <ScrollView style={s.flex} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {grouped.map(({key, items}) => (
            <View key={key} style={s.group}>
              <Text style={[s.groupLabel, {color: colors.mutedForeground}]}>{key}</Text>
              <View style={[s.groupCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                {items.map((n, idx) => {
                  const linkId         = n.metadata?.link_id ?? n.metadata?.linkId ?? n.metadata?.linkID;
                  const reservationId  = n.metadata?.reservation_id || n.relatedId;
                  const trackingId     = n.metadata?.tracking_request_id;

                  const canInvite      = isProfessional && n.type === "sistema" && n.metadata?.status === "INVITED" && n.status === "unread" && linkId;
                  const canReserve     = n.type === "reserva" && n.metadata?.status === "PENDING" && n.metadata?.action_required === true && reservationId && isProviderRole;
                  const canTrack       = n.type === "sistema" && trackingId && n.metadata?.status === "PENDING" && n.metadata?.action_required === true;

                  const isLast = idx === items.length - 1;

                  return (
                    <View key={n.id}>
                      <NotificationCard
                        notification={n}
                        onPress={handlePress}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        onAcceptInvite={canInvite ? (notif) => handleInviteAction(notif, "accept", Number.parseInt(String(linkId), 10)) : undefined}
                        onDeclineInvite={canInvite ? (notif) => handleInviteAction(notif, "reject", Number.parseInt(String(linkId), 10)) : undefined}
                        onConfirmReservation={canReserve ? (id) => handleReservationAction(id, "confirm") : undefined}
                        onRejectReservation={canReserve ? (id) => handleReservationAction(id, "reject") : undefined}
                        onAcceptTracking={canTrack ? () => handleTrackingAction(n, Number.parseInt(String(trackingId), 10), "accept") : undefined}
                        onRejectTracking={canTrack ? () => handleTrackingAction(n, Number.parseInt(String(trackingId), 10), "reject") : undefined}
                      />
                      {!isLast && <View style={[s.divider, {backgroundColor: colors.border}]} />}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{height: 32}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex: {flex: 1},
  center: {flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16},

  emptyIcon: {width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center"},
  emptyTitle:{fontSize: 18, fontWeight: "700", textAlign: "center"},
  emptyBody: {fontSize: 14, textAlign: "center", lineHeight: 20},
  hint:      {fontSize: 14, marginTop: 6},

  cta:     {paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12, marginTop: 4},
  ctaText: {fontSize: 15, fontWeight: "700"},

  // Action bar
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBarHint: {fontSize: 12, fontWeight: "500"},
  markAllBtn:   {flexDirection: "row", alignItems: "center", gap: 5},
  markAllText:  {fontSize: 13, fontWeight: "600"},

  // List
  list:  {padding: 16, gap: 20},
  group: {gap: 10},
  groupLabel: {fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", paddingHorizontal: 4},
  groupCard: {
    borderRadius: 18, borderWidth: 1, overflow: "hidden",
  },
  divider: {height: StyleSheet.hairlineWidth, marginHorizontal: 16},
});
