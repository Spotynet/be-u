// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

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

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Pagination types
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

// Common API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login/",
    REGISTER: "/auth/register/",
    LOGOUT: "/auth/logout/",
    REFRESH: "/auth/refresh/",
    PROFILE: "/auth/profile/",
    CHANGE_PASSWORD: "/auth/change-password/",
    FORGOT_PASSWORD: "/auth/forgot-password/",
    RESET_PASSWORD: "/auth/reset-password/",
  },
  USERS: {
    LIST: "/users/",
    DETAIL: (id: number) => `/users/${id}/`,
    UPDATE: (id: number) => `/users/${id}/`,
    DELETE: (id: number) => `/users/${id}/`,
  },
  SERVICES: {
    LIST: "/services/",
    DETAIL: (id: number) => `/services/${id}/`,
    CREATE: "/services/",
    UPDATE: (id: number) => `/services/${id}/`,
    DELETE: (id: number) => `/services/${id}/`,
  },
  RESERVATIONS: {
    LIST: "/reservations/",
    DETAIL: (id: number) => `/reservations/${id}/`,
    CREATE: "/reservations/",
    UPDATE: (id: number) => `/reservations/${id}/`,
    DELETE: (id: number) => `/reservations/${id}/`,
  },
  REVIEWS: {
    LIST: "/reviews/",
    DETAIL: (id: number) => `/reviews/${id}/`,
    CREATE: "/reviews/",
    UPDATE: (id: number) => `/reviews/${id}/`,
    DELETE: (id: number) => `/reviews/${id}/`,
  },
} as const;

