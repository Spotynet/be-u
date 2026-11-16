"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {homePathForRole} from "@/lib/roles";

/** Keeps login/register for guests only; logged-in users go into the app. */
export function RedirectIfAuthenticated({children}: {children: React.ReactNode}) {
  const {isAuthenticated, isInitializing, user} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace(homePathForRole(user?.role));
    }
  }, [isAuthenticated, isInitializing, router, user?.role]);

  // Only gate on the initial session check — not on auth actions like
  // requestEmailCode, which would unmount LoginForm and reset its step state.
  if (isInitializing || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
