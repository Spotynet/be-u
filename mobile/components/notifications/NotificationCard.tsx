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

// ── Icon & color per notification type ───────────────────────────────────────
function getTypeVisual(notification: Notification): {icon: keyof typeof Ionicons.glyphMap; color: string} {
  const sub = notification.metadata?.sub_type;
  switch (notification.type) {
    case "reserva":
      return {icon: "calendar", color: "#3b82f6"};
    case "reseña":
      return {icon: "star", color: "#f59e0b"};
    case "mensaje":
      return {icon: "chatbubble", color: "#8b5cf6"};
    case "social":
      if (sub === "like"    || sub === "saved")   return {icon: "heart",       color: "#ec4899"};
      if (sub === "comment" || sub === "mention") return {icon: "chatbubble",  color: "#8b5cf6"};
      if (sub === "follow")                       return {icon: "person-add",  color: "#10b981"};
      return {icon: "people", color: "#ec4899"};
    case "sistema":
      // Tracking requests
      if (notification.metadata?.tracking_request_id) return {icon: "navigate",         color: "#10b981"};
      // Invite / link
      if (notification.metadata?.link_id || notification.metadata?.linkId) return {icon: "link", color: "#3b82f6"};
      return {icon: "information-circle", color: "#6b7280"};
    default:
      return {icon: "notifications", color: "#6b7280"};
  }
}

