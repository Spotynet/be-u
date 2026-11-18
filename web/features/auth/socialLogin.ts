export type SocialProvider = "google" | "apple";

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: "Google",
  apple: "Apple",
};

/**
 * Web social login entry point.
 *
 * TODO(oauth): Wire to backend when web OAuth clients are ready:
 * - Google: GET /api/auth/google/auth-url/?redirect_uri=… then POST /api/auth/google/callback/
 *   (today auth-url is oriented to mobile redirect URIs; needs a nabbi.app allowlisted redirect)
 * - Apple: obtain identity_token + nonce via Sign in with Apple JS, then POST /api/auth/apple/
 *   Body: { identity_token, nonce, given_name?, family_name? }
 * Env / console still needed: GOOGLE_OAUTH_CLIENT_ID/SECRET (+ web redirect),
 * NEXT_PUBLIC_APPLE_CLIENT_ID (Services ID), Apple private key / team / key id on backend.
 */
/** Stub — returns provider label for callers that still expect a string. Prefer catalog `social_unavailable`. */
export function handleSocialLogin(provider: SocialProvider): string {
  return PROVIDER_LABEL[provider];
}
