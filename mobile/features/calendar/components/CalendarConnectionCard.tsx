/**
 * CalendarConnectionCard Component
 *
 * Card component for managing Google Calendar connection in profile settings.
 * Shows connection status and provides connect/disconnect functionality.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useCalendarIntegration} from "../hooks/useCalendarIntegration";

interface CalendarConnectionCardProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

// Google blue for calendar icon and "Conectar con Google" button
const GOOGLE_BLUE = "#4285F4";

export const CalendarConnectionCard: React.FC<CalendarConnectionCardProps> = ({
  onConnectionChange,
}) => {
  const {colors} = useThemeVariant();
  const {
    status,
    isLoading,
    isConnecting,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncAvailability,
    tryCompleteConnection,
  } = useCalendarIntegration();

  const [isChecking, setIsChecking] = React.useState(false);

  const handleConnect = async () => {
    const success = await connectGoogleCalendar();
    if (success && onConnectionChange) {
      onConnectionChange(true);
    }
  };

  const handleDisconnect = async () => {
    const success = await disconnectGoogleCalendar();
    if (success && onConnectionChange) {
      onConnectionChange(false);
    }
  };

  const handleSync = async () => {
    await syncAvailability();
  };

  // Manual check for connection (useful for Expo Go)
  // This actually tries to complete the OAuth exchange, not just check status
  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      const success = await tryCompleteConnection();
      if (success && onConnectionChange) {
        onConnectionChange(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const formatLastSync = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.card, {backgroundColor: colors.card}]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, {backgroundColor: colors.muted}]}>
            <Ionicons name="calendar" size={24} color={GOOGLE_BLUE} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, {color: colors.foreground}]}>
              Google Calendar
            </Text>
            <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
              Sincroniza tu disponibilidad
            </Text>
          </View>
        </View>

        {/* Status indicator */}
        <View
          style={[
            styles.statusBadge,
            status?.is_connected
              ? {backgroundColor: colors.success + "30"}
              : {backgroundColor: colors.muted},
          ]}>
          <View
            style={[
              styles.statusDot,
              status?.is_connected
                ? {backgroundColor: colors.success}
                : {backgroundColor: colors.mutedForeground},
            ]}
          />
          <Text
            style={[
              styles.statusText,
              status?.is_connected
                ? {color: colors.success}
                : {color: colors.mutedForeground},
            ]}>
            {status?.is_connected ? "Conectado" : "Desconectado"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {status?.is_connected ? (
          <>
            <Text style={[styles.description, {color: colors.mutedForeground}]}>
              Tu Google Calendar está conectado. Los eventos de tu calendario
              se mostrarán como no disponibles y las reservas confirmadas se
              agregarán automáticamente a tu calendario.
            </Text>

            {/* Last sync info */}
            <View style={[styles.syncInfo, {backgroundColor: colors.input}]}>
              <Ionicons name="sync" size={16} color={colors.mutedForeground} />
              <Text style={[styles.syncText, {color: colors.mutedForeground}]}>
                Última sincronización: {formatLastSync(status.last_sync_at)}
              </Text>
            </View>

            {/* Error message if any */}
            {status.sync_error && (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: colors.destructive + "20",
                  },
                ]}>
                <Ionicons
                  name="warning"
                  size={16}
                  color={colors.destructive}
                />
                <Text
                  style={[styles.errorText, {color: colors.destructive}]}>
                  {status.sync_error}
                </Text>
              </View>
            )}

            {/* Action buttons for connected state */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.syncButton,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={handleSync}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="refresh"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.syncButtonText,
                        {color: colors.primary},
                      ]}>
                      Sincronizar
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.disconnectButton,
                  {
                    backgroundColor: colors.destructive + "20",
                    borderColor: colors.destructive,
                  },
                ]}
                onPress={handleDisconnect}
                disabled={isLoading}>
                <Ionicons
                  name="unlink"
                  size={18}
                  color={colors.destructive}
                />
                <Text
                  style={[
                    styles.disconnectButtonText,
                    {color: colors.destructive},
                  ]}>
                  Desconectar
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.description, {color: colors.mutedForeground}]}>
              Conecta tu Google Calendar para sincronizar automáticamente tu
              disponibilidad. Los horarios ocupados en tu calendario personal
              se reflejarán en tu perfil.
            </Text>

            {/* Benefits list */}
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success}
                />
                <Text
                  style={[styles.benefitText, {color: colors.foreground}]}>
                  Sincroniza automáticamente tu disponibilidad
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success}
                />
                <Text
                  style={[styles.benefitText, {color: colors.foreground}]}>
                  Reservas se agregan a tu calendario
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success}
                />
                <Text
                  style={[styles.benefitText, {color: colors.foreground}]}>
                  Evita conflictos de horarios
                </Text>
              </View>
            </View>

            {/* Connect button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.connectButton,
                {backgroundColor: GOOGLE_BLUE},
              ]}
              onPress={handleConnect}
              disabled={isConnecting || isChecking}>
              {isConnecting ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryForeground}
                />
              ) : (
                <>
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.connectButtonText,
                      {color: colors.primaryForeground},
                    ]}>
                    Conectar con Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Check connection button - useful after OAuth in Expo Go */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.checkButton,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleCheckConnection}
              disabled={isConnecting || isChecking}>
              {isChecking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name="refresh"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.checkButtonText, {color: colors.primary}]}>
                    Verificar conexión
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  syncInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  syncText: {
    fontSize: 13,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  connectButton: {
    width: "100%",
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkButton: {
    borderWidth: 1,
    width: "100%",
    marginTop: 10,
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  syncButton: {
    flex: 1,
    borderWidth: 1,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  disconnectButton: {
    flex: 1,
    borderWidth: 1,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default CalendarConnectionCard;




















