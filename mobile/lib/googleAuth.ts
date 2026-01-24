/**
 * Google Auth Helper
 *
 * Handles OAuth redirect URIs and callback parsing for Google Sign-In.
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export const getGoogleAuthRedirectUri = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  // IMPORTANT:
  // - In dev (Expo Go / dev client), we must use an app redirect URI (exp://... / mypikapp://...).
  // - In production builds, we should use an HTTPS redirect URI that is whitelisted
  //   in Google Cloud Console for the Web OAuth client.
  //
  // Rely only on __DEV__ here: env vars may be missing in production builds, which would
  // incorrectly route us into the dev branch and produce an exp:// redirect URI.
  const isDevelopment = __DEV__;

  if (isDevelopment) {
    const uri = AuthSession.makeRedirectUri({
      scheme: 'mypikapp',
      path: 'google-auth-callback',
    });
    console.log('📱 Google Auth Redirect URI (Dev):', uri);
    return uri;
  }

  // Production: use backend HTTPS callback (allowed by Google OAuth "Web application" client)
  const backendUrl = apiUrl || 'https://stg.be-u.ai/api';
  const uri = `${backendUrl.replace('/api', '')}/api/auth/google/callback/`;
  console.log('📱 Google Auth Redirect URI (Prod):', uri);
  return uri;
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
