// Import auth types for use in this file
import type {User} from "@/features/auth/types";

// Re-export auth types for backward compatibility
export type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
} from "@/features/auth/types";

// Service types
export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: User;
  images?: string[];
  tags?: string[];
}

// Reservation types
export interface Reservation {
  id: number;
  user: User;
  service: Service;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  duration: number;
}

// Review types
export interface Review {
  id: number;
  user: User;
  service: Service;
  reservation?: Reservation;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

// Service creation/update types
export interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  images?: File[];
  tags?: string[];
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  isActive?: boolean;
}

// Reservation creation/update types
export interface CreateReservationData {
  service: number;
  date: string;
  time: string;
  notes?: string;
}

export interface UpdateReservationData {
  date?: string;
  time?: string;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
}

// Review creation/update types
export interface CreateReviewData {
  service: number;
  reservation?: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

// Search and filter types
export interface ServiceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  isActive?: boolean;
  search?: string;
}

export interface ReservationFilters {
  user?: number;
  service?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReviewFilters {
  service?: number;
  user?: number;
  minRating?: number;
  maxRating?: number;
  isVerified?: boolean;
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
    UPLOAD_IMAGE: (id: number) => `/services/${id}/upload-image/`,
    CATEGORIES: "/services/categories/",
  },
  RESERVATIONS: {
    LIST: "/reservations/",
    DETAIL: (id: number) => `/reservations/${id}/`,
    CREATE: "/reservations/",
    UPDATE: (id: number) => `/reservations/${id}/`,
    DELETE: (id: number) => `/reservations/${id}/`,
    CANCEL: (id: number) => `/reservations/${id}/cancel/`,
    CONFIRM: (id: number) => `/reservations/${id}/confirm/`,
    AVAILABLE_SLOTS: "/reservations/available-slots/",
  },
  REVIEWS: {
    LIST: "/reviews/",
    DETAIL: (id: number) => `/reviews/${id}/`,
    CREATE: "/reviews/",
    UPDATE: (id: number) => `/reviews/${id}/`,
    DELETE: (id: number) => `/reviews/${id}/`,
    BY_SERVICE: (serviceId: number) => `/reviews/service/${serviceId}/`,
    BY_USER: (userId: number) => `/reviews/user/${userId}/`,
  },
} as const;

// API status codes
export const API_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// API error messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access denied.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "An internal server error occurred.",
  TIMEOUT: "Request timed out. Please try again.",
} as const;
