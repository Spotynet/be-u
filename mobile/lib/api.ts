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

// API Configuration - HARDCODED for testing

//const API_BASE_URL = "http://127.0.0.1:8000/api";
const API_BASE_URL = "https://stg.be-u.ai/api";

console.log("🔧 HARDCODED API URL:", API_BASE_URL);
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
      console.log("🔓 API Request: Adding auth token to request");
    } else {
      console.log("🔓 API Request: No auth token found");
    }

    // Remove Content-Type header for FormData - let axios/browser set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    console.log("🔓 API Request:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
      hasAuth: !!config.headers.Authorization,
      isFormData: config.data instanceof FormData,
    });

    return config;
  },
  (error) => {
    console.log("🔓 API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 with token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("🔓 API Response:", {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  async (error: AxiosError) => {
    console.log("🔓 API Response Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    const originalRequest: any = error.config || {};
    const status = error.response?.status;
    const url: string = (originalRequest.url as string) || "";

    // Never try to refresh for auth endpoints to avoid loops
    const isAuthRefresh = url.includes("/auth/refresh/");
    const isAuthLogin = url.includes("/auth/login/");

    if (status === 401 && !originalRequest._retry && !isAuthRefresh && !isAuthLogin) {
      originalRequest._retry = true;
      try {
        const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refresh) {
          // Use a plain axios call without our interceptors to avoid recursion
          const resp = await axios.post(
            `${API_BASE_URL}/auth/refresh/`,
            {refresh},
            {
              headers: {"Content-Type": "application/json"},
              timeout: 8000,
            }
          );
          const newAccess: string | undefined = (resp.data as any)?.access;
          if (newAccess) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, newAccess);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        }
      } catch (_) {
        // fallthrough
      }

      // Refresh unavailable or failed: clear and reject
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
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

    // Handle specific backend errors
    if (errorData?.message?.includes("missing 1 required positional argument")) {
      throw new Error(
        "Registration data is incomplete. Please check all fields are filled correctly."
      );
    }

    // Handle network errors
    if (axiosError.code === "NETWORK_ERROR" || axiosError.message.includes("Network Error")) {
      throw new Error(
        "Network Error - Unable to connect to server. Please check your internet connection and try again."
      );
    }

    throw {
      message: errorData?.detail || errorData?.error || errorData?.message || axiosError.message || "An error occurred",
      status: axiosError.response?.status || 500,
      errors: errorData?.errors,
      response: axiosError.response, // Preserve full response for detailed error extraction
      data: errorData, // Preserve error data
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
    api.post<{message: string; user: any; access: string; refresh: string}>(
      "/auth/login/",
      credentials
    ),

  requestEmailCode: (payload: {email: string}) =>
    api.post<{message: string}>("/auth/email/request-code/", payload),

  verifyEmailCode: (payload: {email: string; code: string}) =>
    api.post<{message: string; user: any; access: string; refresh: string}>(
      "/auth/email/verify-code/",
      payload
    ),

  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    role?: 'client' | 'professional' | 'place';
    category?: string;
    subcategory?: string;
    phone?: string;
    city?: string;
    bio?: string;
    address?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    placeName?: string;
  }) =>
    api.post<{message: string; user: any; access: string; refresh: string}>(
      "/auth/register/",
      userData
    ),

  logout: () => api.post("/auth/logout/"),

  refreshToken: (refreshToken: string) =>
    api.post<{access: string}>("/auth/refresh/", {refresh: refreshToken}),

  getProfile: () => api.get<{user: any}>("/auth/profile/"),

  updateProfile: (data: any) => api.put<{user: any}>("/auth/profile/", data),

  googleAuthUrl: (redirectUri?: string) =>
    api.get<{auth_url: string; state: string}>("/auth/google/auth-url/", {
      params: redirectUri ? {redirect_uri: redirectUri} : undefined,
    }),

  googleCallback: (payload: {code: string; state?: string; redirect_uri?: string}) =>
    api.post<{message: string; user: any; access: string; refresh: string}>(
      "/auth/google/callback/",
      payload
    ),
};

