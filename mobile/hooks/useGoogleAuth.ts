import {useCallback, useState} from "react";
import {authApi, errorUtils, tokenRefreshScheduler, tokenUtils} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {getGoogleAuthRedirectUri, openGoogleAuth, parseGoogleAuthCode} from "@/lib/googleAuth";
import {useRouter} from "expo-router";

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

  const pollForGoogleLogin = useCallback(
    async (state: string, redirectUri: string, maxAttempts = 8) => {
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const resp = await authApi.googleCallback({
            state,
            redirect_uri: redirectUri,
          });
          if (resp?.data?.access && resp?.data?.refresh) return resp;
        } catch (_) {
          // not ready yet
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("Login not detected yet. Close the browser and try again.");
    },
    []
  );

  const connectWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    try {
      setIsConnecting(true);
      setError(null);

      const redirectUri = getGoogleAuthRedirectUri();
      const authUrlResp = await authApi.googleAuthUrl(redirectUri);
      const {auth_url, state} = authUrlResp.data;

      if (!auth_url) {
        throw new Error("No auth URL received from server");
      }

      const result = await openGoogleAuth(auth_url);
      const isBackendRedirect = redirectUri.includes("/api/auth/google/callback");

      let callbackResp:
        | Awaited<ReturnType<typeof authApi.googleCallback>>
        | undefined;

      if (result.type === "success" && result.url) {
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
        callbackResp = await pollForGoogleLogin(state, redirectUri, 12);
      } else if (result.type === "cancel") {
        setIsConnecting(false);
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

      await tokenUtils.setTokens(callbackResp.data.access, callbackResp.data.refresh);
      tokenRefreshScheduler.start();
      await refreshToken();

      setIsConnecting(false);
      return true;
    } catch (err: any) {
      setIsConnecting(false);
      setError(errorUtils.getErrorMessage(err));
      return false;
    }
  }, [pollForGoogleLogin, refreshToken, router]);

  return {isConnecting, error, connectWithGoogle};
};
