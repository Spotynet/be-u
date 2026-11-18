export {useAuth, AuthProvider} from "./hooks/useAuth";
export {handleSocialLogin} from "./socialLogin";
export type {SocialProvider} from "./socialLogin";
export type {
  User,
  LoginCredentials,
  EmailCodeCredentials,
  EmailCodeLoginResult,
  RegisterData,
  AuthResponse,
  RegisterPendingResponse,
  ResendVerificationResponse,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthContextType,
} from "./types";
export * from "./errors";
