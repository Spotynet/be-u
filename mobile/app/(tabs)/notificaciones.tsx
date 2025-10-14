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
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {useRouter} from "expo-router";
import {NotificationCard} from "@/components/notifications";
import {useNotifications, NotificationType} from "@/features/notifications";
import {useAuth} from "@/features/auth";

export default function Notificaciones() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();

  const [activeFilter, setActiveFilter] = useState<"all" | NotificationType>("all");

  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const handleNotificationPress = (notification: any) => {
    // Mark as read if unread
    if (notification.status === "unread") {
      markAsRead(notification.id);
    }

    // TODO: Navigate to relevant screen based on notification type
    switch (notification.type) {
      case "reservation":
        // Navigate to reservation details or profile reservations tab
        router.push("/(tabs)/perfil");
        break;
      case "review":
        // Navigate to review details or service page
        break;
      case "message":
        // Navigate to messages or chat
        break;
      case "system":
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

  const filteredNotifications =
    activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter);

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
        <View style={styles.filterTabs}>
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
              activeFilter === "reservation" && [
                styles.filterTabActive,
                {backgroundColor: "#ffffff20"},
              ],
            ]}
            onPress={() => setActiveFilter("reservation")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "reservation" ? "#ffffff" : "#ffffff80"},
              ]}>
              Reservas
            </Text>
            {activeFilter === "reservation" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: "#ffffff"}]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "review" && [styles.filterTabActive, {backgroundColor: "#ffffff20"}],
            ]}
            onPress={() => setActiveFilter("review")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "review" ? "#ffffff" : "#ffffff80"},
              ]}>
              Reseñas
            </Text>
            {activeFilter === "review" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: "#ffffff"}]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === "system" && [styles.filterTabActive, {backgroundColor: "#ffffff20"}],
            ]}
            onPress={() => setActiveFilter("system")}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === "system" ? "#ffffff" : "#ffffff80"},
              ]}>
              Sistema
            </Text>
            {activeFilter === "system" && (
              <View style={[styles.filterTabIndicator, {backgroundColor: "#ffffff"}]} />
            )}
          </TouchableOpacity>
        </View>
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
              ? "Cuando recibas notificaciones aparecerán aquí"
              : `No tienes notificaciones de ${activeFilter} por ahora`}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
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
  header: {
    paddingTop: 60,
    paddingBottom: 16,
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
});

