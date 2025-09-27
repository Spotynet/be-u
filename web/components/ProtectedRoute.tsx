"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  requireRoles?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute = ({
  children,
  redirectTo = "/login",
  requireAuth = true,
  requireRoles = [],
  fallback,
}: ProtectedRouteProps) => {
  const {isAuthenticated, isLoading, user} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, requireAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return fallback || null;
  }

  // Check if specific roles are required
  if (requireRoles.length > 0 && user) {
    const hasRequiredRole = requireRoles.some((role) => {
      if (role === "staff") return user.isStaff;
      if (role === "superuser") return user.isSuperuser;
      return false;
    });

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-foreground-secondary mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors">
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
