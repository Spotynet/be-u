import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {authApi, tokenUtils} from "@/lib/api";
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

      // Check if token exists
      const isAuth = await tokenUtils.isAuthenticated();

      if (isAuth) {
        // Validate token by fetching profile
        try {
          const response = await authApi.getProfile();
          setState((prev) => ({
            ...prev,
            user: response.data.user,
            isLoading: false,
          }));
        } catch (error) {
          // Token is invalid, clear it
          await tokenUtils.removeToken();
          setState((prev) => ({...prev, user: null, isLoading: false}));
        }
      } else {
        setState((prev) => ({...prev, isLoading: false}));
      }
    } catch (error) {
      setState((prev) => ({...prev, isLoading: false, error: "Failed to check auth status"}));
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));
      const response = await authApi.login(credentials);

      // Store JWT tokens
      await tokenUtils.setTokens(response.data.access, response.data.refresh);

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

      // Store JWT tokens
      await tokenUtils.setTokens(response.data.access, response.data.refresh);

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
      // Clear stored token
      await tokenUtils.removeToken();
      setState({
        user: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const refreshToken = async () => {
    try {
      // Check if still authenticated
      await checkAuthStatus();
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
