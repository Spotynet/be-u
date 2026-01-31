/**
 * Google Auth Helper
 *
 * Handles OAuth redirect URIs and callback parsing for Google Sign-In.
 * Supports both native (iOS/Android OAuth clients) and web-based flows.
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

/**
 * Check if running in Expo Go (which doesn't support custom URL schemes)
 */
const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

/**
 * Check if native OAuth clients are configured
 * Native clients allow direct app scheme redirects (mypikapp://) for seamless native experience
 */
const hasNativeOAuthClients = (): boolean => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  
  if (Platform.OS === 'ios' && iosClientId) return true;
  if (Platform.OS === 'android' && androidClientId) return true;
  
  return false;
};

export const getGoogleAuthRedirectUri = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  const isDevelopment = __DEV__;
  const inExpoGo = isExpoGo();
  const hasNative = hasNativeOAuthClients();

  // Helper to build backend callback URI
  const buildBackendCallbackUri = (): string => {
    const backendUrl = apiUrl || 'https://stg.be-u.ai/api';
    // Ensure we construct the URI correctly - remove trailing /api if present, then add the callback path
    const baseUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl.replace('/api', '');
    return `${baseUrl}/api/auth/google/callback/`;
  };

  // Expo Go: Must use backend HTTPS callback (Expo Go doesn't support custom URL schemes)
  if (inExpoGo) {
    const uri = buildBackendCallbackUri();
    console.log('📱 Google Auth Redirect URI (Expo Go - Backend):', uri);
    return uri;
  }

  // Development Build: Use app scheme (works with dev client, not Expo Go)
  // Only use app scheme in development if we're actually in dev mode
  if (isDevelopment && !inExpoGo) {
    const uri = AuthSession.makeRedirectUri({
      scheme: 'mypikapp',
      path: 'google-auth-callback',
    });
    console.log('📱 Google Auth Redirect URI (Dev Build - App Scheme):', uri);
    return uri;
  }

  // Production/EAS Build: 
  // - If native OAuth clients are configured, use app scheme (native experience)
  // - Otherwise, use backend HTTPS callback (web OAuth client - works for EAS updates)
  if (hasNative && !isDevelopment) {
    const uri = AuthSession.makeRedirectUri({
      scheme: 'mypikapp',
      path: 'google-auth-callback',
    });
    console.log('📱 Google Auth Redirect URI (Production - Native App Scheme):', uri);
    return uri;
  }

  // Fallback: Use backend HTTPS callback (Web OAuth client)
  // This works for EAS updates, production builds without native clients, etc.
  const uri = buildBackendCallbackUri();
  console.log('📱 Google Auth Redirect URI (Production - Backend Callback):', uri);
  return uri;
};

/**
 * Get the appropriate Google OAuth client ID based on platform
 */
export const getGoogleClientId = (): string | null => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  
  if (Platform.OS === 'ios' && iosClientId) return iosClientId;
  if (Platform.OS === 'android' && androidClientId) return androidClientId;
  
  return webClientId || null;
};

/**
 * Generate Google OAuth auth URL directly (for native clients)
 * This provides a fully native experience without backend dependency for auth URL
 */
export const generateGoogleAuthUrl = (redirectUri: string, state?: string): { authUrl: string; state: string } => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google OAuth client ID not configured');
  }
  
  const finalState = state || AuthSession.makeRedirectUri({ useProxy: false });
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
  ];
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state: finalState,
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return { authUrl, state: finalState };
};

export const parseGoogleAuthCode = (url: string): { code: string | null; state: string | null; error: string | null } => {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');
    const error = urlObj.searchParams.get('error');
    return { code, state, error };
  } catch (e) {
    return { code: null, state: null, error: 'Failed to parse URL' };
  }
};

export const openGoogleAuth = async (authUrl: string): Promise<WebBrowser.WebBrowserAuthSessionResult> => {
  const redirectUri = getGoogleAuthRedirectUri();
  return WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
    showInRecents: true,
    preferEphemeralSession: false,
  });
};
