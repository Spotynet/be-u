"use client";

import {useState, useEffect, createContext, useContext, ReactNode} from "react";
import {useRouter} from "next/navigation";
import {authApi, tokenUtils, ApiError} from "@/lib/api";
import {User, LoginCredentials, RegisterData} from "@/types/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  error: string | null;
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

      // Redirect to home page
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Login failed");
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

      // Redirect to home page
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenUtils.removeToken();
    setUser(null);
    router.push("/login");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