// Profile management API functions
export const profileApi = {
  // Client Profile
  getClientProfile: (userId: number) => api.get<any>(`/users/${userId}/`),
  updateClientProfile: (userId: number, data: any) => api.put<any>(`/users/${userId}/`, data),

  // Professional search/listing
  searchProfessionals: (params?: {search?: string; city?: string}) =>
    api.get<any>(`/professionals/`, {params}),

  // Professional Profile
  getProfessionalProfile: (profileId: number) => api.get<any>(`/professionals/${profileId}/`),
  updateProfessionalProfile: (userId: number, data: any) => api.put<any>(`/users/${userId}/`, data),

  // Place Profile
  getPlaceProfile: (profileId: number) => api.get<any>(`/places/${profileId}/`),
  updatePlaceProfile: (userId: number, data: any) => api.put<any>(`/users/${userId}/`, data),
};

// Profile customization API functions
export const profileCustomizationApi = {
  // Get all profile customization data
  getProfileCustomization: () => api.get<any>(`/profile/customization/`),

  // Profile Images (using PublicProfile endpoints)
  getProfileImages: async () => {
    try {
      return await api.get<any>(`/public-profiles/my-profile/`);
    } catch (error: any) {
      // If profile doesn't exist (404), create one automatically
      if (error.response?.status === 404) {
        console.log("No PublicProfile found, creating one automatically...");

        // Try to get user info to create a more personalized profile
        let profileName = "My Profile";
        let profileType = "PROFESSIONAL";

        try {
          const userResponse = await api.get<any>(`/auth/profile/`);
          const user = userResponse.data;
          if (user.first_name || user.last_name) {
            profileName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
          }
          if (user.role === "PLACE") {
            profileType = "PLACE";
          }
        } catch (userError) {
          console.log("Could not fetch user info, using defaults");
        }

        const createResponse = await api.post<any>(`/public-profiles/create-profile/`, {
          profile_type: profileType,
          name: profileName,
          description: "",
          category: "",
          sub_categories: [],
          images: [],
          linked_pros_place: [],
          has_calendar: false,
        });
        return createResponse;
      }
      throw error;
    }
  },
  uploadProfileImage: async (data: FormData) => {
    // First get or create the user's public profile
    const profileResponse = await profileCustomizationApi.getProfileImages();
    const profileId = profileResponse.data.id;
    return api.post<any>(`/public-profiles/${profileId}/upload-image/`, data, {
      headers: {"Content-Type": "multipart/form-data"},
    });
  },
  updateProfileImage: async (imageId: number, data: any) => {
    // For PublicProfile, we don't have individual image updates,
    // we update the entire images array
    const profileResponse = await profileCustomizationApi.getProfileImages();
    const profileId = profileResponse.data.id;
    return api.put<any>(`/public-profiles/${profileId}/`, data);
  },
  deleteProfileImage: async (imageIndex: number) => {
    // Delete by image index in the images array
    const profileResponse = await profileCustomizationApi.getProfileImages();
    const profileId = profileResponse.data.id;
    return api.delete<any>(`/public-profiles/${profileId}/remove-image/`, {
      data: {image_index: imageIndex},
    });
  },

  // Custom Services
  getCustomServices: (params?: {user?: number}) => api.get<any>(`/profile/services/`, {params}),
  createCustomService: (data: any) => api.post<any>(`/profile/services/`, data),
  updateCustomService: (serviceId: number, data: any) =>
    api.put<any>(`/profile/services/${serviceId}/`, data),
  deleteCustomService: (serviceId: number) => api.delete<any>(`/profile/services/${serviceId}/`),

  // Availability Schedule
  getAvailabilitySchedule: () => api.get<any>(`/profile/availability/`),
  updateAvailabilitySchedule: (data: any) => api.post<any>(`/profile/availability/`, data),
  
  // Public availability endpoints
  getPublicAvailability: (providerType: 'professional' | 'place', providerId: number) =>
    api.get<any>(`/availability/public/`, {
      params: {provider_type: providerType, provider_id: providerId},
    }),
  getAvailableSlots: (providerType: 'professional' | 'place', providerId: number, date: string, serviceId?: number) =>
    api.get<any>(`/availability/slots/`, {
      params: {
        provider_type: providerType,
        provider_id: providerId,
        date,
        ...(serviceId ? {service_id: serviceId} : {}),
      },
    }),

  // PublicProfile update (including coordinates)
  updatePublicProfile: async (data: any) => {
    const profileResponse = await profileCustomizationApi.getProfileImages();
    const profileId = profileResponse.data.id;
    // Use PATCH for partial updates to avoid 400 when not sending required fields for PUT
    return api.patch<any>(`/public-profiles/${profileId}/`, data);
  },
  
  // Upload profile photo (main profile picture)
  uploadProfilePhoto: async (data: FormData) => {
    const profileResponse = await profileCustomizationApi.getProfileImages();
    const profileId = profileResponse.data.id;
    return api.patch<any>(`/public-profiles/${profileId}/`, data, {
      // Let Axios set the correct multipart boundary (esp. on web).
      headers: {"Content-Type": "multipart/form-data"},
      transformRequest: (formData, headers) => {
        // Axios will automatically add the correct boundary when Content-Type is unset.
        // Setting it manually often breaks uploads in browsers.
        if (headers) {
          delete (headers as any)["Content-Type"];
        }
        return formData;
      },
    });
  },
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

// Provider profiles API (for browse/explore) - Updated to use PublicProfile
export const providerApi = {
  // Get all public profiles for browsing (both professionals and places)
  getPublicProfiles: (params?: {
    search?: string;
    city?: string;
    page?: number;
    profile_type?: string;
  }) =>
    api.get<{results: any[]; count: number; next?: string; previous?: string}>(
      "/public-profiles/",
      {
        params,
      }
    ),

  // Get professional profiles for browsing (filtered from public profiles)
  getProfessionalProfiles: (params?: {search?: string; city?: string; page?: number}) =>
    api.get<{results: any[]; count: number; next?: string; previous?: string}>(
      "/public-profiles/",
      {
        params: {...params, profile_type: "PROFESSIONAL"},
      }
    ),

  // Get place profiles for browsing (filtered from public profiles)
  getPlaceProfiles: (params?: {search?: string; city?: string; page?: number}) =>
    api.get<{results: any[]; count: number; next?: string; previous?: string}>(
      "/public-profiles/",
      {
        params: {...params, profile_type: "PLACE"},
      }
    ),

  // Get specific public profile with detailed info
  getPublicProfile: (id: number) => api.get<any>(`/public-profiles/${id}/`),

  // Legacy methods for backward compatibility
  getProfessionalProfile: (id: number) => api.get<any>(`/public-profiles/${id}/`),
  getPlaceProfile: (id: number) => api.get<any>(`/public-profiles/${id}/`),
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
  getPlaceServices: (params?: {place?: number; user?: number; is_active?: boolean}) =>
    api.get<{results: any[]; count: number}>("/services/place-services/", {params}),

  getPlaceService: (id: number) => api.get<any>(`/services/place-services/${id}/`),

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
  getProfessionalServices: (params?: {professional?: number; user?: number; is_active?: boolean}) =>
    api.get<{results: any[]; count: number}>("/services/professional-services/", {params}),

  getProfessionalService: (id: number) => api.get<any>(`/services/professional-services/${id}/`),

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
    service_instance_type: "place_service" | "professional_service" | "custom_service";
    service_instance_id: number;
    provider_type?: "professional" | "place";  // Optional provider type for ID resolution
    provider_id?: number;  // Optional provider ID for ID resolution
    date: string;  // YYYY-MM-DD
    time: string;  // HH:MM
    notes?: string;
  }) => api.post<any>("/reservations/", data),

  // Update reservation
  updateReservation: (id: number, data: any) => api.put<any>(`/reservations/${id}/`, data),

  // Cancel reservation (client)
  cancelReservation: (id: number, reason?: string) =>
    api.patch<any>(`/reservations/${id}/cancel/`, {reason}),

  // Confirm reservation (provider)
  // Returns calendar event info if provider has Google Calendar connected
  confirmReservation: (id: number) => api.patch<{
    message: string;
    reservation: any;
    calendar_event_created?: boolean;
    calendar_event_link?: string;
    calendar_event_id?: string;
  }>(`/reservations/${id}/confirm/`),

  // Reject reservation (provider)
  rejectReservation: (id: number, reason?: string) =>
    api.patch<{message: string; reservation: any}>(`/reservations/${id}/reject/`, {reason}),

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

  // Get team reservations (for PLACE: includes linked professionals)
  getTeamReservations: (params?: {
    page?: number;
    status?: string;
    provider_type?: "professional" | "place";
    provider_id?: number;
    start_date?: string;
    end_date?: string;
  }) => api.get<{results: any[]; count: number}>("/reservations/team/", {params}),

  // Get calendar view
  getCalendarView: (params: {start_date: string; end_date: string}) =>
    api.get<Record<string, any[]>>("/reservations/calendar/", {params}),

  // Check availability for a time slot
  checkAvailability: (data: {
    provider_type: "professional" | "place";
    provider_id: number;
    date: string;
    time: string;
    duration_minutes: number;
  }) => api.post<{available: boolean; reason?: string}>("/reservations/check-availability/", data),

  // Get provider schedule for a specific date
  getProviderSchedule: (params: {
    provider_type: "professional" | "place";
    provider_id: number;
    date: string;
  }) => api.get<{
    working_hours: {start: string; end: string} | null;
    booked_slots: {start: string; end: string}[];
    break_times: {start: string; end: string}[];
  }>("/services/availability/schedule/", {params}),
};

