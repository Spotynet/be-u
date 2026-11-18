// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  role?: string;
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  isStaff?: boolean;
  isSuperuser?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface EmailCodeCredentials {
  email: string;
  code: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  role?: "client" | "professional" | "place";
  /** First selected category — register compat until backend accepts arrays. */
  category?: string;
  subcategory?: string;
  /** Full multi-select ids — TODO(backend): many-to-many categories on register. */
  categories?: string[];
  subcategories?: string[];
  phone?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}

export interface AuthResponse {
  message?: string;
  access: string;
  refresh: string;
  user: User;
  requires_registration?: boolean;
}

/** Response from POST /auth/register/ — no tokens until email is verified. */
export interface RegisterPendingResponse {
  email: string;
  emailVerified: boolean;
  verificationRequired: boolean;
  resendAvailableIn: number;
  message?: string;
  code?: string;
}

export interface ResendVerificationResponse {
  sent: boolean;
  resendAvailableIn: number;
  error?: string;
  code?: string;
  message?: string;
  retryAfter?: number;
}

export type EmailCodeLoginResult = true | "requires_registration";

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  /** True while the initial session check runs on mount. */
  isInitializing: boolean;
  /** True while an auth action (login, register, etc.) is in flight. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  requestEmailCode: (email: string) => Promise<void>;
  loginWithEmailCode: (credentials: EmailCodeCredentials) => Promise<EmailCodeLoginResult>;
  /** Creates the account and sends a verification code (no session tokens). */
  register: (data: RegisterData) => Promise<RegisterPendingResponse>;
  /** Completes registration by verifying the email code; stores session tokens. */
  verifyRegistrationEmail: (credentials: EmailCodeCredentials) => Promise<User>;
  resendVerification: (email: string) => Promise<ResendVerificationResponse>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}