function formatTimestamp(timestamp: string): string {
  const d     = new Date(timestamp);
  const now   = new Date();
  const diffMs   = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs  = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins  < 1)  return "Ahora";
  if (diffMins  < 60) return `${diffMins} min`;
  if (diffHrs   < 24) return `${diffHrs} h`;
  if (diffDays  === 1) return "Ayer";
  return d.toLocaleDateString("es-ES", {day: "numeric", month: "short"});
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

  const {icon, color} = getTypeVisual(notification);
  const isUnread      = notification.status === "unread";

  const linkId        = notification.metadata?.link_id ?? notification.metadata?.linkId ?? notification.metadata?.linkID;
  const reservationId = notification.metadata?.reservation_id || notification.relatedId;
  const trackingId    = notification.metadata?.tracking_request_id;

  const canInvite  = linkId && notification.metadata?.status === "INVITED" && (onAcceptInvite || onDeclineInvite);
  const canReserve = reservationId && notification.metadata?.status === "PENDING" && notification.metadata?.action_required && (onConfirmReservation || onRejectReservation);
  const canTrack   = trackingId && notification.metadata?.status === "PENDING" && notification.metadata?.action_required && (onAcceptTracking || onRejectTracking);

  const handlePress = () => {
    if (isUnread) onMarkAsRead?.(notification.id);
    onPress?.(notification);
  };

  const handleDelete = () => {
    Alert.alert("Eliminar notificación", "¿Eliminar esta notificación?", [
      {text: "Cancelar", style: "cancel"},
      {text: "Eliminar", style: "destructive", onPress: () => onDelete?.(notification.id)},
    ]);
  };

  // Subtle background tint for unread
  const cardBg = isUnread ? colors.primary + "07" : "transparent";

  return (
    <TouchableOpacity
      style={[c.container, {backgroundColor: cardBg}]}
      onPress={handlePress}
      onLongPress={onDelete ? handleDelete : undefined}
      activeOpacity={0.7}>

      {/* Unread bar */}
      {isUnread && <View style={[c.unreadBar, {backgroundColor: colors.primary}]} />}

      <View style={c.inner}>
        {/* Icon */}
        <View style={[c.iconWrap, {backgroundColor: color + "16"}]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>

        {/* Body */}
        <View style={c.body}>
          <View style={c.titleRow}>
            <Text
              style={[c.title, {color: colors.foreground, fontWeight: isUnread ? "700" : "500"}]}
              numberOfLines={2}>
              {notification.title}
            </Text>
            <Text style={[c.time, {color: colors.mutedForeground}]}>
              {formatTimestamp(notification.timestamp)}
            </Text>
          </View>

          <Text style={[c.message, {color: colors.mutedForeground}]} numberOfLines={3}>
            {notification.message}
          </Text>

          {/* Metadata chips */}
          {(notification.metadata?.reservationCode || notification.metadata?.rating != null) && (
            <View style={c.chips}>
              {notification.metadata.reservationCode && (
                <View style={[c.chip, {backgroundColor: colors.muted, borderColor: colors.border}]}>
                  <Ionicons name="barcode-outline" size={11} color={colors.mutedForeground} />
                  <Text style={[c.chipText, {color: colors.mutedForeground}]}>
                    {notification.metadata.reservationCode}
                  </Text>
                </View>
              )}
              {notification.metadata.rating != null && (
                <View style={[c.chip, {backgroundColor: "#f59e0b" + "14", borderColor: "#f59e0b" + "30"}]}>
                  <Ionicons name="star" size={11} color="#f59e0b" />
                  <Text style={[c.chipText, {color: "#f59e0b"}]}>
                    {notification.metadata.rating}/5
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action buttons — invite */}
          {canInvite && (
            <View style={c.actions}>
              {onDeclineInvite && (
                <TouchableOpacity
                  style={[c.actionBtn, c.actionBtnOutline, {borderColor: colors.border}]}
                  onPress={() => onDeclineInvite(notification, linkId)}
                  activeOpacity={0.75}>
                  <Text style={[c.actionBtnText, {color: colors.foreground}]}>Rechazar</Text>
                </TouchableOpacity>
              )}
              {onAcceptInvite && (
                <TouchableOpacity
                  style={[c.actionBtn, {backgroundColor: colors.primary}]}
                  onPress={() => onAcceptInvite(notification, linkId)}
                  activeOpacity={0.75}>
                  <Text style={[c.actionBtnText, {color: colors.primaryForeground}]}>Aceptar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action buttons — reservation */}
          {canReserve && (
            <View style={c.actions}>
              {onRejectReservation && (
                <TouchableOpacity
                  style={[c.actionBtn, c.actionBtnOutline, {borderColor: "#ef4444" + "50"}]}
                  onPress={() => {
                    if (Platform.OS === "web") { onRejectReservation(reservationId); return; }
                    Alert.alert("Rechazar reserva", "¿Rechazar esta solicitud de reserva?", [
                      {text: "Cancelar", style: "cancel"},
                      {text: "Rechazar", style: "destructive", onPress: () => onRejectReservation(reservationId)},
                    ]);
                  }}
                  activeOpacity={0.75}>
                  <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                  <Text style={[c.actionBtnText, {color: "#ef4444"}]}>Rechazar</Text>
                </TouchableOpacity>
              )}
              {onConfirmReservation && (
                <TouchableOpacity
                  style={[c.actionBtn, {backgroundColor: "#10b981"}]}
                  onPress={() => {
                    if (Platform.OS === "web") { onConfirmReservation(reservationId); return; }
                    Alert.alert("Confirmar reserva", "¿Confirmar esta solicitud?", [
                      {text: "Cancelar", style: "cancel"},
                      {text: "Confirmar", onPress: () => onConfirmReservation(reservationId)},
                    ]);
                  }}
                  activeOpacity={0.75}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                  <Text style={[c.actionBtnText, {color: "#fff"}]}>Confirmar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action buttons — tracking */}
          {canTrack && (
            <View style={c.actions}>
              {onRejectTracking && (
                <TouchableOpacity
                  style={[c.actionBtn, c.actionBtnOutline, {borderColor: colors.border}]}
                  onPress={() => onRejectTracking(trackingId)}
                  activeOpacity={0.75}>
                  <Text style={[c.actionBtnText, {color: colors.foreground}]}>Rechazar</Text>
                </TouchableOpacity>
              )}
              {onAcceptTracking && (
                <TouchableOpacity
                  style={[c.actionBtn, {backgroundColor: "#10b981"}]}
                  onPress={() => onAcceptTracking(trackingId)}
                  activeOpacity={0.75}>
                  <Ionicons name="navigate-outline" size={14} color="#fff" />
                  <Text style={[c.actionBtnText, {color: "#fff"}]}>Compartir ubicación</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const c = StyleSheet.create({
  container: {
    position: "relative",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unreadBar: {
    position: "absolute",
    left: 0, top: 14, bottom: 14,
    width: 3, borderRadius: 2,
  },
  inner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingLeft: 6,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  body: {flex: 1, gap: 4},
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {flex: 1, fontSize: 14, lineHeight: 20},
  time:  {fontSize: 11, fontWeight: "500", flexShrink: 0, marginTop: 1},
  message: {fontSize: 13, lineHeight: 18},

  // Metadata chips
  chips: {flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2},
  chip:  {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  chipText: {fontSize: 11, fontWeight: "600"},

  // Action buttons
  actions:        {flexDirection: "row", gap: 8, marginTop: 8},
  actionBtn:      {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flex: 1,
    justifyContent: "center",
  },
  actionBtnOutline: {borderWidth: 1},
  actionBtnText:  {fontSize: 13, fontWeight: "700"},
});