const REVIEW_ENDPOINT = "/reviews/reviews/";

const postReviewFormData = (formData: FormData) =>
  api.post(REVIEW_ENDPOINT, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data, headers) => {
      delete headers["Content-Type"];
      return data;
    },
  });

const getReviewsRequest = (params?: Record<string, any>) =>
  api.get<{results: any[]; count: number}>(REVIEW_ENDPOINT, {params});

const patchReview = (id: number, data: any) => api.patch(`${REVIEW_ENDPOINT}${id}/`, data);
const deleteReviewRequest = (id: number) => api.delete(`${REVIEW_ENDPOINT}${id}/`);

const normalizePublicProfileParam = (
  params?: {public_profile?: number; place?: number; professional?: number; page?: number}
) => {
  if (!params) return undefined;
  const {public_profile, place, professional, ...rest} = params;
  return {
    ...rest,
    public_profile: public_profile ?? place ?? professional,
  };
};

// Review management API functions
export const reviewApi = {
  getReviews: (params: {public_profile?: number; from_user?: number; page?: number}) =>
    getReviewsRequest(params),

  createReview: (formData: FormData) => postReviewFormData(formData),

  updateReview: (id: number, data: any) => patchReview(id, data),

  deleteReview: (id: number) => deleteReviewRequest(id),

  listAll: (params?: {from_user?: number; client?: number; page?: number}) =>
    getReviewsRequest({
      ...params,
      from_user: params?.from_user ?? params?.client,
    }),

  listPlaces: (params?: {public_profile?: number; place?: number; page?: number}) =>
    getReviewsRequest(normalizePublicProfileParam(params)),

  listProfessionals: (params?: {public_profile?: number; professional?: number; page?: number}) =>
    getReviewsRequest(normalizePublicProfileParam(params)),

  createPlace: (formData: FormData) => postReviewFormData(formData),
  createProfessional: (formData: FormData) => postReviewFormData(formData),

  updatePlace: (id: number, data: any) => patchReview(id, data),
  updateProfessional: (id: number, data: any) => patchReview(id, data),

  deletePlace: (id: number) => deleteReviewRequest(id),
  deleteProfessional: (id: number) => deleteReviewRequest(id),
};

