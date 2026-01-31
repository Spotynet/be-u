import {useCallback, useEffect, useRef, useState} from "react";
import {authApi, errorUtils, tokenRefreshScheduler, tokenUtils} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {getGoogleAuthRedirectUri, openGoogleAuth, parseGoogleAuthCode, generateGoogleAuthUrl, getGoogleClientId} from "@/lib/googleAuth";
import {useRouter} from "expo-router";
import {AppState, AppStateStatus, Linking} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {Platform} from "react-native";

type GoogleAuthResult = boolean | "requires_registration";

interface UseGoogleAuthReturn {
  isConnecting: boolean;
  error: string | null;
  connectWithGoogle: () => Promise<GoogleAuthResult>;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {refreshToken} = useAuth();
  const router = useRouter();
  const pendingStateRef = useRef<string | null>(null);
  const connectingRef = useRef(false);

  const pollForGoogleLogin = useCallback(
    async (state: string, redirectUri: string, maxAttempts = 8) => {
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const resp = await authApi.googleCallback({
            state,
            redirect_uri: redirectUri,
          });
          // Return if we have tokens (successful login) OR if registration is required
          if (resp?.data?.access && resp?.data?.refresh) return resp;
          if (resp?.data?.requires_registration === true) return resp;
        } catch (_) {
          // not ready yet
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("Login not detected yet. Close the browser and try again.");
    },
    []
  );

  const completeLoginFromState = useCallback(
    async (state: string) => {
      const redirectUri = getGoogleAuthRedirectUri();
      // Production backend flow can take a bit; be more generous here.
      const callbackResp = await pollForGoogleLogin(state, redirectUri, 20);

      // Check if registration is required
      if (callbackResp.data.requires_registration === true) {
        setIsConnecting(false);
        connectingRef.current = false;
        pendingStateRef.current = null;
        router.push({
          pathname: "/register",
          params: {
            googleEmail: callbackResp.data.google_user_data?.email || "",
            googleFirstName: callbackResp.data.google_user_data?.first_name || "",
            googleLastName: callbackResp.data.google_user_data?.last_name || "",
            googlePicture: callbackResp.data.google_user_data?.picture || "",
            googleId: callbackResp.data.google_id || "",
            googleAccessToken: callbackResp.data.tokens?.access_token || "",
            googleRefreshToken: callbackResp.data.tokens?.refresh_token || "",
          },
        });
        return "requires_registration" as const;
      }

      // Ensure we have tokens before trying to set them
      if (!callbackResp.data.access || !callbackResp.data.refresh) {
        throw new Error("Authentication tokens not received from server");
      }

      await tokenUtils.setTokens(callbackResp.data.access, callbackResp.data.refresh);
      tokenRefreshScheduler.start();
      await refreshToken();
      // Navigate to perfil page after successful login
      router.replace("/(tabs)/perfil");
      return true;
    },
    [pollForGoogleLogin, refreshToken, router]
  );

