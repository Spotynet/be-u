/**
 * useCalendarIntegration Hook
 * 
 * Provides Google Calendar integration functionality including:
 * - OAuth flow for connecting calendar
 * - Calendar status management
 * - Availability sync
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { calendarApi, errorUtils } from '@/lib/api';
import {
  openGoogleAuth,
  parseAuthCode,
  getRedirectUri,
  CalendarStatus,
  BusyTime,
} from '@/lib/googleCalendar';

interface UseCalendarIntegrationReturn {
  // State
  status: CalendarStatus | null;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  connectGoogleCalendar: () => Promise<boolean>;
  disconnectGoogleCalendar: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  syncAvailability: () => Promise<boolean>;
  getBusyTimes: (start: string, end: string) => Promise<BusyTime[]>;
}

export const useCalendarIntegration = (): UseCalendarIntegrationReturn => {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current calendar connection status
   */
  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await calendarApi.getStatus();
      setStatus(response.data);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      console.error('Failed to fetch calendar status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Connect Google Calendar via OAuth flow
   */
  const connectGoogleCalendar = useCallback(async (): Promise<boolean> => {
    try {
      setIsConnecting(true);
      setError(null);

      // Step 1: Get auth URL from backend with mobile redirect URI
      const mobileRedirectUri = getRedirectUri();
      const authUrlResponse = await calendarApi.getAuthUrl(mobileRedirectUri);
      const { auth_url, state } = authUrlResponse.data;

      if (!auth_url) {
        throw new Error('No auth URL received from server');
      }

      // Step 2: Open browser for OAuth
      const result = await openGoogleAuth(auth_url);

      // Check if we're using backend redirect (production) or mobile redirect (development)
      const isBackendRedirect = auth_url.includes('/api/calendar/callback/');

      if (result.type === 'success' && result.url) {
        // Development: Mobile receives callback directly
        if (!isBackendRedirect) {
          // Step 3: Parse the authorization code from callback
          const { code, state: returnedState, error: authError } = parseAuthCode(result.url);

          if (authError) {
            throw new Error(`OAuth error: ${authError}`);
          }

          if (!code) {
            throw new Error('No authorization code received');
          }

          // Step 4: Exchange code for tokens via backend (include redirect_uri)
          const exchangeResponse = await calendarApi.exchangeCode(
            code, 
            returnedState || state,
            mobileRedirectUri  // Include redirect_uri so backend uses the same one
          );

          if (exchangeResponse.data.is_connected) {
            await refreshStatus();
            
            Alert.alert(
              'Calendario conectado',
              'Tu Google Calendar ha sido conectado exitosamente. Ahora tu disponibilidad se sincronizará automáticamente.',
              [{ text: 'OK' }]
            );
            
            return true;
          }
        } else {
          // Production: Backend handled the callback, just verify status
          // Wait a moment for backend to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify connection status by checking directly
          let isConnected = false;
          for (let i = 0; i < 5; i++) {
            await refreshStatus();
            // Check status after refresh
            const currentStatus = await calendarApi.getStatus();
            if (currentStatus.data.is_connected) {
              isConnected = true;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
          if (isConnected) {
            Alert.alert(
              'Calendario conectado',
              'Tu Google Calendar ha sido conectado exitosamente. Ahora tu disponibilidad se sincronizará automáticamente.',
              [{ text: 'OK' }]
            );
            return true;
          } else {
            Alert.alert(
              'Verificando conexión',
              'Por favor, verifica en unos momentos si tu calendario se conectó correctamente. Puedes recargar la página de configuración.',
              [{ text: 'OK' }]
            );
            return false;
          }
        }
      } else if (result.type === 'cancel') {
        // User cancelled the flow
        console.log('User cancelled OAuth flow');
        return false;
      } else if (result.type === 'dismiss') {
        // Browser was dismissed - in production, backend might have processed it
        if (isBackendRedirect) {
          // Wait and check status
          await new Promise(resolve => setTimeout(resolve, 2000));
          const statusCheck = await calendarApi.getStatus();
          if (statusCheck.data.is_connected) {
            await refreshStatus();
            Alert.alert(
              'Calendario conectado',
              'Tu Google Calendar ha sido conectado exitosamente.',
              [{ text: 'OK' }]
            );
            return true;
          }
        }
        console.log('OAuth browser dismissed');
        return false;
      }

      return false;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      
      Alert.alert(
        'Error de conexión',
        `No se pudo conectar tu calendario: ${message}`,
        [{ text: 'OK' }]
      );
      
      console.error('Failed to connect Google Calendar:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshStatus]);

  /**
   * Disconnect Google Calendar
   */
  const disconnectGoogleCalendar = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Confirm with user
      return new Promise((resolve) => {
        Alert.alert(
          'Desconectar calendario',
          '¿Estás seguro de que deseas desconectar tu Google Calendar? Los eventos existentes no se eliminarán de tu calendario.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                setIsLoading(false);
                resolve(false);
              },
            },
            {
              text: 'Desconectar',
              style: 'destructive',
              onPress: async () => {
                try {
                  await calendarApi.disconnect();
                  setStatus({
                    is_connected: false,
                    calendar_id: null,
                    last_sync_at: null,
                    sync_error: null,
                    is_active: false,
                  });
                  
                  Alert.alert(
                    'Desconectado',
                    'Tu Google Calendar ha sido desconectado.',
                    [{ text: 'OK' }]
                  );
                  
                  resolve(true);
                } catch (err) {
                  const message = errorUtils.getErrorMessage(err);
                  setError(message);
                  Alert.alert('Error', message);
                  resolve(false);
                } finally {
                  setIsLoading(false);
                }
              },
            },
          ]
        );
      });
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Manually trigger availability sync
   */
  const syncAvailability = useCallback(async (): Promise<boolean> => {
    if (!status?.is_connected) {
      Alert.alert('Error', 'Google Calendar no está conectado');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await calendarApi.syncAvailability();
      
      // Update status with new sync time
      setStatus(prev => prev ? {
        ...prev,
        last_sync_at: response.data.last_sync_at,
        sync_error: null,
      } : null);

      Alert.alert(
        'Sincronización completa',
        'Tu disponibilidad ha sido sincronizada con Google Calendar.',
        [{ text: 'OK' }]
      );

      return true;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      Alert.alert('Error de sincronización', message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [status?.is_connected]);

  /**
   * Get busy times from Google Calendar
   */
  const getBusyTimes = useCallback(async (start: string, end: string): Promise<BusyTime[]> => {
    if (!status?.is_connected) {
      return [];
    }

    try {
      const response = await calendarApi.getBusyTimes(start, end);
      return response.data.busy_times;
    } catch (err) {
      console.error('Failed to get busy times:', err);
      return [];
    }
  }, [status?.is_connected]);

  // Fetch status on mount
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    isConnecting,
    error,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    refreshStatus,
    syncAvailability,
    getBusyTimes,
  };
};




