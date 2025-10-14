import {useState, useEffect} from "react";
import {Alert} from "react-native";
import {Notification, NotificationFilters} from "../types";

// TODO: Replace with actual API integration
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "reservation",
    title: "Reserva Confirmada",
    message:
      'Tu reserva para "Corte y Peinado" con María González ha sido confirmada para el 15 de octubre a las 2:00 PM',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    status: "unread",
    relatedId: 123,
    metadata: {
      reservationCode: "RES-001",
      serviceName: "Corte y Peinado",
      providerName: "María González",
    },
  },
  {
    id: 2,
    type: "review",
    title: "Nueva Reseña",
    message: 'Juan Pérez ha dejado una reseña de 5 estrellas para tu servicio "Masaje Relajante"',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: "read",
    relatedId: 456,
    metadata: {
      serviceName: "Masaje Relajante",
      rating: 5,
    },
  },
  {
    id: 3,
    type: "system",
    title: "Mantenimiento Programado",
    message:
      "La aplicación estará en mantenimiento el domingo de 2:00 AM a 4:00 AM. Gracias por tu comprensión.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: "read",
  },
  {
    id: 4,
    type: "reservation",
    title: "Recordatorio de Cita",
    message: 'Tienes una cita mañana a las 10:00 AM para "Manicure Francesa" con Beauty Studio',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    status: "unread",
    relatedId: 789,
    metadata: {
      reservationCode: "RES-002",
      serviceName: "Manicure Francesa",
      providerName: "Beauty Studio",
    },
  },
  {
    id: 5,
    type: "message",
    title: "Mensaje de tu Estilista",
    message: "Hola! ¿Podrías llegar 15 minutos antes para tu cita? Gracias!",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    status: "unread",
    relatedId: 101,
    metadata: {
      providerName: "Carlos Estilista",
    },
  },
];

export const useNotifications = (filters?: NotificationFilters) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual API call
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let filteredNotifications = [...MOCK_NOTIFICATIONS];

      // Apply filters
      if (filters?.type) {
        filteredNotifications = filteredNotifications.filter((n) => n.type === filters.type);
      }

      if (filters?.status) {
        filteredNotifications = filteredNotifications.filter((n) => n.status === filters.status);
      }

      // Sort by timestamp (newest first)
      filteredNotifications.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(filteredNotifications);
    } catch (err) {
      setError("Error al cargar las notificaciones");
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Replace with actual API call
  const markAsRead = async (notificationId: number) => {
    try {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {...notification, status: "read" as NotificationStatus}
            : notification
        )
      );

      // TODO: Call API to mark as read
      // await notificationApi.markAsRead(notificationId);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      Alert.alert("Error", "No se pudo marcar la notificación como leída");
    }
  };

  // TODO: Replace with actual API call
  const markAllAsRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((notification) => ({...notification, status: "read" as NotificationStatus}))
      );

      // TODO: Call API to mark all as read
      // await notificationApi.markAllAsRead();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      Alert.alert("Error", "No se pudieron marcar todas las notificaciones como leídas");
    }
  };

  // TODO: Replace with actual API call
  const deleteNotification = async (notificationId: number) => {
    try {
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));

      // TODO: Call API to delete notification
      // await notificationApi.deleteNotification(notificationId);
    } catch (err) {
      console.error("Error deleting notification:", err);
      Alert.alert("Error", "No se pudo eliminar la notificación");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
};