// Favorites management API functions
export const favoriteApi = {
  // Get user favorites
  getFavorites: (params?: any) => api.get<{results: any[]; count: number}>("/favorites/", {params}),

  // Create favorite
  createFavorite: (data: {content_type: string; object_id: number}) =>
    api.post<any>("/favorites/", data),

  // Remove favorite
  removeFavorite: (id: number) => api.delete(`/favorites/${id}/`),

  // Toggle favorite status
  toggleFavorite: (data: {content_type: string; object_id: number}) =>
    api.post<any>("/favorites/toggle/", data),

  // Bulk remove favorites
  bulkRemove: (favoriteIds: number[]) =>
    api.post<any>("/favorites/bulk_remove/", {favorite_ids: favoriteIds}),

  // Get favorite statistics
  getStats: () => api.get<any>("/favorites/stats/"),
};

// Post/Publication management API functions
export const postApi = {
  // Get posts feed
  getPosts: (params?: {page?: number; author?: number; type?: string}) =>
    api.get<{results: any[]; count: number}>("/posts/list/", {params}),

  // Get single post
  getPost: (id: number) => api.get<any>(`/posts/list/${id}/`),

  // Create photo post
  createPhotoPost: (formData: FormData) => {
    // Don't set Content-Type manually - let axios set it with the correct boundary
    return api.post<any>("/posts/photo/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data, headers) => {
        // Remove Content-Type to let browser/axios set it automatically with boundary
        delete headers["Content-Type"];
        return data;
      },
    });
  },

  // Create video post
  createVideoPost: (formData: FormData) =>
    api.post<any>("/posts/video/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data, headers) => {
        // Remove Content-Type to let browser/axios set it automatically with boundary
        delete headers["Content-Type"];
        return data;
      },
    }),

  // Create carousel post
  createCarouselPost: (formData: FormData, config?: any) =>
    api.post<any>("/posts/carousel/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data, headers) => {
        delete headers["Content-Type"];
        return data;
      },
      ...config,
    }),

  // Create mosaic post
  createMosaicPost: (formData: FormData) =>
    api.post<any>("/posts/mosaic/", formData, {
      headers: {"Content-Type": "multipart/form-data"},
    }),

  // Create pet adoption post
  createPetAdoptionPost: (formData: FormData) =>
    api.post<any>("/posts/pet_adoption/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data, headers) => {
        delete headers["Content-Type"];
        return data;
      },
    }),

  // Create poll post
  createPollPost: (data: {
    caption?: string;
    question: string;
    options: string[];
    expires_at?: string;
  }) => api.post<any>("/posts/poll/", data),

  // Create before/after (transformation) post
  createBeforeAfterPost: (formData: FormData) =>
    api.post<any>("/posts/transformation/", formData),

  // Vote in poll
  voteInPoll: (postId: number, optionId: number) =>
    api.post<any>(`/posts/${postId}/vote/`, {poll_option: optionId}),

  // Create review post
  createReviewPost: (data: {service: number; rating: number; caption?: string; images?: any[]}) =>
    api.post<any>("/posts/review/", data, {
      headers: {"Content-Type": "multipart/form-data"},
    }),

  // Update post
  updatePost: (id: number, data: any) => api.put<any>(`/posts/list/${id}/`, data),

  // Delete post
  deletePost: (id: number) => api.delete(`/posts/list/${id}/`),

  // Like toggle
  likePost: (id: number) => api.post<any>(`/posts/list/${id}/like/`),
  unlikePost: (id: number) => api.post<any>(`/posts/list/${id}/like/`),
  
  // Get liked posts
  getLikedPosts: (params?: {page?: number}) =>
    api.get<{results: any[]; count: number}>("/posts/list/liked/", {params}),

  // Get post comments
  getComments: (postId: number, params?: {page?: number}) =>
    api.get<{results: any[]; count: number}>(`/posts/list/${postId}/comments/`, {params}),

  // Create comment (uses add_comment action)
  createComment: (postId: number, content: string) =>
    api.post<any>(`/posts/list/${postId}/add_comment/`, {content}),

  // Delete comment (uses delete_comment action)
  deleteComment: (postId: number, commentId: number) =>
    api.delete(`/posts/list/${postId}/delete_comment/`, {params: {comment_id: commentId}}),
};

