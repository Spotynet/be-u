import {useCallback, useState} from "react";
import {Platform} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {useRouter} from "expo-router";
import {authApi, tokenRefreshScheduler, tokenUtils} from "@/lib/api";
import {useAuth} from "@/features/auth";

type AppleAuthResult = boolean | "requires_registration";

async function randomNonce(byteLength = 32): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const useAppleAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {refreshToken} = useAuth();
  const router = useRouter();

  const connectWithApple = useCallback(async (): Promise<AppleAuthResult> => {
    if (Platform.OS !== "ios") {
      return false;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        throw new Error("Inicio de sesión con Apple no está disponible en este dispositivo.");
      }
      const rawNonce = await randomNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) {
        throw new Error("Apple no devolvió un token de identidad.");
      }
      const response = await authApi.appleLogin({
        identity_token: credential.identityToken,
        nonce: rawNonce,
        given_name: credential.fullName?.givenName || "",
        family_name: credential.fullName?.familyName || "",
      });
      if (response.data?.requires_registration) {
        const data = response.data.apple_user_data;
        router.push({
          pathname: "/register",
          params: {
            appleEmail: data?.email || "",
            appleFirstName: data?.first_name || credential.fullName?.givenName || "",
            appleLastName: data?.last_name || credential.fullName?.familyName || "",
            appleSub: response.data.apple_sub || "",
          },
        });
        return "requires_registration";
      }
      if (!response.data?.access || !response.data?.refresh) {
        throw new Error(response.data?.error || "No se recibieron tokens de sesión.");
      }
      await tokenUtils.setTokens(response.data.access, response.data.refresh);
      tokenRefreshScheduler.start();
      await refreshToken();
      router.replace("/(tabs)/perfil");
      return true;
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED") {
        return false;
      }
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo completar el inicio de sesión con Apple.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsConnecting(false);
    }
  }, [refreshToken, router]);

  return {connectWithApple, isConnecting, error};
};
