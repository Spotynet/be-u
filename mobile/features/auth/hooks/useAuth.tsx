import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {authApi} from "../services/authApi";
import {AuthContextType, AuthState, LoginCredentials, RegisterCredentials} from "../types";
import {User} from "@/types/global";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Check for existing auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setState((prev) => ({...prev, isLoading: true}));
      // TODO: Check for stored token and validate
      // For now, just set loading to false
      setState((prev) => ({...prev, isLoading: false}));
    } catch (error) {
      setState((prev) => ({...prev, isLoading: false, error: "Failed to check auth status"}));
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));
      const response = await authApi.login(credentials);

      // TODO: Store token securely
      setState((prev) => ({
        ...prev,
        user: response.data.user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Login failed",
      }));
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));
      const response = await authApi.register(credentials);

      // TODO: Store token securely
      setState((prev) => ({
        ...prev,
        user: response.data.user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Registration failed",
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // TODO: Clear stored token
      setState({
        user: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken();
      // TODO: Update stored token
    } catch (error) {
      // If refresh fails, logout user
      logout();
    }
  };

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
