/**
 * CalendarConnectionCard Component
 * 
 * Card component for managing Google Calendar connection in profile settings.
 * Shows connection status and provides connect/disconnect functionality.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalendarIntegration } from '../hooks/useCalendarIntegration';

interface CalendarConnectionCardProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const CalendarConnectionCard: React.FC<CalendarConnectionCardProps> = ({
  onConnectionChange,
}) => {
  const {
    status,
    isLoading,
    isConnecting,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncAvailability,
  } = useCalendarIntegration();

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
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={24} color="#4285F4" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Google Calendar</Text>
            <Text style={styles.subtitle}>
              Sincroniza tu disponibilidad
            </Text>
          </View>
        </View>
        
        {/* Status indicator */}
        <View style={[
          styles.statusBadge,
          status?.is_connected ? styles.statusConnected : styles.statusDisconnected
        ]}>
          <View style={[
            styles.statusDot,
            status?.is_connected ? styles.dotConnected : styles.dotDisconnected
          ]} />
          <Text style={[
            styles.statusText,
            status?.is_connected ? styles.textConnected : styles.textDisconnected
          ]}>
            {status?.is_connected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {status?.is_connected ? (
          <>
            <Text style={styles.description}>
              Tu Google Calendar está conectado. Los eventos de tu calendario
              se mostrarán como no disponibles y las reservas confirmadas se
              agregarán automáticamente a tu calendario.
            </Text>
            
            {/* Last sync info */}
            <View style={styles.syncInfo}>
              <Ionicons name="sync" size={16} color="#666" />
              <Text style={styles.syncText}>
                Última sincronización: {formatLastSync(status.last_sync_at)}
              </Text>
            </View>

            {/* Error message if any */}
            {status.sync_error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color="#EA4335" />
                <Text style={styles.errorText}>{status.sync_error}</Text>
              </View>
            )}

            {/* Action buttons for connected state */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.syncButton]}
                onPress={handleSync}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color="#4285F4" />
                    <Text style={styles.syncButtonText}>Sincronizar</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.disconnectButton]}
                onPress={handleDisconnect}
                disabled={isLoading}
              >
                <Ionicons name="unlink" size={18} color="#EA4335" />
                <Text style={styles.disconnectButtonText}>Desconectar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.description}>
              Conecta tu Google Calendar para sincronizar automáticamente tu
              disponibilidad. Los horarios ocupados en tu calendario personal
              se reflejarán en tu perfil.
            </Text>

            {/* Benefits list */}
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#34A853" />
                <Text style={styles.benefitText}>
                  Sincroniza automáticamente tu disponibilidad
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#34A853" />
                <Text style={styles.benefitText}>
                  Reservas se agregan a tu calendario
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#34A853" />
                <Text style={styles.benefitText}>
                  Evita conflictos de horarios
                </Text>
              </View>
            </View>

            {/* Connect button */}
            <TouchableOpacity
              style={[styles.button, styles.connectButton]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#FFF" />
                  <Text style={styles.connectButtonText}>
                    Conectar con Google
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusConnected: {
    backgroundColor: '#E6F4EA',
  },
  statusDisconnected: {
    backgroundColor: '#F5F5F5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotConnected: {
    backgroundColor: '#34A853',
  },
  dotDisconnected: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  textConnected: {
    color: '#137333',
  },
  textDisconnected: {
    color: '#666',
  },
  content: {
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  syncText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8E7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    marginLeft: 8,
    flex: 1,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#4285F4',
    width: '100%',
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  syncButton: {
    flex: 1,
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  syncButtonText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: '#FEE8E7',
    borderWidth: 1,
    borderColor: '#EA4335',
  },
  disconnectButtonText: {
    color: '#EA4335',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CalendarConnectionCard;