// Notification management API functions
export const notificationApi = {
  // Get notifications with filters
  getNotifications: (params?: {
    page?: number;
    type?: string;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) => api.get<{results: any[]; count: number}>("/notifications/notifications/", {params}),

  // Get single notification
  getNotification: (id: number) => api.get<any>(`/notifications/notifications/${id}/`),

  // Get notification statistics
  getStats: () => api.get<any>("/notifications/notifications/stats/"),

  // Mark notification as read
  markAsRead: (id: number) => api.post<any>(`/notifications/notifications/${id}/mark_read/`),

  // Mark notification as unread
  markAsUnread: (id: number) => api.post<any>(`/notifications/notifications/${id}/mark_unread/`),

  // Mark all notifications as read
  markAllAsRead: () => api.post<any>("/notifications/notifications/mark_all_read/"),

  // Bulk actions on notifications
  bulkAction: (data: {
    notification_ids: number[];
    action: "mark_read" | "mark_unread" | "delete";
  }) => api.post<any>("/notifications/notifications/bulk_action/", data),

  // Update notification
  updateNotification: (id: number, data: {status: string}) =>
    api.patch<any>(`/notifications/notifications/${id}/`, data),

  // Delete notification
  deleteNotification: (id: number) => api.delete(`/notifications/notifications/${id}/`),

  // Register push token
  registerPushToken: (data: {token: string; platform: "ios" | "android" | "web" | "unknown"}) =>
    api.post<any>("/notifications/push-tokens/", data),
};

// Place–Professional Links API
export type LinkedTimeSlot = {
  id?: number;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  is_active?: boolean;
};

export type LinkedAvailabilitySchedule = {
  id?: number;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  is_available: boolean;
  time_slots?: LinkedTimeSlot[];
};

export type PlaceProfessionalLink = {
  id: number;
  status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED";
  notes?: string;
  created_at: string;
  updated_at: string;
  place_id: number;
  place_name: string;
  place_public_profile_id?: number;
  professional_id: number;
  professional_public_profile_id?: number;
  professional_name: string;
  professional_email: string;
  invited_by_email?: string;
};

export const linkApi = {
  // List links for a place (default ACCEPTED)
  listPlaceLinks: (placeId: number, status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED") =>
    api.get<PlaceProfessionalLink[]>(`/links/`, {
      params: {
        ...(status ? {status} : {}),
        place_id: placeId,
      },
    }),
  // List links for current user (professional) or all for place with optional place_id
  listMyLinks: (params?: {status?: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED"; place_id?: number}) =>
    api.get<PlaceProfessionalLink[]>('/links/', {params}),

  // List links for a specific professional (by professional_id)
  listProfessionalLinks: (professionalId: number, status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED") =>
    api.get<PlaceProfessionalLink[]>('/links/', {
      params: {
        ...(status ? {status} : {}),
        professional_id: professionalId,
      },
    }),

  // Public endpoint: List links for a place (no authentication required)
  listPlaceLinksPublic: (placeId: number, status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED") =>
    api.get<PlaceProfessionalLink[]>(`/public-profiles/${placeId}/links/`, {
      params: {
        ...(status ? {status} : {}),
      },
    }),

  // Public endpoint: List links for a professional (no authentication required)
  listProfessionalLinksPublic: (professionalId: number, status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED") =>
    api.get<PlaceProfessionalLink[]>(`/public-profiles/${professionalId}/links/`, {
      params: {
        ...(status ? {status} : {}),
      },
    }),

  // Invite professional to a place (place owner only)
  inviteProfessionalToPlace: (placeId: number, professionalId: number, notes?: string) =>
    api.post<PlaceProfessionalLink>(`/links/`, {
      place_id: placeId,
      professional_id: professionalId,
      notes,
    }),

  // Accept an invite (professional only)
  acceptInvite: (linkId: number) => api.post<PlaceProfessionalLink>(`/links/${linkId}/accept/`),

  // Reject an invite (professional only)
  rejectInvite: (linkId: number) => api.post<PlaceProfessionalLink>(`/links/${linkId}/reject/`),

  // Remove a link (place owner only, soft delete)
  removeLink: (linkId: number) => api.delete(`/links/${linkId}/`),

  // Linked professional schedule management
  getLinkedProfessionalSchedule: (linkId: number) => api.get<any>(`/links/${linkId}/schedule/`),
  updateLinkedProfessionalSchedule: (linkId: number, scheduleData: any) =>
    api.post<any>(`/links/${linkId}/schedule/`, scheduleData),
  
  // Get all schedules for a place (including linked professionals)
  getPlaceSchedules: (placeId: number) =>
    api.get<any>(`/links/place-schedules/`, {params: {place_id: placeId}}),
  
  // Get per-link schedule (legacy - use getLinkedProfessionalSchedule)
  getLinkSchedule: (linkId: number) => api.get<LinkedAvailabilitySchedule[]>(`/links/${linkId}/schedule/`),

  // Set per-link schedule (bulk replace)
  setLinkSchedule: (linkId: number, schedule: LinkedAvailabilitySchedule[]) =>
    api.post<LinkedAvailabilitySchedule[]>(`/links/${linkId}/schedule/`, schedule),
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

// Google Calendar Integration API
export const calendarApi = {
  // Get OAuth authorization URL
  getAuthUrl: (redirectUri?: string) => 
    api.get<{auth_url: string; state: string}>('/calendar/auth-url/', {
      params: redirectUri ? {redirect_uri: redirectUri} : undefined
    }),
  
  // Exchange authorization code for tokens
  exchangeCode: (code?: string, state?: string, redirectUri?: string) =>
    api.post<{message: string; is_connected: boolean; calendar_id: string}>(
      '/calendar/callback/',
      {code, state, redirect_uri: redirectUri}
    ),
  
  // Disconnect Google Calendar
  disconnect: () =>
    api.post<{message: string; is_connected: boolean}>('/calendar/disconnect/'),
  
  // Get calendar connection status
  getStatus: () =>
    api.get<{
      is_connected: boolean;
      calendar_id: string | null;
      last_sync_at: string | null;
      sync_error: string | null;
      is_active: boolean;
    }>('/calendar/status/'),
  
  // Manually trigger availability sync
  syncAvailability: () =>
    api.post<{message: string; last_sync_at: string}>('/calendar/sync-availability/'),
  
  // Get busy times from Google Calendar
  getBusyTimes: (start: string, end: string) =>
    api.get<{
      busy_times: Array<{start: string; end: string}>;
      count: number;
    }>('/calendar/busy-times/', {params: {start, end}}),
  
  // Get provider's busy times (public)
  getProviderBusyTimes: (providerType: 'professional' | 'place', providerId: number, start: string, end: string) =>
    api.get<{
      has_calendar: boolean;
      busy_times: Array<{start: string; end: string}>;
      count: number;
    }>(`/calendar/provider-busy-times/${providerType}/${providerId}/`, {
      params: {start, end}
    }),
  
  // Get calendar events
  getEvents: (start: string, end: string, maxResults?: number) =>
    api.get<{
      events: Array<{
        id: string;
        summary: string;
        description: string;
        location: string;
        start: string;
        end: string;
        htmlLink: string;
        status: string;
        attendees: Array<{email: string; displayName?: string}>;
      }>;
      count: number;
      has_calendar: boolean;
    }>('/calendar/events/', {
      params: {start, end, ...(maxResults ? {max_results: maxResults} : {})}
    }),
};

// Token refresh scheduler
let refreshInterval: ReturnType<typeof setInterval> | null = null;

export const tokenRefreshScheduler = {
  start: async () => {
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Refresh token every 3 hours (before 4-hour expiration)
    refreshInterval = setInterval(async () => {
      try {
        const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refresh) {
          const resp = await axios.post(
            `${API_BASE_URL}/auth/refresh/`,
            {refresh},
            {headers: {"Content-Type": "application/json"}, timeout: 8000}
          );
          const newAccess = resp.data?.access;
          const newRefresh = resp.data?.refresh;

          if (newAccess) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, newAccess);
          }
          if (newRefresh) {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
          }
        }
      } catch (error) {
        console.error("Background token refresh failed:", error);
      }
    }, 3 * 60 * 60 * 1000); // 3 hours
  },

  stop: () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  },
};

// Error handling utilities
export const errorUtils = {
  // Extract error message from API error
  getErrorMessage: (error: any): string => {
    // Priority 1: Check for detail field (Django REST Framework standard)
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }
    // Priority 2: Check for error field
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    // Priority 3: Check for message field
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    // Priority 4: Check for top-level message (axios error)
    if (error?.message) {
      // Don't show technical HTTP error messages
      if (error.message.includes('status code') || error.message.includes('Request failed')) {
        return "Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo.";
      }
      return error.message;
    }
    // Default fallback
    return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
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
