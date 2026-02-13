import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Reservation} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";
import {parseISODateAsLocal} from "@/lib/dateUtils";
import {getCategoryColor} from "@/constants/categories";

interface ReservationCardProps {
  reservation: Reservation;
  showActions?: boolean;
  onConfirm?: (id: number) => void;
  onReject?: (id: number) => void;
  onCancel?: (id: number) => void;
  onComplete?: (id: number) => void;
  onPress?: (reservation: Reservation) => void;
  onScanPress?: (reservation: Reservation) => void;
}

export const ReservationCard = ({
  reservation,
  showActions = false,
  onConfirm,
  onReject,
  onCancel,
  onComplete,
  onPress,
  onScanPress,
}: ReservationCardProps) => {
  const {colors} = useThemeVariant();

  const serviceName =
    reservation.service_details?.name ||
    ((reservation as any).service_name as string | undefined) ||
    "Servicio";

  const professionalName =
    reservation.client_details?.name || reservation.provider_name || "";

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

  const getStatusLabel = (status: string) => {
    switch (String(status || "").toUpperCase()) {
      case "PENDING":
        return "Pendiente";
      case "CONFIRMED":
        return "Confirmada";
      case "COMPLETED":
      case "FINISHED":
        return "Completada";
      case "CANCELLED":
        return "Cancelada";
      case "REJECTED":
        return "Rechazada";
      default:
        return reservation.status_display || status;
    }
  };

  const statusColor = getStatusColor(reservation.status);
  const categoryColor = getCategoryColor(
    reservation.service_details?.category_name ??
      reservation.service_details?.category
  );
  const dateStr = parseISODateAsLocal(reservation.date).toLocaleDateString(
    "es-MX",
    {weekday: "short", month: "short", day: "numeric"}
  );
  const timeStr =
    reservation.time.substring(0, 5) +
    (reservation.end_time ? ` - ${reservation.end_time.substring(0, 5)}` : "");

  const ContentWrapper = onPress ? TouchableOpacity : View;
  const contentWrapperProps = onPress
    ? {onPress: () => onPress(reservation), activeOpacity: 0.85}
    : {};

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderLeftColor: categoryColor,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
            android: {elevation: 3},
          }),
        },
      ]}>
      <ContentWrapper style={styles.content} {...contentWrapperProps}>
        {/* Service name + Status badge */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.serviceName, {color: colors.foreground}]}
            numberOfLines={1}>
            {serviceName}
          </Text>
          <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
            <Text style={styles.statusText}>
              {getStatusLabel(reservation.status).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Professional */}
        {professionalName ? (
          <View style={[styles.infoItem, styles.professionalRow]}>
            <Ionicons
              name="person-outline"
              size={16}
              color={colors.mutedForeground}
            />
            <Text
              style={[styles.infoText, {color: colors.mutedForeground}]}
              numberOfLines={1}>
              {professionalName}
            </Text>
          </View>
        ) : null}

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.infoItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.infoText, {color: colors.foreground}]}>
              {dateStr}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, {color: colors.foreground}]}>
              {timeStr}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {reservation.notes ? (
          <View style={[styles.notesContainer, {backgroundColor: colors.muted}]}>
            <Ionicons name="document-text" size={14} color={colors.mutedForeground} />
            <Text
              style={[styles.notesText, {color: colors.foreground}]}
              numberOfLines={2}>
              {reservation.notes}
            </Text>
          </View>
        ) : null}

        {/* Cancellation/Rejection Reason */}
        {(reservation.cancellation_reason || reservation.rejection_reason) && (
          <View
            style={[
              styles.reasonContainer,
              {backgroundColor: "#ef4444" + "10"},
            ]}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text
              style={[styles.reasonText, {color: "#ef4444"}]}
              numberOfLines={2}>
              {reservation.cancellation_reason ||
                reservation.rejection_reason}
            </Text>
          </View>
        )}

        {/* Google Calendar Event */}
        {reservation.calendar_event_created && (
          <TouchableOpacity
            style={[
              styles.calendarEventContainer,
              {backgroundColor: "#4285F4" + "15"},
            ]}
            onPress={() => {
              if (reservation.calendar_event_link) {
                Linking.openURL(reservation.calendar_event_link);
              }
            }}
            activeOpacity={0.7}
            disabled={!reservation.calendar_event_link}>
            <Ionicons name="logo-google" size={14} color="#4285F4" />
            <Text style={[styles.calendarEventText, {color: "#4285F4"}]}>
              Evento en Google Calendar
            </Text>
            {reservation.calendar_event_link && (
              <Ionicons name="open-outline" size={14} color="#4285F4" />
            )}
          </TouchableOpacity>
        )}
      </ContentWrapper>

      {/* Footer: Escanear al llegar | Ver detalle */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerAction}
          onPress={() => (onScanPress ? onScanPress(reservation) : onPress?.(reservation))}
          activeOpacity={0.7}
          disabled={!onScanPress && !onPress}>
          <Ionicons
            name="qr-code-outline"
            size={18}
            color={colors.mutedForeground}
          />
          <Text style={[styles.footerActionTextMuted, {color: colors.mutedForeground}]}>
            Escanear al llegar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerAction}
          onPress={() => onPress?.(reservation)}
          activeOpacity={0.7}
          disabled={!onPress}>
          <Text style={[styles.footerActionTextPrimary, {color: colors.primary}]}>
            Ver detalle
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>


    </View>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  professionalRow: {
    marginBottom: 10,
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
  dateTimeRow: {
    flexDirection: "row",
    gap: 16,
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
  calendarEventContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  calendarEventText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerActionTextMuted: {
    fontSize: 14,
    fontWeight: "500",
  },
  footerActionTextPrimary: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
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
