import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError} from "axios";

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
      if (typeof window !== "undefined") {
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

    throw {
      message: axiosError.response?.data?.message || axiosError.message || "An error occurred",
      status: axiosError.response?.status || 500,
      errors: axiosError.response?.data?.errors,
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
    api.post<{token: string; user: any}>("/auth/login/", credentials),

  register: (userData: {firstName: string; lastName: string; email: string; password: string}) =>
    api.post<{token: string; user: any}>("/auth/register/", userData),

  logout: () => api.post("/auth/logout/"),

  refreshToken: () => api.post<{token: string}>("/auth/refresh/"),

  getProfile: () => api.get("/auth/profile/"),

  updateProfile: (data: any) => api.put("/auth/profile/", data),

  changePassword: (data: {oldPassword: string; newPassword: string}) =>
    api.post("/auth/change-password/", data),

  forgotPassword: (email: string) => api.post("/auth/forgot-password/", {email}),

  resetPassword: (data: {token: string; newPassword: string}) =>
    api.post("/auth/reset-password/", data),
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

// Export the configured axios instance for advanced usage
export {apiClient};

export default api;
