import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError} from "axios";
import {
  AuthResponse,
  EmailCodeCredentials,
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
const DEFAULT_REMOTE_API_URL = "https://nabbi-api-dev.spotynet.com/api";

const isLoopbackHost = (value: string) => {
  try {
    const parsed = new URL(value, "http://localhost");
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    const isLocalFrontend = ["localhost", "127.0.0.1", "::1"].includes(currentHost);

    if (!configuredUrl) {
      return isLocalFrontend ? "/api" : DEFAULT_REMOTE_API_URL;
    }

    if (!isLocalFrontend && isLoopbackHost(configuredUrl)) {
      return "/api";
    }

    return configuredUrl;
  }

  return configuredUrl || "/api";
};

const API_BASE_URL = resolveApiBaseUrl();
const AUTH_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Create axios instance with default config (30s matches mobile booking calls)
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
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
    const originalRequest = (error.config || {}) as AxiosRequestConfig & {_retry?: boolean};
    const requestUrl = originalRequest.url || "";
    const isAuthBootstrapEndpoint =
      requestUrl.includes("/auth/login/") ||
      requestUrl.includes("/auth/register/") ||
      requestUrl.includes("/auth/refresh/") ||
      requestUrl.includes("/auth/email/request-code/") ||
      requestUrl.includes("/auth/email/verify-code/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthBootstrapEndpoint) {
      originalRequest._retry = true;
      const refreshToken =
        typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post<{access: string; refresh?: string}>(
            `${API_BASE_URL}/auth/refresh/`,
            {refresh: refreshToken},
            {
              headers: {"Content-Type": "application/json"},
              timeout: 10000,
            }
          );

          const newAccessToken = refreshResponse.data.access;
          const newRefreshToken = refreshResponse.data.refresh;
          if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_TOKEN_KEY, newAccessToken);
            // ROTATE_REFRESH_TOKENS is enabled — save the new refresh token too
            if (newRefreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
            }
          }

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch {
          if (typeof window !== "undefined") {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
          }
        }
      }

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
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
    const status = axiosError.response?.status || 500;

    let message = axiosError.message || "An error occurred";

    if (typeof errorData === "string") {
      message = errorData;
    } else if (errorData && typeof errorData === "object") {
      const fieldErrors = Object.entries(errorData)
        .filter(([, value]) => Array.isArray(value) && value.length > 0)
        .map(([, value]) => String((value as string[])[0]))
        .filter(Boolean);

      if (fieldErrors.length > 0) {
        message = fieldErrors.join(". ");
      } else {
        message =
          errorData.detail ||
          errorData.error ||
          errorData.message ||
          axiosError.message ||
          "An error occurred";
      }
    }

    throw {
      message,
      status,
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
    api.post<AuthResponse>("/auth/login/", credentials),

  requestEmailCode: (payload: {email: string}) =>
    api.post<{message: string}>("/auth/email/request-code/", payload),

  verifyEmailCode: (payload: EmailCodeCredentials) =>
    api.post<AuthResponse>("/auth/email/verify-code/", payload),

  register: (userData: RegisterData) =>
    api.post<AuthResponse>("/auth/register/", userData),

  logout: () => api.post("/auth/logout/"),

  refreshToken: (refresh: string) => api.post<{access: string}>("/auth/refresh/", {refresh}),

  getProfile: () => api.get<{user: User; profile?: any}>("/auth/profile/"),

  updateProfile: (data: Partial<User>) => api.put<{user: User}>("/auth/profile/", data),

  changePassword: (data: ChangePasswordData) => api.post("/auth/change-password/", data),

  forgotPassword: (data: ForgotPasswordData) => api.post("/auth/forgot-password/", data),

  resetPassword: (data: ResetPasswordData) => api.post("/auth/reset-password/", data),

  deleteMyAccount: () => api.post<{message: string}>("/auth/delete-my-account/"),
};

