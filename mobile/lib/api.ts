/**
 * BE-U Mobile API Client
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

  getProfile: () => api.get<{user: any}>("/auth/profile/"),

  updateProfile: (data: any) => api.put<{user: any}>("/auth/profile/", data),
};

// User management API functions
export const userApi = {
  getUsers: (params?: {page?: number; search?: string}) =>
    api.get<{results: any[]; count: number}>("/users/", {params}),

  getUser: (id: number) => api.get<any>(`/users/${id}/`),

  updateUser: (id: number, data: any) => api.put<any>(`/users/${id}/`, data),

  deleteUser: (id: number) => api.delete(`/users/${id}/`),
};

// Service management API functions
export const serviceApi = {
  getServices: (params?: {page?: number; search?: string; category?: string}) =>
    api.get<{results: any[]; count: number}>("/services/", {params}),

  getService: (id: number) => api.get<any>(`/services/${id}/`),

  createService: (data: any) => api.post<any>("/services/", data),

  updateService: (id: number, data: any) => api.put<any>(`/services/${id}/`, data),

  deleteService: (id: number) => api.delete(`/services/${id}/`),
};

// Reservation management API functions
export const reservationApi = {
  getReservations: (params?: {page?: number; user?: number; service?: number; status?: string}) =>
    api.get<{results: any[]; count: number}>("/reservations/", {params}),

  getReservation: (id: number) => api.get<any>(`/reservations/${id}/`),

  createReservation: (data: any) => api.post<any>("/reservations/", data),

  updateReservation: (id: number, data: any) => api.put<any>(`/reservations/${id}/`, data),

  cancelReservation: (id: number) => api.patch<any>(`/reservations/${id}/cancel/`),

  deleteReservation: (id: number) => api.delete(`/reservations/${id}/`),
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

// Token management utilities
export const tokenUtils = {
  setToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  removeToken: async (): Promise<void> => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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
