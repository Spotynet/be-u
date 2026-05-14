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
  category?: string;
  subcategory?: string;
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
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  requestEmailCode: (email: string) => Promise<void>;
  loginWithEmailCode: (credentials: EmailCodeCredentials) => Promise<EmailCodeLoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}
