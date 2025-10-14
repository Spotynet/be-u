/**
 * Be-U Mobile API Client
 * Centralized API utility for all HTTP requests
 * Similar to web/lib/api.ts but adapted for React Native
 */

import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
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

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";
const AUTH_TOKEN_KEY = "@auth_token";
const REFRESH_TOKEN_KEY = "@refresh_token";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from AsyncStorage
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear token
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      // Note: Navigation to login should be handled by the app
    }

    return Promise.reject(error);
  }
);

// Generic API call function
export const apiCall = async <T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.request({
      method,
      url: endpoint,
      data,
      ...config,
    });

    return {
      data: response.data,
      message: response.data.message,
      status: response.status,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorData = axiosError.response?.data as any;

    throw {
      message: errorData?.error || errorData?.message || axiosError.message || "An error occurred",
      status: axiosError.response?.status || 500,
      errors: errorData?.errors,
    } as ApiError;
  }
};

// Convenience methods for different HTTP methods
export const api = {
  get: <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    apiCall<T>("GET", endpoint, undefined, config),

  post: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiCall<T>("POST", endpoint, data, config),

  put: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiCall<T>("PUT", endpoint, data, config),

  patch: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiCall<T>("PATCH", endpoint, data, config),

  delete: <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    apiCall<T>("DELETE", endpoint, undefined, config),
};

// Auth-specific API functions
export const authApi = {
  login: (credentials: {email: string; password: string}) =>
    api.post<{message: string; user: any}>("/auth/login/", credentials),

  register: (userData: {email: string; password: string; firstName: string; lastName: string}) =>
    api.post<{message: string; user: any}>("/auth/register/", userData),

  logout: () => api.post("/auth/logout/"),

  refreshToken: (refreshToken: string) =>
    api.post<{access: string}>("/auth/refresh/", {refresh: refreshToken}),

  getProfile: () => api.get<{user: any}>("/auth/profile/"),

  updateProfile: (data: any) => api.put<{user: any}>("/auth/profile/", data),
};

// Profile management API functions
export const profileApi = {
  // Client Profile
  getClientProfile: (userId: number) => api.get<any>(`/users/${userId}/client-profile/`),
  updateClientProfile: (userId: number, data: any) =>
    api.put<any>(`/users/${userId}/client-profile/`, data),

  // Professional Profile
  getProfessionalProfile: (userId: number) =>
    api.get<any>(`/users/${userId}/professional-profile/`),
  updateProfessionalProfile: (userId: number, data: any) =>
    api.put<any>(`/users/${userId}/professional-profile/`, data),

  // Place Profile
  getPlaceProfile: (userId: number) => api.get<any>(`/users/${userId}/place-profile/`),
  updatePlaceProfile: (userId: number, data: any) =>
    api.put<any>(`/users/${userId}/place-profile/`, data),
};

// User management API functions
export const userApi = {
  getUsers: (params?: {page?: number; search?: string; role?: string}) =>
    api.get<{results: any[]; count: number}>("/users/", {params}),

  getUser: (id: number) => api.get<any>(`/users/${id}/`),

  updateUser: (id: number, data: any) => api.put<any>(`/users/${id}/`, data),

  deleteUser: (id: number) => api.delete(`/users/${id}/`),

  // Get professionals (for place users to assign to services)
  getProfessionals: (params?: {search?: string}) =>
    api.get<{results: any[]; count: number}>("/users/", {
      params: {...params, role: "PROFESSIONAL"},
    }),
};

// Provider profiles API (for browse/explore)
export const providerApi = {
  // Get professional profiles for browsing
  getProfessionalProfiles: (params?: {search?: string; city?: string; page?: number}) =>
    api.get<{results: any[]; count: number; next?: string; previous?: string}>("/professionals/", {
      params,
    }),

  // Get place profiles for browsing
  getPlaceProfiles: (params?: {search?: string; city?: string; page?: number}) =>
    api.get<{results: any[]; count: number; next?: string; previous?: string}>("/places/", {
      params,
    }),

  // Get specific professional profile
  getProfessionalProfile: (id: number) => api.get<any>(`/professionals/${id}/`),

  // Get specific place profile
  getPlaceProfile: (id: number) => api.get<any>(`/places/${id}/`),
};

