import {useCallback, useState} from "react";
import {authApi, errorUtils, tokenRefreshScheduler, tokenUtils} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {getGoogleAuthRedirectUri, openGoogleAuth, parseGoogleAuthCode} from "@/lib/googleAuth";

interface UseGoogleAuthReturn {
  isConnecting: boolean;
  error: string | null;
  connectWithGoogle: () => Promise<boolean>;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {refreshToken} = useAuth();

  const connectWithGoogle = useCallback(async (): Promise<boolean> => {
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
      if (result.type !== "success" || !result.url) {
        if (result.type === "cancel") {
          setIsConnecting(false);
          return false;
        }
        throw new Error("Google authentication was not completed");
      }

      const {code, state: returnedState, error: callbackError} = parseGoogleAuthCode(result.url);
      if (callbackError) {
        throw new Error(callbackError);
      }
      if (!code) {
        throw new Error("No authorization code returned");
      }

      const callbackResp = await authApi.googleCallback({
        code,
        state: returnedState || state,
        redirect_uri: redirectUri,
      });

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
  }, [refreshToken]);

  return {isConnecting, error, connectWithGoogle};
};
