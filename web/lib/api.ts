import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError} from "axios";
import {
  LoginCredentials,
  RegisterData,
  User,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
  PaginatedResponse,
} from "@/types/api";

// Types for API responses
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
  (config) => {
    // Get token from localStorage or cookies
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

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
  (error: AxiosError) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // But only if we're not already on the login page
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }
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
      message: errorData?.message || axiosError.message || "An error occurred",
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
  login: (credentials: LoginCredentials) =>
    api.post<{token: string; user: User}>("/auth/login/", credentials),

  register: (userData: RegisterData) =>
    api.post<{token: string; user: User}>("/auth/register/", userData),

  logout: () => api.post("/auth/logout/"),

  refreshToken: () => api.post<{token: string}>("/auth/refresh/"),

  getProfile: () => api.get<User>("/auth/profile/"),

  updateProfile: (data: Partial<User>) => api.put<User>("/auth/profile/", data),

  changePassword: (data: ChangePasswordData) => api.post("/auth/change-password/", data),

  forgotPassword: (data: ForgotPasswordData) => api.post("/auth/forgot-password/", data),

  resetPassword: (data: ResetPasswordData) => api.post("/auth/reset-password/", data),
};

// User management API functions
export const userApi = {
  getUsers: (params?: {page?: number; search?: string}) =>
    api.get<PaginatedResponse<User>>("/users/", {params}),

  getUser: (id: number) => api.get<User>(`/users/${id}/`),

  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}/`, data),

  deleteUser: (id: number) => api.delete(`/users/${id}/`),
};

// Service management API functions
export const serviceApi = {
  getServices: (params?: {page?: number; search?: string; category?: string}) =>
    api.get<PaginatedResponse<any>>("/services/", {params}),

  getService: (id: number) => api.get<any>(`/services/${id}/`),

  createService: (data: any) => api.post<any>("/services/", data),

  updateService: (id: number, data: any) => api.put<any>(`/services/${id}/`, data),

  deleteService: (id: number) => api.delete(`/services/${id}/`),
};

// Reservation management API functions
export const reservationApi = {
  getReservations: (params?: {page?: number; user?: number; service?: number; status?: string}) =>
    api.get<PaginatedResponse<any>>("/reservations/", {params}),

  getReservation: (id: number) => api.get<any>(`/reservations/${id}/`),

  createReservation: (data: any) => api.post<any>("/reservations/", data),

  updateReservation: (id: number, data: any) => api.put<any>(`/reservations/${id}/`, data),

  deleteReservation: (id: number) => api.delete(`/reservations/${id}/`),

  cancelReservation: (id: number) => api.patch<any>(`/reservations/${id}/cancel/`),
};

// Review management API functions
export const reviewApi = {
  getReviews: (params?: {page?: number; service?: number; user?: number}) =>
    api.get<PaginatedResponse<any>>("/reviews/", {params}),

  getReview: (id: number) => api.get<any>(`/reviews/${id}/`),

  createReview: (data: any) => api.post<any>("/reviews/", data),

  updateReview: (id: number, data: any) => api.put<any>(`/reviews/${id}/`, data),

  deleteReview: (id: number) => api.delete(`/reviews/${id}/`),
};

// Utility functions for token management
export const tokenUtils = {
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
  },

  isAuthenticated: (): boolean => {
    return !!tokenUtils.getToken();
  },
};

// Utility functions for API operations
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

  // Handle file uploads
  uploadFile: async (file: File, endpoint: string, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);

    const config: AxiosRequestConfig = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    return api.post(endpoint, formData, config);
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

  // Batch requests
  batchRequests: async <T>(requests: (() => Promise<T>)[]): Promise<T[]> => {
    return Promise.all(requests.map((request) => request()));
  },

  // Debounce API calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
};

// Error handling utilities
export const errorUtils = {
  // Extract error message from API error
  getErrorMessage: (error: any): string => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.message) {
      return error.message;
    }
    return "An unexpected error occurred";
  },

  // Extract validation errors
  getValidationErrors: (error: any): Record<string, string[]> => {
    if (error?.response?.data?.errors) {
      return error.response.data.errors;
    }
    return {};
  },

  // Check if error is network error
  isNetworkError: (error: any): boolean => {
    return !error?.response && error?.code === "NETWORK_ERROR";
  },

  // Check if error is authentication error
  isAuthError: (error: any): boolean => {
    return error?.response?.status === 401;
  },

  // Check if error is permission error
  isPermissionError: (error: any): boolean => {
    return error?.response?.status === 403;
  },

  // Check if error is validation error
  isValidationError: (error: any): boolean => {
    return error?.response?.status === 400;
  },
};

// Export the configured axios instance for advanced usage
export {apiClient};

export default api;