// Service management API functions
export const serviceApi = {
  // Service types and categories
  getCategories: () => api.get<{results: any[]}>("/services/categories/"),

  getServiceTypes: (params?: {category?: string; search?: string}) =>
    api.get<{results: any[]}>("/services/types/", {params}),

  createServiceType: (data: {
    name: string;
    category: number;
    description?: string;
    photo?: string;
  }) => api.post<any>("/services/types/", data),

  // Generic services (backward compatible)
  getServices: (params?: {page?: number; search?: string; category?: string; provider?: number}) =>
    api.get<{results: any[]; count: number}>("/services/", {params}),

  getService: (id: number) => api.get<any>(`/services/${id}/`),

  // User's services (role-aware)
  getMyServices: () => api.get<{results: any[]; count: number}>("/services/my-services/"),

  // Place services
  getPlaceServices: (params?: {place?: number; is_active?: boolean}) =>
    api.get<{results: any[]; count: number}>("/services/place-services/", {params}),

  createPlaceService: (data: {
    service: number;
    description?: string;
    time: string; // Duration in HH:MM:SS format
    price: number;
    professional?: number;
    is_active?: boolean;
  }) => api.post<any>("/services/place-services/", data),

  updatePlaceService: (id: number, data: any) =>
    api.put<any>(`/services/place-services/${id}/`, data),

  deletePlaceService: (id: number) => api.delete(`/services/place-services/${id}/`),

  // Professional services
  getProfessionalServices: (params?: {professional?: number; is_active?: boolean}) =>
    api.get<{results: any[]; count: number}>("/services/professional-services/", {params}),

  createProfessionalService: (data: {
    service: number;
    description?: string;
    time: string; // Duration in HH:MM:SS format
    price: number;
    is_active?: boolean;
  }) => api.post<any>("/services/professional-services/", data),

  updateProfessionalService: (id: number, data: any) =>
    api.put<any>(`/services/professional-services/${id}/`, data),

  deleteProfessionalService: (id: number) => api.delete(`/services/professional-services/${id}/`),

  // Available slots
  getAvailableSlots: (params: {
    service_id: number;
    date: string; // YYYY-MM-DD
    service_type: "place" | "professional";
  }) => api.get<any>("/services/available-slots/", {params}),

  // Legacy methods for backward compatibility
  createService: (data: any) => api.post<any>("/services/", data),
  updateService: (id: number, data: any) => api.put<any>(`/services/${id}/`, data),
  deleteService: (id: number) => api.delete(`/services/${id}/`),
};

// Availability management API functions
export const availabilityApi = {
  // Get availability for a provider
  getAvailability: (params?: {provider_type?: string; provider_id?: number}) =>
    api.get<{results: any[]; count: number}>("/services/availability/", {params}),

  // Bulk update availability
  bulkUpdateAvailability: (data: {
    provider_type: "professional" | "place";
    provider_id: number;
    schedules: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active?: boolean;
    }>;
  }) => api.post<any>("/services/availability/bulk-update/", data),

  // Time slot blocks
  getTimeBlocks: (params?: {start_date?: string; end_date?: string}) =>
    api.get<{results: any[]; count: number}>("/services/time-blocks/", {params}),

  createTimeBlock: (data: {
    date: string;
    start_time: string;
    end_time: string;
    reason: string;
    notes?: string;
  }) => api.post<any>("/services/time-blocks/", data),

  deleteTimeBlock: (id: number) => api.delete(`/services/time-blocks/${id}/`),
};

// Reservation management API functions
export const reservationApi = {
  // Get reservations with filters
  getReservations: (params?: {
    page?: number;
    user?: number;
    service?: number;
    status?: string;
    provider?: number;
    start_date?: string;
    end_date?: string;
  }) => api.get<{results: any[]; count: number}>("/reservations/", {params}),

  // Get single reservation
  getReservation: (id: number) => api.get<any>(`/reservations/${id}/`),

  // Create new reservation
  createReservation: (data: {
    service: number;
    provider_type: "professional" | "place";
    provider_id: number;
    service_instance_type?: "place_service" | "professional_service";
    service_instance_id?: number;
    date: string;
    time: string;
    notes?: string;
  }) => api.post<any>("/reservations/", data),

  // Update reservation
  updateReservation: (id: number, data: any) => api.put<any>(`/reservations/${id}/`, data),

  // Cancel reservation (client)
  cancelReservation: (id: number, reason?: string) =>
    api.patch<any>(`/reservations/${id}/cancel/`, {reason}),

  // Confirm reservation (provider)
  confirmReservation: (id: number) => api.patch<any>(`/reservations/${id}/confirm/`),

  // Reject reservation (provider)
  rejectReservation: (id: number, reason?: string) =>
    api.patch<any>(`/reservations/${id}/reject/`, {reason}),

  // Complete reservation
  completeReservation: (id: number) => api.patch<any>(`/reservations/${id}/complete/`),

  // Delete reservation
  deleteReservation: (id: number) => api.delete(`/reservations/${id}/`),

  // Get client's reservations
  getMyReservations: (params?: {filter?: "upcoming" | "past"}) =>
    api.get<{results: any[]; count: number}>("/reservations/my-reservations/", {params}),

  // Get incoming reservations (for providers)
  getIncomingReservations: (params?: {page?: number; status?: string}) =>
    api.get<{results: any[]; count: number}>("/reservations/incoming/", {params}),

  // Get calendar view
  getCalendarView: (params: {start_date: string; end_date: string}) =>
    api.get<Record<string, any[]>>("/reservations/calendar/", {params}),
};

