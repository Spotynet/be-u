"use client";

import React, {useState, useEffect, createContext, useContext, ReactNode} from "react";
import {useRouter} from "next/navigation";
import {authApi, tokenUtils, errorUtils} from "@/lib/api";
import {clearAllRecentVisits} from "@/features/recent-visits";
import {
  AuthContextType,
  EmailCodeCredentials,
  EmailCodeLoginResult,
  LoginCredentials,
  RegisterData,
  RegisterPendingResponse,
  ResendVerificationResponse,
  User,
  ChangePasswordData,
} from "../types";

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
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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
          setUser(response.data.user);
        } catch (err: any) {
          // Only clear tokens when the server explicitly rejects them (401).
          // Network errors, 5xx, or timeouts must NOT wipe a valid session.
          if (err?.response?.status === 401) {
            tokenUtils.removeToken();
          }
        }
      }
      setIsInitializing(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.login(credentials);

      tokenUtils.setTokens(response.data.access, response.data.refresh);
      setUser(response.data.user);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestEmailCode = async (email: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await authApi.requestEmailCode({email});
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmailCode = async (
    credentials: EmailCodeCredentials
  ): Promise<EmailCodeLoginResult> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.verifyEmailCode(credentials);

      if (response.data.requires_registration) {
        return "requires_registration";
      }

      if (!response.data.access || !response.data.refresh || !response.data.user) {
        throw new Error(response.data.message || "Login failed");
      }

      tokenUtils.setTokens(response.data.access, response.data.refresh);
      setUser(response.data.user);
      return true;
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<RegisterPendingResponse> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.register(data);
      return response.data;
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistrationEmail = async (
    credentials: EmailCodeCredentials
  ): Promise<User> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.verifyRegistrationEmail(credentials);
      if (!response.data.access || !response.data.refresh || !response.data.user) {
        throw new Error(response.data.message || "Verificación fallida");
      }
      tokenUtils.setTokens(response.data.access, response.data.refresh);
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (email: string): Promise<ResendVerificationResponse> => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authApi.resendVerification({email});
      return response.data;
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
    clearAllRecentVisits();
    setUser(null);
    setError(null);
    router.push("/");
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.updateProfile(data);
      setUser(response.data.user);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
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
      setUser(response.data.user);
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
    isInitializing,
    isLoading,
    isAuthenticated,
    login,
    requestEmailCode,
    loginWithEmailCode,
    register,
    verifyRegistrationEmail,
    resendVerification,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
