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

  // Expo Go: Must use backend HTTPS callback (Expo Go doesn't support custom URL schemes)
  // The backend HTML template handles redirect and auto-close
  if (inExpoGo) {
    const backendUrl = apiUrl || 'https://stg.be-u.ai/api';
    const uri = `${backendUrl.replace('/api', '')}/api/auth/google/callback/`;
    console.log('📱 Google Auth Redirect URI (Expo Go - Backend):', uri);
    return uri;
  }

  // Development Build: Use app scheme (works with dev client, not Expo Go)
  if (isDevelopment) {
    const uri = AuthSession.makeRedirectUri({
      scheme: 'mypikapp',
      path: 'google-auth-callback',
    });
    console.log('📱 Google Auth Redirect URI (Dev Build):', uri);
    return uri;
  }

  // Production/EAS Preview: Use native app scheme if iOS/Android OAuth clients are configured
  // This provides a native login experience (no browser modal) like other apps
  // Native clients support app scheme URIs (mypikapp://google-auth-callback)
  if (hasNativeOAuthClients()) {
    const uri = AuthSession.makeRedirectUri({
      scheme: 'mypikapp',
      path: 'google-auth-callback',
    });
    console.log('📱 Google Auth Redirect URI (Native - App Scheme):', uri);
    return uri;
  }

  // Fallback: Use backend HTTPS callback (Web OAuth client)
  // This requires the browser modal but works without separate iOS/Android clients
  // The backend HTML template handles redirect and auto-close
  const backendUrl = apiUrl || 'https://stg.be-u.ai/api';
  const uri = `${backendUrl.replace('/api', '')}/api/auth/google/callback/`;
  console.log('📱 Google Auth Redirect URI (Web Client - Backend):', uri);
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
