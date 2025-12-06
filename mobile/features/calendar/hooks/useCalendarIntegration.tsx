/**
 * useCalendarIntegration Hook
 * 
 * Provides Google Calendar integration functionality including:
 * - OAuth flow for connecting calendar
 * - Calendar status management
 * - Availability sync
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Linking, AppState, AppStateStatus } from 'react-native';
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
  
  // Track pending OAuth state for deep link handling
  const pendingOAuthState = useRef<string | null>(null);
  const connectingRef = useRef(false);

  /**
   * Fetch current calendar connection status
   */
  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await calendarApi.getStatus();
      setStatus(response.data);
      return response.data;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      console.error('Failed to fetch calendar status:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle deep link callback from OAuth
   */
  const handleDeepLink = useCallback(async (url: string) => {
    console.log('📱 Calendar deep link received:', url);
    
    if (!url.includes('calendar-callback')) return;
    
    // Parse the callback URL
    const urlObj = new URL(url);
    const success = urlObj.searchParams.get('success') === 'true';
    const errorParam = urlObj.searchParams.get('error');
    
    if (errorParam) {
      setIsConnecting(false);
      connectingRef.current = false;
      Alert.alert('Error', `Error al conectar calendario: ${errorParam}`);
      return;
    }
    
    if (success && pendingOAuthState.current) {
      console.log('📱 Deep link success, exchanging code...');
      
      try {
        // Exchange code using the stored state
        const mobileRedirectUri = getRedirectUri();
        const exchangeResponse = await calendarApi.exchangeCode(
          undefined,
          pendingOAuthState.current,
          mobileRedirectUri
        );
        
        if (exchangeResponse.data.is_connected) {
          await refreshStatus();
          Alert.alert(
            'Calendario conectado',
            'Tu Google Calendar ha sido conectado exitosamente.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('Failed to exchange code from deep link:', err);
        // Check status anyway - might already be connected
        const statusCheck = await calendarApi.getStatus();
        if (statusCheck.data.is_connected) {
          await refreshStatus();
          Alert.alert(
            'Calendario conectado',
            'Tu Google Calendar ha sido conectado exitosamente.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        pendingOAuthState.current = null;
        setIsConnecting(false);
        connectingRef.current = false;
      }
    }
  }, [refreshStatus]);

  // Listen for deep links
  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });
    
    // Listen for URL changes (app already open)
    const subscription = Linking.addEventListener('url', event => {
      handleDeepLink(event.url);
    });
    
    return () => subscription.remove();
  }, [handleDeepLink]);

  // Handle app state changes (returning from browser)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && connectingRef.current && pendingOAuthState.current) {
        console.log('📱 App became active during OAuth, checking status...');
        
        // Small delay to let any deep links process first
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // If still connecting, try to complete the flow
        if (connectingRef.current) {
          try {
            const mobileRedirectUri = getRedirectUri();
            const exchangeResponse = await calendarApi.exchangeCode(
              undefined,
              pendingOAuthState.current,
              mobileRedirectUri
            );
            
            if (exchangeResponse.data.is_connected) {
              await refreshStatus();
              Alert.alert(
                'Calendario conectado',
                'Tu Google Calendar ha sido conectado exitosamente.',
                [{ text: 'OK' }]
              );
              pendingOAuthState.current = null;
              setIsConnecting(false);
              connectingRef.current = false;
              return;
            }
          } catch (err) {
            console.log('Exchange failed, checking status...');
          }
          
          // Fallback: Check status
          const statusCheck = await calendarApi.getStatus();
          if (statusCheck.data.is_connected) {
            await refreshStatus();
            Alert.alert(
              'Calendario conectado',
              'Tu Google Calendar ha sido conectado exitosamente.',
              [{ text: 'OK' }]
            );
          }
          
          pendingOAuthState.current = null;
          setIsConnecting(false);
          connectingRef.current = false;
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshStatus]);

  /**
   * Try to exchange code and complete connection
   */
  const tryExchangeCode = async (state: string, redirectUri: string): Promise<boolean> => {
    console.log('📱 Trying to exchange code with state:', state.substring(0, 10) + '...');
    
    try {
      const exchangeResponse = await calendarApi.exchangeCode(
        undefined,
        state,
        redirectUri
      );
      
      console.log('📱 Exchange response:', exchangeResponse.data);

      if (exchangeResponse.data.is_connected) {
        await refreshStatus();
        Alert.alert(
          'Calendario conectado',
          'Tu Google Calendar ha sido conectado exitosamente.',
          [{ text: 'OK' }]
        );
        return true;
      }
    } catch (exchangeErr: any) {
      console.log('📱 Exchange error:', exchangeErr?.message || exchangeErr);
      // Don't throw, let caller handle
    }
    
    return false;
  };

  /**
   * Connect Google Calendar via OAuth flow
   */
  const connectGoogleCalendar = useCallback(async (): Promise<boolean> => {
    try {
      setIsConnecting(true);
      connectingRef.current = true;
      setError(null);

      // Step 1: Get auth URL from backend with mobile redirect URI
      const mobileRedirectUri = getRedirectUri();
      console.log('📱 Getting auth URL with redirect:', mobileRedirectUri);
      
      const authUrlResponse = await calendarApi.getAuthUrl(mobileRedirectUri);
      const { auth_url, state } = authUrlResponse.data;
      
      console.log('📱 Got auth URL, state:', state.substring(0, 10) + '...');

      if (!auth_url) {
        throw new Error('No auth URL received from server');
      }
      
      // Store state for deep link handling
      pendingOAuthState.current = state;

      // Step 2: Open browser for OAuth
      console.log('📱 Opening browser for OAuth...');
      const result = await openGoogleAuth(auth_url);
      console.log('📱 Browser result type:', result.type);

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
            
            pendingOAuthState.current = null;
            return true;
          }
        } else {
          // Production: Backend handled the callback
          console.log('📱 Production flow - trying to exchange code...');
          
          // Wait for backend to fully process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to exchange
          if (await tryExchangeCode(state, mobileRedirectUri)) {
            pendingOAuthState.current = null;
            return true;
          }
          
          // Retry a couple more times
          for (let i = 0; i < 2; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            if (await tryExchangeCode(state, mobileRedirectUri)) {
              pendingOAuthState.current = null;
              return true;
            }
          }
        }
      } else if (result.type === 'cancel') {
        console.log('📱 User cancelled OAuth flow');
        pendingOAuthState.current = null;
        return false;
      } else if (result.type === 'dismiss') {
        // Browser was dismissed - in production, backend might have processed it
        console.log('📱 Browser dismissed, checking if OAuth completed...');
        
        if (isBackendRedirect) {
          // Wait for backend to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to exchange multiple times
          for (let i = 0; i < 5; i++) {
            console.log(`📱 Exchange attempt ${i + 1}/5...`);
            
            if (await tryExchangeCode(state, mobileRedirectUri)) {
              pendingOAuthState.current = null;
              return true;
            }
            
            // Also check if already connected (might have been from previous attempt)
            try {
              const statusCheck = await calendarApi.getStatus();
              if (statusCheck.data.is_connected) {
                console.log('📱 Already connected!');
                await refreshStatus();
                Alert.alert(
                  'Calendario conectado',
                  'Tu Google Calendar ha sido conectado exitosamente.',
                  [{ text: 'OK' }]
                );
                pendingOAuthState.current = null;
                return true;
              }
            } catch (e) {
              console.log('📱 Status check error:', e);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
          // Final failure message
          Alert.alert(
            'No se pudo completar',
            'Por favor intenta nuevamente. Asegúrate de completar todo el proceso de Google.',
            [{ text: 'OK' }]
          );
        }
        console.log('📱 OAuth browser dismissed without success');
        pendingOAuthState.current = null;
        return false;
      }

      pendingOAuthState.current = null;
      return false;
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      
      Alert.alert(
        'Error de conexión',
        `No se pudo conectar tu calendario: ${message}`,
        [{ text: 'OK' }]
      );
      
      console.error('📱 Failed to connect Google Calendar:', err);
      pendingOAuthState.current = null;
      return false;
    } finally {
      setIsConnecting(false);
      connectingRef.current = false;
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




