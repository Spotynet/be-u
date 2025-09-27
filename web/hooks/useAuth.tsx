"use client";

import React, {useState, useEffect, createContext, useContext, ReactNode} from "react";
import {useRouter} from "next/navigation";
import {authApi, tokenUtils, errorUtils} from "@/lib/api";
import {User, LoginCredentials, RegisterData, ApiError} from "@/types/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: {oldPassword: string; newPassword: string}) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAuthenticated = !!user && tokenUtils.isAuthenticated();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenUtils.getToken();
      if (token) {
        try {
          const response = await authApi.getProfile();
          setUser(response.data);
        } catch (err) {
          // Token is invalid, remove it
          tokenUtils.removeToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.login(credentials);

      // Store token and user data
      tokenUtils.setToken(response.data.token);
      setUser(response.data.user);

      // Don't redirect here - let the calling component handle it
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.register(data);

      // Store token and user data
      tokenUtils.setToken(response.data.token);
      setUser(response.data.user);

      // Don't redirect here - let the calling component handle it
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenUtils.removeToken();
    setUser(null);
    setError(null);
    router.push("/login");
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.updateProfile(data);
      setUser(response.data);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: {oldPassword: string; newPassword: string}) => {
    try {
      setError(null);
      setIsLoading(true);

      await authApi.changePassword(data);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setError(null);
      const response = await authApi.getProfile();
      setUser(response.data);
    } catch (err) {
      // If refresh fails, user might need to login again
      if (errorUtils.isAuthError(err)) {
        logout();
      }
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