  // Enterprise-grade: handle deep-link return AND "app becomes active" (Safari closed manually).
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url || !url.includes("google-auth-callback")) return;

      try {
        const u = new URL(url);
        const success = u.searchParams.get("success") === "true";
        const errorParam = u.searchParams.get("error");
        const stateFromUrl = u.searchParams.get("state") || pendingStateRef.current;

        if (!connectingRef.current) return;

        // Dismiss browser when deep link is detected (helps auto-close the modal)
        try {
          await WebBrowser.dismissBrowser();
        } catch (e) {
          // Browser may already be closed, ignore errors
        }

        if (errorParam) {
          setError(`Google auth error: ${errorParam}`);
          setIsConnecting(false);
          connectingRef.current = false;
          pendingStateRef.current = null;
          return;
        }

        if (success && stateFromUrl) {
          await completeLoginFromState(stateFromUrl);
          setIsConnecting(false);
          connectingRef.current = false;
          pendingStateRef.current = null;
        }
      } catch {
        // ignore parse errors
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    const onAppStateChange = async (next: AppStateStatus) => {
      if (next !== "active") return;
      if (!connectingRef.current || !pendingStateRef.current) return;

      // If we returned to the app without a deep link, poll by state.
      try {
        await new Promise((r) => setTimeout(r, 500));
        await completeLoginFromState(pendingStateRef.current);
      } catch (e: any) {
        // keep error but allow user to retry
        setError(errorUtils.getErrorMessage(e));
      } finally {
        setIsConnecting(false);
        connectingRef.current = false;
        pendingStateRef.current = null;
      }
    };

    const appStateSub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, [completeLoginFromState]);

  const connectWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    try {
      setIsConnecting(true);
      setError(null);

      const redirectUri = getGoogleAuthRedirectUri();
      
      // Check if we should use native OAuth flow (iOS/Android clients configured)
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
      const hasNativeClient = (Platform.OS === 'ios' && iosClientId) || (Platform.OS === 'android' && androidClientId);
      
      let auth_url: string;
      let state: string;
      
      if (hasNativeClient && !__DEV__) {
        // Native flow: Generate auth URL directly in the app (fully native experience)
        const authData = generateGoogleAuthUrl(redirectUri);
        auth_url = authData.authUrl;
        state = authData.state;
      } else {
        // Web client flow: Get auth URL from backend (current approach)
        const authUrlResp = await authApi.googleAuthUrl(redirectUri);
        auth_url = authUrlResp.data.auth_url;
        state = authUrlResp.data.state;
        
        if (!auth_url) {
          throw new Error("No auth URL received from server");
        }
      }

      // Track this attempt so deep-links / AppState can complete the flow reliably.
      pendingStateRef.current = state;
      connectingRef.current = true;

      const result = await openGoogleAuth(auth_url);
      const isBackendRedirect = redirectUri.includes("/api/auth/google/callback");

      let callbackResp:
        | Awaited<ReturnType<typeof authApi.googleCallback>>
        | undefined;

      if (result.type === "success" && result.url) {
        // Dismiss browser immediately when we get a successful redirect
        // This ensures the modal closes automatically
        try {
          await WebBrowser.dismissBrowser();
        } catch (e) {
          // Browser may already be closed, ignore errors
        }

        // Dev: mobile receives callback directly (mypikapp://... contains code)
        if (!isBackendRedirect) {
          const {code, state: returnedState, error: callbackError} = parseGoogleAuthCode(result.url);
          if (callbackError) throw new Error(callbackError);
          if (!code) throw new Error("No authorization code returned");

          callbackResp = await authApi.googleCallback({
            code,
            state: returnedState || state,
            redirect_uri: redirectUri,
          });
        } else {
          // Prod: backend receives code via GET redirect; exchange via POST (poll if needed)
          const {code, state: returnedState, error: callbackError} = parseGoogleAuthCode(result.url);
          if (callbackError) throw new Error(callbackError);

          if (code) {
            callbackResp = await authApi.googleCallback({
              code,
              state: returnedState || state,
              redirect_uri: redirectUri,
            });
          } else {
            callbackResp = await pollForGoogleLogin(returnedState || state, redirectUri);
          }
        }
      } else if (result.type === "dismiss" && isBackendRedirect) {
        // Common in Expo preview / iOS: user completes in browser, then closes manually.
        callbackResp = await pollForGoogleLogin(state, redirectUri, 20);
      } else if (result.type === "cancel") {
        setIsConnecting(false);
        connectingRef.current = false;
        pendingStateRef.current = null;
        return false;
      } else {
        throw new Error("Google authentication was not completed");
      }

      if (!callbackResp) {
        throw new Error("Google authentication was not completed");
      }

      // Check if registration is required
      if (callbackResp.data.requires_registration === true) {
        setIsConnecting(false);
        connectingRef.current = false;
        pendingStateRef.current = null;
        // Navigate to register with Google info
        router.push({
          pathname: "/register",
          params: {
            googleEmail: callbackResp.data.google_user_data?.email || "",
            googleFirstName: callbackResp.data.google_user_data?.first_name || "",
            googleLastName: callbackResp.data.google_user_data?.last_name || "",
            googlePicture: callbackResp.data.google_user_data?.picture || "",
            googleId: callbackResp.data.google_id || "",
            googleAccessToken: callbackResp.data.tokens?.access_token || "",
            googleRefreshToken: callbackResp.data.tokens?.refresh_token || "",
          },
        });
        return "requires_registration" as const;
      }

      // Ensure we have tokens before trying to set them
      if (!callbackResp.data.access || !callbackResp.data.refresh) {
        throw new Error("Authentication tokens not received from server");
      }

      await tokenUtils.setTokens(callbackResp.data.access, callbackResp.data.refresh);
      tokenRefreshScheduler.start();
      await refreshToken();

      setIsConnecting(false);
      connectingRef.current = false;
      pendingStateRef.current = null;
      // Navigate to perfil page after successful login
      router.replace("/(tabs)/perfil");
      return true;
    } catch (err: any) {
      setIsConnecting(false);
      connectingRef.current = false;
      pendingStateRef.current = null;
      setError(errorUtils.getErrorMessage(err));
      return false;
    }
  }, [pollForGoogleLogin, refreshToken, router]);

  return {isConnecting, error, connectWithGoogle};
};
