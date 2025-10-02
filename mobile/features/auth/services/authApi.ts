import {apiClient} from "@/lib/api";
import {User} from "@/types/global";
import {LoginCredentials, RegisterCredentials} from "../types";

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<{user: User; token: string}>("/auth/login", credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials) => {
    const response = await apiClient.post<{user: User; token: string}>(
      "/auth/register",
      credentials
    );
    return response.data;
  },

  logout: async () => {
    await apiClient.post("/auth/logout");
  },

  getProfile: async () => {
    const response = await apiClient.get<User>("/auth/profile");
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post<{token: string}>("/auth/refresh");
    return response.data;
  },
};
