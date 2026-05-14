"use client";

import React, {useState, useEffect, createContext, useContext, ReactNode} from "react";
import {useRouter} from "next/navigation";
import {authApi, tokenUtils, errorUtils} from "@/lib/api";
import {
  AuthContextType,
  EmailCodeCredentials,
  EmailCodeLoginResult,
  LoginCredentials,
  RegisterData,
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
          setUser(response.data.user);
        } catch {
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

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.register(data);

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
    isLoading,
    isAuthenticated,
    login,
    requestEmailCode,
    loginWithEmailCode,
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