// User management API functions
export const userApi = {
  getUsers: (params?: {page?: number; search?: string}) =>
    api.get<PaginatedResponse<User>>("/users/", {params}),

  getUser: (id: number) => api.get<User>(`/users/${id}/`),

  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}/`, data),

  deleteUser: (id: number) => api.delete(`/users/${id}/`),
};

/** Professional/place profile helpers (mobile profileApi subset). */
export const profileApi = {
  searchProfessionals: (params?: {search?: string; city?: string}) =>
    api.get<any>(`/professionals/`, {params}),
};

// Public Profile management API functions (owner CRUD + browse)
export const publicProfileApi = {
  getPublicProfiles: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    profile_type?: string;
    category?: string;
    city?: string;
  }) => api.get<PaginatedResponse<any>>("/public-profiles/", {params}),

  getPublicProfile: (id: number) => api.get<any>(`/public-profiles/${id}/`),

  getMyProfile: () => api.get<any>("/public-profiles/my-profile/"),

  createPublicProfile: (data: any) => api.post<any>("/public-profiles/create-profile/", data),

  updatePublicProfile: (id: number, data: any) => api.put<any>(`/public-profiles/${id}/`, data),

  patchPublicProfile: (id: number, data: any) => api.patch<any>(`/public-profiles/${id}/`, data),

  deletePublicProfile: (id: number) => api.delete(`/public-profiles/${id}/`),

  uploadImage: (id: number, imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return api.post(`/public-profiles/${id}/upload-image/`, formData, {
      headers: {"Content-Type": "multipart/form-data"},
    });
  },

  removeImage: (id: number, imageIndex: number) =>
    api.delete(`/public-profiles/${id}/remove-image/`, {data: {image_index: imageIndex}}),
};

/** Browse providers — same paths as mobile providerApi */
export const providerApi = {
  getPublicProfiles: (params?: {
    search?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    profile_type?: "PROFESSIONAL" | "PLACE";
    category?: string;
    page?: number;
    page_size?: number;
  }) =>
    api.get<{results: any[]; count: number; next: string | null; previous: string | null}>(
      "/public-profiles/",
      {params}
    ),

  getRecommendations: (params?: {
    radius?: number;
    limit?: number;
    profile_type?: "PROFESSIONAL" | "PLACE";
  }) => api.get<any>("/public-profiles/recommendations/", {params}),

  getNearby: (params: {latitude: number; longitude: number; radius?: number}) =>
    api.get<{results: any[]; count: number}>("/public-profiles/nearby/", {params}),

  getProfessionalProfiles: (params?: {search?: string; city?: string; page?: number}) =>
    api.get<{results: any[]; count: number}>("/public-profiles/", {
      params: {...params, profile_type: "PROFESSIONAL"},
    }),

  getPlaceProfiles: (params?: {search?: string; city?: string; page?: number}) =>
    api.get<{results: any[]; count: number}>("/public-profiles/", {
      params: {...params, profile_type: "PLACE"},
    }),

  getPublicProfile: (id: number) => api.get<any>(`/public-profiles/${id}/`),

  getProfessionalProfile: (id: number) => api.get<any>(`/public-profiles/${id}/`),

  getPlaceProfile: (id: number) => api.get<any>(`/public-profiles/${id}/`),
};

/**
 * Profile customization — Phase 1 subset (availability + own public profile update).
 * Same paths as mobile profileCustomizationApi.
 */
export const profileCustomizationApi = {
  getPublicAvailability: (providerType: "professional" | "place", providerId: number) =>
    api.get<any>(`/availability/public/`, {
      params: {provider_type: providerType, provider_id: providerId},
    }),

  getAvailableSlots: (
    providerType: "professional" | "place",
    providerId: number,
    date: string,
    serviceId?: number
  ) =>
    api.get<any>(`/availability/slots/`, {
      params: {
        provider_type: providerType,
        provider_id: providerId,
        date,
        ...(serviceId ? {service_id: serviceId} : {}),
      },
    }),

  getCustomServices: (params?: {user?: number}) => api.get<any>(`/profile/services/`, {params}),

  getAvailabilitySchedule: () => api.get<any>(`/profile/availability/`),

  updateAvailabilitySchedule: (data: any) => api.post<any>(`/profile/availability/`, data),

  /** Best-effort update of current user's PublicProfile after place register */
  updatePublicProfile: async (data: any) => {
    const profileResponse = await publicProfileApi.getMyProfile();
    const profileId = profileResponse.data.id;
    return api.patch<any>(`/public-profiles/${profileId}/`, data);
  },
};

/**
 * Services — mobile paths for booking/explore.
 * Dashboard still uses unified-* helpers below for existing CRUD UI.
 */
export const serviceApi = {
  // ── Mobile-aligned catalog (Phase 1 booking / public profiles) ──
  getCategories: () => api.get<{results: any[]}>("/services/categories/"),

  getServiceTypes: (params?: {category?: string; search?: string}) =>
    api.get<{results: any[]}>("/services/types/", {params}),

  getCatalogServices: (params?: {
    page?: number;
    search?: string;
    category?: string;
    provider?: number;
  }) => api.get<{results: any[]; count: number}>("/services/", {params}),

  getPlaceServices: (params?: {place?: number; user?: number; is_active?: boolean}) =>
    api.get<{results: any[]; count: number}>("/services/place-services/", {params}),

  getPlaceService: (id: number) => api.get<any>(`/services/place-services/${id}/`),

  getProfessionalServices: (params?: {
    professional?: number;
    user?: number;
    is_active?: boolean;
  }) => api.get<{results: any[]; count: number}>("/services/professional-services/", {params}),

  getProfessionalService: (id: number) => api.get<any>(`/services/professional-services/${id}/`),

  getAvailableSlots: (params: {
    service_id: number;
    date: string;
    service_type: "place" | "professional";
  }) => api.get<any>("/services/available-slots/", {params}),

  // ── Legacy unified-services (existing dashboard /profile CRUD) ──
  getServices: (params?: {
    page?: number;
    search?: string;
    category?: string;
    sub_category?: string;
    min_price?: number;
    max_price?: number;
    provider?: number;
  }) => api.get<PaginatedResponse<any>>("/unified-services/", {params}),

  getService: (id: number) => api.get<any>(`/unified-services/${id}/`),

  getMyServices: () => api.get<any>("/unified-services/my-services/"),

  createService: (data: any) => api.post<any>("/unified-services/", data),

  updateService: (id: number, data: any) => api.put<any>(`/unified-services/${id}/`, data),

  deleteService: (id: number) => api.delete(`/unified-services/${id}/`),

  toggleActive: (id: number) => api.patch<any>(`/unified-services/${id}/toggle-active/`),

  uploadImage: (id: number, imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return api.post(`/unified-services/${id}/upload-image/`, formData, {
      headers: {"Content-Type": "multipart/form-data"},
    });
  },

  removeImage: (id: number, imageIndex: number) =>
    api.delete(`/unified-services/${id}/remove-image/`, {data: {image_index: imageIndex}}),
};

// Reservation management — aligned with mobile reservationApi
export const reservationApi = {
  getReservations: (params?: {
    page?: number;
    user?: number;
    service?: number;
    status?: string;
    provider?: number;
    start_date?: string;
    end_date?: string;
  }) => api.get<PaginatedResponse<any>>("/reservations/", {params}),

  getReservation: (id: number) => api.get<any>(`/reservations/${id}/`),

  createReservation: (data: {
    service_instance_type: "place_service" | "professional_service" | "custom_service";
    service_instance_id: number;
    provider_type?: "professional" | "place";
    provider_id?: number;
    date: string;
    time: string;
    notes?: string;
  }) => api.post<any>("/reservations/", data),

  updateReservation: (id: number, data: any) => api.put<any>(`/reservations/${id}/`, data),

  patchReservation: (id: number, data: {date?: string; time?: string; notes?: string}) =>
    api.patch<any>(`/reservations/${id}/`, data),

  deleteReservation: (id: number) => api.delete(`/reservations/${id}/`),

  cancelReservation: (id: number, reason?: string) =>
    api.patch<any>(`/reservations/${id}/cancel/`, reason ? {reason} : {}),

  confirmReservation: (id: number) => api.patch<any>(`/reservations/${id}/confirm/`),

  completeReservation: (id: number) => api.patch<any>(`/reservations/${id}/complete/`),

  getMyReservations: (params?: {filter?: "upcoming" | "past"}) =>
    api.get<{results: any[]; count: number}>("/reservations/my-reservations/", {params}),

  getIncomingReservations: (params?: {page?: number; status?: string}) =>
    api.get<{results: any[]; count: number}>("/reservations/incoming/", {params}),

  getProviderSchedule: (params: {
    provider_type: "professional" | "place";
    provider_id: number;
    date: string;
  }) =>
    api.get<{
      working_hours: {start: string; end: string} | null;
      booked_slots: {start: string; end: string}[];
      break_times: {start: string; end: string}[];
    }>("/services/availability/schedule/", {params}),
};

// ── Ventas (Sales) ─────────────────────────────────────────────────────────
export const ventasApi = {
  getSales: (params?: {
    status?: string;
    currency?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    ordering?: string;
  }) => api.get<any>("/ventas/", {params}),

  getSale: (id: number) => api.get<any>(`/ventas/${id}/`),

  createSale: (data: any) => api.post<any>("/ventas/", data),

  updateSale: (id: number, data: any) => api.patch<any>(`/ventas/${id}/`, data),

  deleteSale: (id: number) => api.delete(`/ventas/${id}/`),

  markPaid: (id: number, data: {amount_paid?: number; payment_method?: string}) =>
    api.post<any>(`/ventas/${id}/mark-paid/`, data),

  cancel: (id: number) => api.post<any>(`/ventas/${id}/cancel/`, {}),

  getStats: () => api.get<any>("/ventas/stats/"),
};

// Review management API functions (FormData for create with images — same as mobile)
export const reviewApi = {
  getReviews: (params?: {
    page?: number;
    service?: number;
    user?: number;
    public_profile?: number;
    from_user?: number;
  }) => api.get<PaginatedResponse<any>>("/reviews/", {params}),

  getReview: (id: number) => api.get<any>(`/reviews/${id}/`),

  /** Accepts JSON or FormData (multipart with `images`, `to_public_profile`, `rating`, `message`). */
  createReview: (data: FormData | Record<string, any>) => api.post<any>("/reviews/", data),

  updateReview: (id: number, data: any) => api.put<any>(`/reviews/${id}/`, data),

  patchReview: (id: number, data: any) => api.patch<any>(`/reviews/${id}/`, data),

  deleteReview: (id: number) => api.delete(`/reviews/${id}/`),
};

// Favorites — same paths as mobile favoriteApi
export const favoriteApi = {
  getFavorites: (params?: Record<string, any>) =>
    api.get<{results: any[]; count: number}>("/favorites/", {params}),

  createFavorite: (data: {content_type: string; object_id: number}) =>
    api.post<any>("/favorites/", data),

  removeFavorite: (id: number) => api.delete(`/favorites/${id}/`),

  toggleFavorite: (data: {content_type: string; object_id: number}) =>
    api.post<any>("/favorites/toggle/", data),

  getStats: () => api.get<any>("/favorites/stats/"),
};

// Posts / feed — same paths as mobile postApi (Phase 2 subset)
export const postApi = {
  getPosts: (params?: {
    page?: number;
    author?: number;
    type?: string;
    category?: string;
    subcategory?: string;
  }) => api.get<{results: any[]; count: number}>("/posts/list/", {params}),

  getPost: (id: number) => api.get<any>(`/posts/list/${id}/`),

  createPhotoPost: (formData: FormData) => api.post<any>("/posts/photo/", formData),

  createCarouselPost: (formData: FormData) => api.post<any>("/posts/carousel/", formData),

  updatePost: (id: number, data: any) => api.patch<any>(`/posts/list/${id}/`, data),

  deletePost: (id: number) => api.delete(`/posts/list/${id}/`),

  likePost: (id: number) => api.post<any>(`/posts/list/${id}/like/`),

  getLikedPosts: (params?: {page?: number}) =>
    api.get<{results: any[]; count: number}>("/posts/list/liked/", {params}),

  getComments: (postId: number, params?: {page?: number}) =>
    api.get<{results: any[]; count: number}>(`/posts/list/${postId}/comments/`, {params}),

  createComment: (postId: number, content: string) =>
    api.post<any>(`/posts/list/${postId}/add_comment/`, {content}),

  deleteComment: (postId: number, commentId: number) =>
    api.delete(`/posts/list/${postId}/delete_comment/`, {params: {comment_id: commentId}}),
};

/** Places autocomplete/details via Django proxy (CORS-safe for web). */
export const googleMapsApi = {
  autocomplete: (input: string) =>
    api.get<{predictions: any[]}>("/google-maps/places/autocomplete/", {params: {input}}),

  placeDetails: (placeId: string) =>
    api.get<{result: any}>("/google-maps/places/details/", {params: {place_id: placeId}}),

  reverseGeocode: (lat: number, lng: number) =>
    api.get<any>("/google-maps/reverse-geocode/", {params: {lat, lng}}),
};

export interface GroupSessionParticipant {
  id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  status: string;
  notes: string;
  created_at: string;
}

export const groupSessionApi = {
  list: (params?: {
    provider_type?: "professional" | "place";
    provider_id?: number;
    service?: number;
    date_from?: string;
  }) => api.get<{results: any[]; count: number}>("/reservations/group-sessions/", {params}),
  get: (id: number) => api.get<any>(`/reservations/group-sessions/${id}/`),
  create: (data: {
    service: number;
    date: string;
    time: string;
    duration: string;
    capacity: number;
    notes?: string;
    service_instance_id?: number;
    service_instance_type?: "place_service" | "professional_service" | "custom_service";
  }) => api.post<any>("/reservations/group-sessions/", data),
  update: (id: number, data: any) => api.patch<any>(`/reservations/group-sessions/${id}/`, data),
  delete: (id: number) => api.delete(`/reservations/group-sessions/${id}/`),
  reserve: (id: number, notes?: string) =>
    api.post<any>(`/reservations/group-sessions/${id}/reserve/`, {notes}),
  participants: (id: number) =>
    api.get<{results: GroupSessionParticipant[]; count: number}>(
      `/reservations/group-sessions/${id}/participants/`
    ),
};

export const moderationApi = {
  report: (payload: {
    target_type: "post" | "comment" | "review" | "profile";
    target_id: number;
    reason: string;
    note?: string;
  }) => api.post<{id: number; message: string}>("/moderation/reports/", payload),

  blockUser: (userId: number) =>
    api.post<{id: number; blocked_user_id: number}>("/moderation/blocks/", {user_id: userId}),
};

export const notificationApi = {
  getNotifications: (params?: {
    page?: number;
    type?: string;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) => api.get<{results: any[]; count: number}>("/notifications/notifications/", {params}),

  getNotification: (id: number) => api.get<any>(`/notifications/notifications/${id}/`),

  getStats: () => api.get<any>("/notifications/notifications/stats/"),

  markAsRead: (id: number) => api.post<any>(`/notifications/notifications/${id}/mark_read/`),

  markAsUnread: (id: number) => api.post<any>(`/notifications/notifications/${id}/mark_unread/`),

  markAllAsRead: () => api.post<any>("/notifications/notifications/mark_all_read/"),

  bulkAction: (data: {
    notification_ids: number[];
    action: "mark_read" | "mark_unread" | "delete";
  }) => api.post<any>("/notifications/notifications/bulk_action/", data),

  updateNotification: (id: number, data: {status: string}) =>
    api.patch<any>(`/notifications/notifications/${id}/`, data),

  deleteNotification: (id: number) => api.delete(`/notifications/notifications/${id}/`),

  getActiveSessions: () =>
    api.get<{id: number; platform: string; created_at: string; last_seen_at: string | null}[]>(
      "/notifications/push-tokens/"
    ),
  revokeSession: (id: number) => api.delete(`/notifications/push-tokens/${id}/`),
  revokeAllSessions: () => api.delete("/notifications/push-tokens/revoke-all/"),

  getPreferences: () =>
    api.get<{preferences: Record<string, boolean>; updated_at: string}>(
      "/notifications/preferences/me/"
    ),
  savePreferences: (preferences: Record<string, boolean>) =>
    api.put<{preferences: Record<string, boolean>; updated_at: string}>(
      "/notifications/preferences/me/",
      {preferences}
    ),
};

export const supportApi = {
  submitFeedback: (formData: FormData) =>
    api.post<{ticket_id?: string; message?: string}>("/support/feedback/", formData, {
      headers: {"Content-Type": "multipart/form-data"},
      transformRequest: (data, headers) => {
        if (headers) {
          delete (headers as any)["Content-Type"];
        }
        return data;
      },
    }),
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
  listPlaceLinks: (
    placeId: number,
    status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED"
  ) =>
    api.get<PlaceProfessionalLink[]>(`/links/`, {
      params: {
        ...(status ? {status} : {}),
        place_id: placeId,
      },
    }),

  listMyLinks: (params?: {
    status?: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED";
    place_id?: number;
  }) => api.get<PlaceProfessionalLink[]>("/links/", {params}),

  listProfessionalLinks: (
    professionalId: number,
    status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED"
  ) =>
    api.get<PlaceProfessionalLink[]>("/links/", {
      params: {
        ...(status ? {status} : {}),
        professional_id: professionalId,
      },
    }),

  listPlaceLinksPublic: (
    placeId: number,
    status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED"
  ) =>
    api.get<PlaceProfessionalLink[]>(`/public-profiles/${placeId}/links/`, {
      params: {
        ...(status ? {status} : {}),
      },
    }),

  listProfessionalLinksPublic: (
    professionalId: number,
    status: "INVITED" | "ACCEPTED" | "REJECTED" | "REMOVED" | undefined = "ACCEPTED"
  ) =>
    api.get<PlaceProfessionalLink[]>(`/public-profiles/${professionalId}/links/`, {
      params: {
        ...(status ? {status} : {}),
      },
    }),

  inviteProfessionalToPlace: (placeId: number, professionalId: number, notes?: string) =>
    api.post<PlaceProfessionalLink>(`/links/`, {
      place_id: placeId,
      professional_id: professionalId,
      notes,
    }),

  acceptInvite: (linkId: number) => api.post<PlaceProfessionalLink>(`/links/${linkId}/accept/`),

  rejectInvite: (linkId: number) => api.post<PlaceProfessionalLink>(`/links/${linkId}/reject/`),

  removeLink: (linkId: number) => api.delete(`/links/${linkId}/`),

  getLinkedProfessionalSchedule: (linkId: number) => api.get<any>(`/links/${linkId}/schedule/`),

  updateLinkedProfessionalSchedule: (linkId: number, scheduleData: any) =>
    api.post<any>(`/links/${linkId}/schedule/`, scheduleData),
};

export const calendarApi = {
  getAuthUrl: (redirectUri?: string) =>
    api.get<{auth_url: string; state: string}>("/calendar/auth-url/", {
      params: redirectUri ? {redirect_uri: redirectUri} : undefined,
    }),

  exchangeCode: (code?: string, state?: string, redirectUri?: string) =>
    api.post<{message: string; is_connected: boolean; calendar_id: string}>(
      "/calendar/callback/",
      {code, state, redirect_uri: redirectUri}
    ),

  disconnect: () =>
    api.post<{message: string; is_connected: boolean}>("/calendar/disconnect/"),

  getStatus: () =>
    api.get<{
      is_connected: boolean;
      calendar_id: string | null;
      last_sync_at: string | null;
      sync_error: string | null;
      is_active: boolean;
    }>("/calendar/status/"),

  syncAvailability: () =>
    api.post<{message: string; last_sync_at: string}>("/calendar/sync-availability/"),

  getBusyTimes: (start: string, end: string) =>
    api.get<{
      busy_times: Array<{start: string; end: string}>;
      count: number;
    }>("/calendar/busy-times/", {params: {start, end}}),
};

/** Web OAuth redirect for Google Calendar (must be allowlisted in Google Cloud). */
export function getCalendarRedirectUri(): string {
  if (typeof window !== "undefined") {
    const fromEnv = process.env.NEXT_PUBLIC_CALENDAR_REDIRECT_URI;
    if (fromEnv) return fromEnv;
    return `${window.location.origin}/calendar/callback`;
  }
  return process.env.NEXT_PUBLIC_CALENDAR_REDIRECT_URI || "";
}

// Utility functions for token management
export const tokenUtils = {
  setToken: (token: string) => {
    tokenUtils.setTokens(token);
  },

  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  },

  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
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
    const data = error?.response?.data;

    if (typeof data === "string") {
      return data;
    }
    if (data && typeof data === "object") {
      const fieldErrors = Object.entries(data)
        .filter(([, value]) => Array.isArray(value) && value.length > 0)
        .map(([, value]) => String((value as string[])[0]))
        .filter(Boolean);

      if (fieldErrors.length > 0) {
        return fieldErrors.join(". ");
      }
    }
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
