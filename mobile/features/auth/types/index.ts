import {User} from "@/types/global";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface EmailCodeCredentials {
  email: string;
  code: string;
}

export interface RegisterCredentials {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  role?: "client" | "professional" | "place";
  category?: string;
  subcategory?: string;
  phone?: string;
  city?: string;
  bio?: string;
  address?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
  appleSub?: string;
}

export type EmailCodeLoginResult = true | "requires_registration";

export interface RegisterPendingResponse {
  email: string;
  emailVerified: boolean;
  verificationRequired: boolean;
  resendAvailableIn: number;
  message?: string;
}

export interface ResendVerificationResponse {
  sent: boolean;
  resendAvailableIn: number;
  error?: string;
  code?: string;
  message?: string;
  retryAfter?: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  requestEmailCode: (email: string) => Promise<void>;
  loginWithEmailCode: (credentials: EmailCodeCredentials) => Promise<EmailCodeLoginResult>;
  /** Creates account and emails a code (no session tokens yet). */
  register: (credentials: RegisterCredentials) => Promise<RegisterPendingResponse>;
  verifyRegistrationEmail: (credentials: EmailCodeCredentials) => Promise<User>;
  resendVerification: (email: string) => Promise<ResendVerificationResponse>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