// Review management API functions
export const reviewApi = {
  getReviews: (params?: {page?: number; service?: number; user?: number}) =>
    api.get<{results: any[]; count: number}>("/reviews/", {params}),

  getReview: (id: number) => api.get<any>(`/reviews/${id}/`),

  createReview: (data: any) => api.post<any>("/reviews/", data),

  updateReview: (id: number, data: any) => api.put<any>(`/reviews/${id}/`, data),

  deleteReview: (id: number) => api.delete(`/reviews/${id}/`),
};

// Post/Publication management API functions
export const postApi = {
  // Get posts feed
  getPosts: (params?: {page?: number; author?: number; type?: string}) =>
    api.get<{results: any[]; count: number}>("/posts/", {params}),

  // Get single post
  getPost: (id: number) => api.get<any>(`/posts/${id}/`),

  // Create photo post
  createPhotoPost: (data: {caption?: string; image: any}) =>
    api.post<any>("/posts/photo/", data, {
      headers: {"Content-Type": "multipart/form-data"},
    }),

  // Create video post
  createVideoPost: (data: {caption?: string; video: any; thumbnail?: any}) =>
    api.post<any>("/posts/video/", data, {
      headers: {"Content-Type": "multipart/form-data"},
    }),

  // Create carousel post
  createCarouselPost: (data: {caption?: string; images: any[]}) =>
    api.post<any>("/posts/carousel/", data, {
      headers: {"Content-Type": "multipart/form-data"},
    }),

  // Create poll post
  createPollPost: (data: {
    caption?: string;
    question: string;
    options: string[];
    expires_at?: string;
  }) => api.post<any>("/posts/poll/", data),

  // Vote in poll
  voteInPoll: (postId: number, optionId: number) =>
    api.post<any>(`/posts/${postId}/vote/`, {option: optionId}),

  // Create review post
  createReviewPost: (data: {service: number; rating: number; caption?: string; images?: any[]}) =>
    api.post<any>("/posts/review/", data, {
      headers: {"Content-Type": "multipart/form-data"},
    }),

  // Update post
  updatePost: (id: number, data: any) => api.put<any>(`/posts/${id}/`, data),

  // Delete post
  deletePost: (id: number) => api.delete(`/posts/${id}/`),

  // Like/Unlike post
  likePost: (id: number) => api.post<any>(`/posts/${id}/like/`),
  unlikePost: (id: number) => api.delete(`/posts/${id}/like/`),

  // Get post comments
  getComments: (postId: number, params?: {page?: number}) =>
    api.get<{results: any[]; count: number}>(`/posts/${postId}/comments/`, {params}),

  // Create comment
  createComment: (postId: number, content: string) =>
    api.post<any>(`/posts/${postId}/comments/`, {content}),

  // Delete comment
  deleteComment: (postId: number, commentId: number) =>
    api.delete(`/posts/${postId}/comments/${commentId}/`),
};

// Token management utilities
export const tokenUtils = {
  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  setToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  removeToken: async (): Promise<void> => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },
};

// Error handling utilities
export const errorUtils = {
  // Extract error message from API error
  getErrorMessage: (error: any): string => {
    if (error?.message) {
      return error.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    return "An unexpected error occurred";
  },

  // Extract validation errors
  getValidationErrors: (error: any): Record<string, string[]> => {
    if (error?.errors) {
      return error.errors;
    }
    if (error?.response?.data?.errors) {
      return error.response.data.errors;
    }
    return {};
  },

  // Check if error is network error
  isNetworkError: (error: any): boolean => {
    return !error?.response && (error?.code === "NETWORK_ERROR" || error?.code === "ECONNABORTED");
  },

  // Check if error is authentication error
  isAuthError: (error: any): boolean => {
    return error?.status === 401 || error?.response?.status === 401;
  },

  // Check if error is validation error
  isValidationError: (error: any): boolean => {
    return error?.status === 400 || error?.response?.status === 400;
  },
};

// API utilities
export const apiUtils = {
  // Build query string from parameters
  buildQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return searchParams.toString();
  },

  // Retry failed requests
  retryRequest: async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  },
};

// Export the configured axios instance for advanced usage
export {apiClient};

export default api;
