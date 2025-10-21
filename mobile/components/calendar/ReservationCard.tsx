import React from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Reservation} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";

interface ReservationCardProps {
  reservation: Reservation;
  showActions?: boolean;
  onConfirm?: (id: number) => void;
  onReject?: (id: number) => void;
  onCancel?: (id: number) => void;
  onComplete?: (id: number) => void;
  onPress?: (reservation: Reservation) => void;
}

export const ReservationCard = ({
  reservation,
  showActions = false,
  onConfirm,
  onReject,
  onCancel,
  onComplete,
  onPress,
}: ReservationCardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "#10b981";
      case "PENDING":
        return "#f59e0b";
      case "COMPLETED":
        return "#6b7280";
      case "CANCELLED":
        return "#ef4444";
      case "REJECTED":
        return "#dc2626";
      default:
        return colors.primary;
    }
  };

  const statusColor = getStatusColor(reservation.status);

  return (
    <TouchableOpacity
      style={[styles.card, {backgroundColor: colors.card, borderLeftColor: statusColor}]}
      onPress={() => onPress?.(reservation)}
      activeOpacity={0.7}
      disabled={!onPress}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.code, {color: colors.mutedForeground}]}>{reservation.code}</Text>
            <View style={[styles.statusBadge, {backgroundColor: statusColor + "15"}]}>
              <Text style={[styles.statusText, {color: statusColor}]}>
                {reservation.status_display}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Info */}
        <Text style={[styles.serviceName, {color: colors.foreground}]}>
          {reservation.service_details?.name || "Servicio"}
        </Text>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.infoText, {color: colors.foreground}]}>
              {new Date(reservation.date).toLocaleDateString("es-MX", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={[styles.infoText, {color: colors.foreground}]}>
              {reservation.time.substring(0, 5)}
              {reservation.end_time && ` - ${reservation.end_time.substring(0, 5)}`}
            </Text>
          </View>
        </View>

        {/* Client/Provider Info */}
        <View style={styles.infoItem}>
          <Ionicons name="person" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, {color: colors.mutedForeground}]}>
            {reservation.client_details?.name || reservation.provider_name}
          </Text>
        </View>

        {/* Notes */}
        {reservation.notes && (
          <View style={[styles.notesContainer, {backgroundColor: colors.muted}]}>
            <Ionicons name="document-text" size={14} color={colors.mutedForeground} />
            <Text style={[styles.notesText, {color: colors.foreground}]} numberOfLines={2}>
              {reservation.notes}
            </Text>
          </View>
        )}

        {/* Cancellation/Rejection Reason */}
        {(reservation.cancellation_reason || reservation.rejection_reason) && (
          <View style={[styles.reasonContainer, {backgroundColor: "#ef4444" + "10"}]}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text style={[styles.reasonText, {color: "#ef4444"}]} numberOfLines={2}>
              {reservation.cancellation_reason || reservation.rejection_reason}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View style={styles.actions}>
          {reservation.status === "PENDING" && onConfirm && onReject && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: "#10b981"}]}
                onPress={() => onConfirm(reservation.id)}
                activeOpacity={0.8}>
                <Ionicons name="checkmark" size={18} color="#ffffff" />
                <Text style={styles.actionText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: "#ef4444"}]}
                onPress={() => onReject(reservation.id)}
                activeOpacity={0.8}>
                <Ionicons name="close" size={18} color="#ffffff" />
                <Text style={styles.actionText}>Rechazar</Text>
              </TouchableOpacity>
            </>
          )}

          {reservation.status === "CONFIRMED" && onComplete && (
            <TouchableOpacity
              style={[styles.actionButton, {backgroundColor: colors.primary}]}
              onPress={() => onComplete(reservation.id)}
              activeOpacity={0.8}>
              <Ionicons name="checkmark-done" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Completar</Text>
            </TouchableOpacity>
          )}

          {reservation.status === "PENDING" && onCancel && (
            <TouchableOpacity
              style={[styles.actionButton, {backgroundColor: "#ef4444"}]}
              onPress={() => onCancel(reservation.id)}
              activeOpacity={0.8}>
              <Ionicons name="close-circle" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  code: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});














