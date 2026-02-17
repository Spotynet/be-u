import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useMemo} from "react";
import {useRouter} from "expo-router";
import {NotificationCard} from "@/components/notifications";
import {useNotifications, NotificationType, Notification as NotificationTypeModel} from "@/features/notifications";
import {useAuth} from "@/features/auth";
import {linkApi} from "@/lib/api";
import {useIncomingReservations} from "@/features/reservations";
import {AppHeader} from "@/components/ui/AppHeader";

function getDateGroupKey(timestamp: string): string {
  const d = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);
  if (dDay.getTime() === today.getTime()) return "HOY";
  if (dDay.getTime() === yesterday.getTime()) return "AYER";
  return d.toLocaleDateString("es-ES", {day: "numeric", month: "short", year: "numeric"});
}

function groupByDate(notifications: NotificationTypeModel[]): { key: string; items: NotificationTypeModel[] }[] {
  const map = new Map<string, NotificationTypeModel[]>();
  for (const n of notifications) {
    const key = getDateGroupKey(n.timestamp);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  const order = ["HOY", "AYER"];
  const rest = [...map.keys()].filter((k) => !order.includes(k));
  rest.sort((a, b) => {
    const dA = map.get(a)?.[0]?.timestamp ?? "";
    const dB = map.get(b)?.[0]?.timestamp ?? "";
    return new Date(dB).getTime() - new Date(dA).getTime();
  });
  const keys = [...order.filter((k) => map.has(k)), ...rest];
  return keys.map((key) => ({key, items: map.get(key)!}));
}

export default function Notificaciones() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [activeFilter, setActiveFilter] = useState<"all" | NotificationType>("all");

  const {
    notifications,
    isLoading,
    error,
    stats,
    markAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  // For providers: handle reservation confirm/reject
  const {confirmReservation, rejectReservation, refreshReservations} = useIncomingReservations();

  const handleNotificationPress = (notification: any) => {
    // Mark as read if unread
    if (notification.status === "unread") {
      markAsRead(notification.id);
    }

    // Cualquier notificación con reservation_id enlaza a los detalles de esa reserva
    const reservationId =
      notification.metadata?.reservation_id ??
      notification.metadata?.reservationId ??
      notification.relatedId;

    if (Number.isFinite(reservationId) && Number(reservationId) > 0) {
      router.push(`/reservation/${Number(reservationId)}` as any);
      return;
    }

    // Notificaciones sin reserva: reseñas, mensajes, sistema genérico
    switch (notification.type) {
      case "reseña":
        break;
      case "mensaje":
        break;
      default:
        break;
    }
  };

  const isProfessional = user?.role === "PROFESSIONAL";

  const filteredNotifications =
    activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter);

  const groupedByDate = useMemo(
    () => groupByDate(filteredNotifications),
    [filteredNotifications]
  );

  const handleInviteAction = async (
    notification: NotificationTypeModel,
    action: "accept" | "reject",
    linkId: number
  ) => {
    try {
      if (!Number.isFinite(linkId)) {
        Alert.alert("Invitación inválida", "No pudimos identificar esta invitación.");
        return;
      }

      if (action === "accept") {
        await linkApi.acceptInvite(linkId);
        Alert.alert("Invitación aceptada", "Ahora estás vinculado con el establecimiento.");
      } else {
        await linkApi.rejectInvite(linkId);
        Alert.alert("Invitación rechazada", "Has rechazado la invitación.");
      }

      await markAsRead(notification.id);

      // Optimistically update local metadata so buttons disappear immediately
      notification.metadata = {
        ...notification.metadata,
        status: action === "accept" ? "ACCEPTED" : "REJECTED",
      };

      await refreshNotifications();
    } catch (err: any) {
      console.error("Error handling invite action:", err);
      Alert.alert(
        "Error",
        err?.message || "No se pudo procesar la invitación. Inténtalo de nuevo más tarde."
      );
    }
  };

  const handleReservationAction = async (
    reservationId: number,
    action: "confirm" | "reject"
  ) => {
    try {
      if (action === "confirm") {
        await confirmReservation(reservationId);
      } else {
        // For reject, we'll just call rejectReservation without reason
        // The user can add a reason later if needed
        Alert.alert(
          "Rechazar Reserva",
          "¿Estás seguro de que deseas rechazar esta solicitud de reserva?",
          [
            {text: "Cancelar", style: "cancel"},
            {
              text: "Rechazar",
              style: "destructive",
              onPress: async () => {
                try {
                  await rejectReservation(reservationId);
                  await refreshNotifications();
                  await refreshReservations();
                } catch (err) {
                  // Error already handled in hook
                }
              },
            },
          ]
        );
        return; // Don't refresh yet, wait for alert
      }

      // Refresh notifications and reservations
      await refreshNotifications();
      await refreshReservations();
    } catch (err: any) {
      console.error("Error handling reservation action:", err);
      // Error already handled in hooks
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppHeader
          title="Notificaciones"
          showBackButton={true}
          onBackPress={() => router.back()}
          backgroundColor={colors.background}
          borderBottom={colors.border}
        />
        <View style={styles.centeredContainer}>
          <Ionicons name="notifications-outline" size={80} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Inicia sesión para ver tus notificaciones
          </Text>
          <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>
            Recibe actualizaciones sobre tus reservas, reseñas y más
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, {backgroundColor: colors.primary}]}
            onPress={() => router.push("/login")}
            activeOpacity={0.9}>
            <Text style={[styles.loginButtonText, {color: colors.primaryForeground}]}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state
  if (isLoading && notifications.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppHeader
          title="Notificaciones"
          showBackButton={true}
          onBackPress={handleBack}
          backgroundColor={colors.background}
          borderBottom={colors.border}
        />
        <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando notificaciones...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Notificaciones"
        showBackButton={true}
        onBackPress={handleBack}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      {/* Filter Tabs */}
      <View style={[styles.filterTabsWrapper, {borderBottomColor: colors.border}]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
          style={styles.filterTabsScroll}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "all" && [styles.filterTabActive, {backgroundColor: colors.primary + "20"}],
            ]}
            onPress={() => setActiveFilter("all")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "all" ? colors.primary : colors.mutedForeground},
              ]}>
              Todas
            </Text>
            {activeFilter === "all" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: colors.primary}]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "reserva" && [styles.filterTabActive, {backgroundColor: colors.primary + "20"}],
            ]}
            onPress={() => setActiveFilter("reserva")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "reserva" ? colors.primary : colors.mutedForeground},
              ]}>
              Reservas
            </Text>
            {activeFilter === "reserva" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: colors.primary}]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "reseña" && [styles.filterTabActive, {backgroundColor: colors.primary + "20"}],
            ]}
            onPress={() => setActiveFilter("reseña")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "reseña" ? colors.primary : colors.mutedForeground},
              ]}>
              Reseñas
            </Text>
            {activeFilter === "reseña" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: colors.primary}]} />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.destructive} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Error al cargar notificaciones
          </Text>
          <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={refreshNotifications}
            activeOpacity={0.9}>
            <Text style={[styles.retryButtonText, {color: colors.primaryForeground}]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="notifications-outline" size={80} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            {activeFilter === "all"
              ? "No hay notificaciones"
              : `No hay notificaciones de ${activeFilter}`}
          </Text>
          <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>
            {activeFilter === "all"
              ? "Cuando recibas notificaciones aparecerán aquí. Las notificaciones te mantendrán informado sobre tus reservas, reseñas y mensajes importantes."
              : `No tienes notificaciones de ${activeFilter} por ahora`}
          </Text>
          {stats && stats.total_count > 0 && (
            <Text style={[styles.statsText, {color: colors.mutedForeground}]}>
              Tienes {stats.total_count} notificaciones en total
            </Text>
          )}
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.notificationsList}>
            {groupedByDate.map(({key, items}) => (
              <View key={key} style={styles.section}>
                <Text style={[styles.sectionHeader, {color: colors.mutedForeground}]}>{key}</Text>
                {items.map((notification) => {
                  const linkId =
                    notification.metadata?.link_id ??
                    notification.metadata?.linkId ??
                    notification.metadata?.linkID;
                  const canRespondInvite =
                    isProfessional &&
                    notification.type === "sistema" &&
                    notification.metadata?.status === "INVITED" &&
                    notification.status === "unread" &&
                    linkId;

                  const reservationId = notification.metadata?.reservation_id || notification.relatedId;
                  const isPendingReservation =
                    notification.type === "reserva" &&
                    notification.metadata?.status === "PENDING" &&
                    notification.metadata?.action_required === true &&
                    reservationId &&
                    (user?.role === "PROFESSIONAL" || user?.role === "PLACE");

                  return (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onPress={handleNotificationPress}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      onAcceptInvite={
                        canRespondInvite
                          ? (notif) =>
                              handleInviteAction(
                                notif,
                                "accept",
                                Number.parseInt(String(linkId), 10)
                              )
                          : undefined
                      }
                      onDeclineInvite={
                        canRespondInvite
                          ? (notif) =>
                              handleInviteAction(
                                notif,
                                "reject",
                                Number.parseInt(String(linkId), 10)
                              )
                          : undefined
                      }
                      onConfirmReservation={
                        isPendingReservation
                          ? (id) => handleReservationAction(id, "confirm")
                          : undefined
                      }
                      onRejectReservation={
                        isPendingReservation
                          ? (id) => handleReservationAction(id, "reject")
                          : undefined
                      }
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterTabsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  filterTabs: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  filterTabsScroll: {
    flexGrow: 0,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: "relative",
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterTabIndicator: {
    position: "absolute",
    bottom: -2,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  statsText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
