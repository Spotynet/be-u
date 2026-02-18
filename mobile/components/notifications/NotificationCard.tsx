import React from "react";
import {View, Text, TouchableOpacity, StyleSheet, Alert, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Notification} from "@/features/notifications";

interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: number) => void;
  onDelete?: (notificationId: number) => void;
  onAcceptInvite?: (notification: Notification, linkId: number) => void;
  onDeclineInvite?: (notification: Notification, linkId: number) => void;
  onConfirmReservation?: (reservationId: number) => void;
  onRejectReservation?: (reservationId: number) => void;
  onAcceptTracking?: (trackingRequestId: number) => void;
  onRejectTracking?: (trackingRequestId: number) => void;
}

export const NotificationCard = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  onAcceptInvite,
  onDeclineInvite,
  onConfirmReservation,
  onRejectReservation,
  onAcceptTracking,
  onRejectTracking,
}: NotificationCardProps) => {
  const {colors} = useThemeVariant();

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (notification.type) {
      case "reserva":
        return "calendar";
      case "reseña":
        return "star-outline";
      case "sistema":
        return "sync";
      case "mensaje":
        return "chatbubble-outline";
      default:
        return "notifications-outline";
    }
  };

  const getIconColor = (): string => {
    const isUnread = notification.status === "unread";
    switch (notification.type) {
      case "reserva":
        return isUnread ? colors.primary : colors.mutedForeground;
      case "reseña":
      case "sistema":
      case "mensaje":
      default:
        return colors.mutedForeground;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return "Ayer, " + date.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"});
    return date.toLocaleDateString("es-ES", {day: "numeric", month: "short"}) + ", " + date.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"});
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

  // Check if this is a pending reservation notification that needs action
  const reservationId = notification.metadata?.reservation_id || notification.relatedId;
  const reservationStatus = notification.metadata?.status;
  const actionRequired = notification.metadata?.action_required === true;
  const canRespondReservation =
    notification.type === "reserva" &&
    reservationId &&
    reservationStatus === "PENDING" &&
    actionRequired &&
    (typeof onConfirmReservation === "function" || typeof onRejectReservation === "function");

  const trackingRequestId = notification.metadata?.tracking_request_id;
  const trackingStatus = notification.metadata?.status;
  const canRespondTracking =
    notification.type === "sistema" &&
    trackingRequestId &&
    trackingStatus === "PENDING" &&
    notification.metadata?.action_required === true &&
    (typeof onAcceptTracking === "function" || typeof onRejectTracking === "function");

  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: "transparent"}]}
      onPress={handlePress}
      activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.iconBlock}>
          <View style={[styles.iconWrapper, {backgroundColor: getIconColor() + "18"}]}>
            <Ionicons name={getIcon()} color={getIconColor()} size={22} />
          </View>
          {notification.status === "unread" && (
            <View style={[styles.unreadDot, {backgroundColor: colors.primary}]} />
          )}
        </View>
        <View style={styles.body}>
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
          <Text
            style={[styles.message, {color: colors.mutedForeground}]}
            numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={[styles.timestamp, {color: colors.mutedForeground}]}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>
      </View>

      {/* Metadata & actions (if available) */}
      {notification.metadata && (
        <View style={[styles.metadata, {marginLeft: 58}]}>
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
        <View style={[styles.inviteActions, {marginLeft: 58}]}>
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

      {/* Reservation action buttons */}
      {canRespondReservation && (
        <View style={[styles.inviteActions, {marginLeft: 58}]}>
          {typeof onRejectReservation === "function" && (
            <TouchableOpacity
              style={[
                styles.inviteButton,
                {
                  borderWidth: 1,
                  borderColor: colors.destructive,
                },
              ]}
              onPress={() => {
                // On web, Alert buttons can be blocked; call directly there
                if (Platform.OS === "web") {
                  onRejectReservation(reservationId);
                  return;
                }
                Alert.alert(
                  "Rechazar Reserva",
                  "¿Estás seguro de que deseas rechazar esta solicitud de reserva?",
                  [
                    {text: "Cancelar", style: "cancel"},
                    {
                      text: "Rechazar",
                      style: "destructive",
                      onPress: () => onRejectReservation(reservationId),
                    },
                  ]
                );
              }}>
              <Ionicons name="close-circle" size={16} color={colors.destructive} />
              <Text style={[styles.inviteButtonText, {color: colors.destructive, marginLeft: 4}]}>
                Rechazar
              </Text>
            </TouchableOpacity>
          )}
          {typeof onConfirmReservation === "function" && (
            <TouchableOpacity
              style={[
                styles.inviteButton,
                {
                  backgroundColor: colors.success,
                },
              ]}
              onPress={() => {
                // On web, Alert buttons can be blocked; call directly there
                if (Platform.OS === "web") {
                  onConfirmReservation(reservationId);
                  return;
                }
                Alert.alert(
                  "Confirmar Reserva",
                  "¿Confirmar esta solicitud de reserva?",
                  [
                    {text: "Cancelar", style: "cancel"},
                    {
                      text: "Confirmar",
                      onPress: () => onConfirmReservation(reservationId),
                    },
                  ]
                );
              }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primaryForeground} />
              <Text style={[styles.inviteButtonText, {color: colors.primaryForeground, marginLeft: 4}]}>
                Confirmar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {canRespondTracking && (
        <View style={[styles.inviteActions, {marginLeft: 58}]}>
          {typeof onRejectTracking === "function" && (
            <TouchableOpacity
              style={[
                styles.inviteButton,
                {
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => onRejectTracking(trackingRequestId)}>
              <Text style={[styles.inviteButtonText, {color: colors.mutedForeground}]}>
                Rechazar
              </Text>
            </TouchableOpacity>
          )}
          {typeof onAcceptTracking === "function" && (
            <TouchableOpacity
              style={[
                styles.inviteButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => onAcceptTracking(trackingRequestId)}>
              <Text style={[styles.inviteButtonText, {color: colors.primaryForeground}]}>
                Compartir ubicación
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
    marginBottom: 20,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconBlock: {
    position: "relative",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
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
