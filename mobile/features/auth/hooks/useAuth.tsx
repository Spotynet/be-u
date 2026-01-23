import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {authApi, tokenUtils, tokenRefreshScheduler, notificationApi} from "@/lib/api";
import {getExpoPushToken, getPlatformLabel} from "@/lib/pushNotifications";
import {AuthContextType, AuthState, LoginCredentials, RegisterCredentials, EmailCodeCredentials} from "../types";
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

          // Start background token refresh
          tokenRefreshScheduler.start();

          // Register push token (best-effort)
          try {
            const token = await getExpoPushToken();
            if (token) {
              await notificationApi.registerPushToken({token, platform: getPlatformLabel()});
            }
          } catch (_) {
            // ignore push registration errors
          }
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

      // Start background token refresh
      tokenRefreshScheduler.start();

      // Register push token (best-effort)
      try {
        const token = await getExpoPushToken();
        if (token) {
          await notificationApi.registerPushToken({token, platform: getPlatformLabel()});
        }
      } catch (_) {
        // ignore push registration errors
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Login failed",
      }));
      throw error;
    }
  };

  const requestEmailCode = async (email: string) => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));
      await authApi.requestEmailCode({email});
      setState((prev) => ({...prev, isLoading: false}));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to send code",
      }));
      throw error;
    }
  };

  const loginWithEmailCode = async (credentials: EmailCodeCredentials) => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));
      const response = await authApi.verifyEmailCode(credentials);

      await tokenUtils.setTokens(response.data.access, response.data.refresh);
      setState((prev) => ({
        ...prev,
        user: response.data.user,
        isLoading: false,
      }));

      tokenRefreshScheduler.start();

      // Register push token (best-effort)
      try {
        const token = await getExpoPushToken();
        if (token) {
          await notificationApi.registerPushToken({token, platform: getPlatformLabel()});
        }
      } catch (_) {
        // ignore push registration errors
      }
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

      // Start background token refresh
      tokenRefreshScheduler.start();

      // Register push token (best-effort)
      try {
        const token = await getExpoPushToken();
        if (token) {
          await notificationApi.registerPushToken({token, platform: getPlatformLabel()});
        }
      } catch (_) {
        // ignore push registration errors
      }
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
      console.log("🔓 Auth logout: Calling API logout...");
      console.log(
        "🔓 Auth logout: API URL:",
        "https://stg.be-u.ai/api"
      );

      const response = await authApi.logout();
      console.log("🔓 Auth logout: API logout successful", response);
    } catch (error: any) {
      console.log("🔓 Auth logout: API logout failed, continuing with local logout:");
      console.log("🔓 Auth logout: Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      // Continue with logout even if API call fails
    } finally {
      console.log("🔓 Auth logout: Clearing tokens and updating state...");
      // Stop background token refresh
      tokenRefreshScheduler.stop();

      // Clear stored tokens
      await tokenUtils.removeToken();
      setState({
        user: null,
        isLoading: false,
        error: null,
      });
      console.log("🔓 Auth logout: Logout completed");
    }
  };

  const refreshToken = async () => {
    try {
      // Refresh user data by fetching latest profile
      const response = await authApi.getProfile();
      setState((prev) => ({
        ...prev,
        user: response.data.user, // Update user with latest data including username
        isLoading: false,
      }));
    } catch (error) {
      // If refresh fails, try to check auth status
      try {
        await checkAuthStatus();
      } catch (e) {
        // If that also fails, logout user
        logout();
      }
    }
  };

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    login,
    requestEmailCode,
    loginWithEmailCode,
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
