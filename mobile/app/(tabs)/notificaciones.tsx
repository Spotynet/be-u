import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {useRouter} from "expo-router";
import {NotificationCard} from "@/components/notifications";
import {useNotifications, NotificationType, Notification as NotificationTypeModel} from "@/features/notifications";
import {useAuth} from "@/features/auth";
import {linkApi} from "@/lib/api";
import {useIncomingReservations} from "@/features/reservations";

export default function Notificaciones() {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [activeFilter, setActiveFilter] = useState<"all" | NotificationType>("all");

  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    stats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkAction,
    refreshNotifications,
  } = useNotifications();

  // For providers: handle reservation confirm/reject
  const {confirmReservation, rejectReservation, refreshReservations} = useIncomingReservations();

  const handleNotificationPress = (notification: any) => {
    // Mark as read if unread
    if (notification.status === "unread") {
      markAsRead(notification.id);
    }

    // TODO: Navigate to relevant screen based on notification type
    switch (notification.type) {
      case "reserva":
        // Navigate to reservation details or profile reservations tab
        router.push("/(tabs)/perfil");
        break;
      case "reseña":
        // Navigate to review details or service page
        break;
      case "mensaje":
        // Navigate to messages or chat
        break;
      case "sistema":
        // Show system message details or do nothing
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    Alert.alert(
      "Marcar todo como leído",
      "¿Estás seguro de que quieres marcar todas las notificaciones como leídas?",
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Marcar todo",
          onPress: markAllAsRead,
        },
      ]
    );
  };

  const isProfessional = user?.role === "PROFESSIONAL";

  const filteredNotifications =
    activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter);

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
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
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
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state
  if (isLoading && notifications.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
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
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.7}>
              <Text style={styles.markAllText}>Marcar todo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
          style={styles.filterTabsScroll}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "all" && [styles.filterTabActive, {backgroundColor: "#ffffff20"}],
            ]}
            onPress={() => setActiveFilter("all")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "all" ? "#ffffff" : "#ffffff80"},
              ]}>
              Todas
            </Text>
            {activeFilter === "all" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: "#ffffff"}]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "reserva" && [
                styles.filterTabActive,
                {backgroundColor: "#ffffff20"},
              ],
            ]}
            onPress={() => setActiveFilter("reserva")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "reserva" ? "#ffffff" : "#ffffff80"},
              ]}>
              Reservas
            </Text>
            {activeFilter === "reserva" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: "#ffffff"}]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "reseña" && [styles.filterTabActive, {backgroundColor: "#ffffff20"}],
            ]}
            onPress={() => setActiveFilter("reseña")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "reseña" ? "#ffffff" : "#ffffff80"},
              ]}>
              Reseñas
            </Text>
            {activeFilter === "reseña" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: "#ffffff"}]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "sistema" && [
                styles.filterTabActive,
                {backgroundColor: "#ffffff20"},
              ],
            ]}
            onPress={() => setActiveFilter("sistema")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "sistema" ? "#ffffff" : "#ffffff80"},
              ]}>
              Sistema
            </Text>
            {activeFilter === "sistema" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: "#ffffff"}]} />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Error al cargar notificaciones
          </Text>
          <Text style={[styles.emptySubtitle, {color: colors.mutedForeground}]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={refreshNotifications}
            activeOpacity={0.9}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
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
            {filteredNotifications.map((notification) => {
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

              // Check if this is a pending reservation notification
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff20",
    borderRadius: 8,
  },
  markAllText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
    color: "#ffffff",
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
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  notificationsList: {
    paddingTop: 16,
  },
  statsText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
