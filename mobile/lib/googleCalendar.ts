/**
 * Google Calendar Integration Helper
 * 
 * Provides utilities for Google OAuth flow in React Native/Expo
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
// These should be set from environment variables in production
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

// Get the appropriate client ID based on platform
export const getGoogleClientId = (): string => {
  if (Platform.OS === 'ios') {
    return GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;
  } else if (Platform.OS === 'android') {
    return GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;
  }
  return GOOGLE_WEB_CLIENT_ID;
};

// OAuth scopes for Google Calendar
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// Discovery document for Google OAuth
export const googleDiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Generate redirect URI for the app
export const getRedirectUri = (): string => {
  // Check if we're in development (Expo Go) or production (EAS build)
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  const isDevelopment = __DEV__ || !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  
  if (isDevelopment) {
    // Development: Use Expo Go redirect URI
    const uri = AuthSession.makeRedirectUri({
      scheme: 'mypikapp',
      path: 'calendar-callback',
    });
    console.log('📱 Google Calendar Redirect URI (Dev):', uri);
    return uri;
  } else {
    // Production: Use backend redirect URI (backend will handle callback and redirect back)
    // The backend redirect URI is already configured in Google Cloud Console
    const backendUrl = apiUrl || 'https://stg.be-u.ai/api';
    const uri = `${backendUrl.replace('/api', '')}/api/calendar/callback/`;
    console.log('📱 Google Calendar Redirect URI (Prod):', uri);
    return uri;
  }
};

/**
 * Build Google OAuth authorization URL with required parameters
 */
export const buildGoogleAuthUrl = (state: string): string => {
  const clientId = getGoogleClientId();
  const redirectUri = getRedirectUri();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });
  
  return `${googleDiscoveryDocument.authorizationEndpoint}?${params.toString()}`;
};

/**
 * Parse authorization code from callback URL
 */
export const parseAuthCode = (url: string): { code: string | null; state: string | null; error: string | null } => {
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

/**
 * Open Google OAuth in browser and wait for callback
 */
export const openGoogleAuth = async (authUrl: string): Promise<WebBrowser.WebBrowserAuthSessionResult> => {
  const redirectUri = getRedirectUri();
  
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
    showInRecents: true,
    preferEphemeralSession: false,
  });
  
  return result;
};

/**
 * Type definitions for calendar integration
 */
export interface CalendarStatus {
  is_connected: boolean;
  calendar_id: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  is_active: boolean;
}

export interface BusyTime {
  start: string;
  end: string;
}

export interface CalendarBusyTimesResponse {
  has_calendar: boolean;
  busy_times: BusyTime[];
  count: number;
}




