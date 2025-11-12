import React from "react";
import {View, Text, TouchableOpacity, StyleSheet, Alert} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Notification} from "@/features/notifications";

interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: number) => void;
  onDelete?: (notificationId: number) => void;
  onAcceptInvite?: (notification: Notification, linkId: number) => void;
  onDeclineInvite?: (notification: Notification, linkId: number) => void;
}

export const NotificationCard = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  onAcceptInvite,
  onDeclineInvite,
}: NotificationCardProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const getIcon = () => {
    switch (notification.type) {
      case "reservation":
        return "calendar";
      case "review":
        return "star";
      case "system":
        return "cog";
      case "message":
        return "chatbubble";
      default:
        return "notifications";
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case "reservation":
        return "#3b82f6"; // blue
      case "review":
        return "#f59e0b"; // amber
      case "system":
        return "#8b5cf6"; // purple default
      case "message":
        return "#10b981"; // emerald
      default:
        return colors.primary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return "Ahora";
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Hace ${days}d`;
    }
  };

  const handlePress = () => {
    if (notification.status === "unread" && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    onPress?.(notification);
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Notificación",
      "¿Estás seguro de que quieres eliminar esta notificación?",
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onDelete?.(notification.id),
        },
      ]
    );
  };

  const linkId =
    notification.metadata?.link_id ??
    notification.metadata?.linkId ??
    notification.metadata?.linkID;
  const inviteStatus = notification.metadata?.status;
  const canRespondInvite =
    notification.type === "sistema" &&
    linkId &&
    inviteStatus === "INVITED" &&
    (typeof onAcceptInvite === "function" || typeof onDeclineInvite === "function");

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderLeftColor: notification.status === "unread" ? colors.primary : "transparent",
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}>
      {/* Header with icon and timestamp */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, {backgroundColor: getIconColor() + "20"}]}>
            <Ionicons name={getIcon()} color={getIconColor()} size={20} />
          </View>
          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.foreground,
                  fontWeight: notification.status === "unread" ? "700" : "600",
                },
              ]}
              numberOfLines={2}>
              {notification.title}
            </Text>
            <Text style={[styles.timestamp, {color: colors.mutedForeground}]}>
              {formatTimestamp(notification.timestamp)}
            </Text>
          </View>
        </View>

        {/* Unread indicator and actions */}
        <View style={styles.actions}>
          {notification.status === "unread" && (
            <View style={[styles.unreadDot, {backgroundColor: colors.primary}]} />
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="close" color={colors.mutedForeground} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message */}
      <Text
        style={[
          styles.message,
          {
            color: colors.foreground,
            opacity: notification.status === "unread" ? 1 : 0.8,
          },
        ]}
        numberOfLines={3}>
        {notification.message}
      </Text>

      {/* Metadata (if available) */}
      {notification.metadata && (
        <View style={styles.metadata}>
          {notification.metadata.reservationCode && (
            <View style={[styles.metadataChip, {backgroundColor: colors.background}]}>
              <Text style={[styles.metadataText, {color: colors.mutedForeground}]}>
                {notification.metadata.reservationCode}
              </Text>
            </View>
          )}
          {notification.metadata.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" color="#f59e0b" size={14} />
              <Text style={[styles.ratingText, {color: colors.mutedForeground}]}>
                {notification.metadata.rating}/5
              </Text>
            </View>
          )}
        </View>
      )}

      {canRespondInvite && (
        <View style={styles.inviteActions}>
          {typeof onDeclineInvite === "function" && (
            <TouchableOpacity
              style={[
                styles.inviteButton,
                {
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => onDeclineInvite(notification, linkId)}>
              <Text style={[styles.inviteButtonText, {color: colors.mutedForeground}]}>
                Rechazar
              </Text>
            </TouchableOpacity>
          )}
          {typeof onAcceptInvite === "function" && (
            <TouchableOpacity
              style={[
                styles.inviteButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => onAcceptInvite(notification, linkId)}>
              <Text style={[styles.inviteButtonText, {color: colors.primaryForeground}]}>
                Aceptar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  metadataChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metadataText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inviteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  inviteButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  inviteButtonText: {
    fontWeight: "700",
  },
});
